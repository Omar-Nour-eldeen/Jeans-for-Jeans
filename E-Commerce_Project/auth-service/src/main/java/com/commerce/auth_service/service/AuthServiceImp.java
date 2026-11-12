package com.commerce.auth_service.service;

import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.commerce.auth_service.dto.*;
import com.commerce.auth_service.entity.RefreshToken;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.event.UserEventPublisher;
import com.commerce.auth_service.event.UserRegisteredEvent;
import com.commerce.auth_service.exception.AccountNotActiveException;
import com.commerce.auth_service.exception.EmailAlreadyExistsException;
import com.commerce.auth_service.exception.InvalidCredentialsException;
import com.commerce.auth_service.exception.ResourceNotFoundException;
import com.commerce.auth_service.interfaces.IAuthService;
import com.commerce.auth_service.repository.UserRepository;


@Service
public class AuthServiceImp implements IAuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImp.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtServiceImp jwtService;
    @Autowired
    private RefreshTokenServiceImp   refreshTokenService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private PermissionServiceImp permissionService;
    @Autowired
    private UserEventPublisher  userEventPublisher;
    @Autowired
    private EmailVerificationServiceImp emailVerificationService;
    @Autowired
    private RestTemplate restTemplate;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)  
                .status(User.Status.PENDING)  
                .authProvider(User.AuthProvider.LOCAL)
                .build();

        userRepository.save(user);
        userEventPublisher.publishUserRegistered(
                UserRegisteredEvent.from(user));

        emailVerificationService.createVerificationTokenAndSendEmail(user);

        return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .tokenType("Bearer")
                .expiresIn(0L)
                .role(user.getRole().name())
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .status(user.getStatus().name())
                        .build())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (!user.getStatus().isActive()) {
            throw new AccountNotActiveException(
                "Account is " + user.getStatus().name().toLowerCase() +
                ". Please verify your email or contact support."
            );
        }

        return buildAuthResponse(user);
    }

    @Transactional
    @Override
    public AuthResponse loginWithGoogle(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new InvalidCredentialsException("Google ID token is required");
        }

        GoogleTokenPayload payload;
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim();
            payload = restTemplate.getForObject(url, GoogleTokenPayload.class);
        } catch (Exception ex) {
            log.error("Failed to verify Google ID token: {}", ex.getMessage());
            throw new InvalidCredentialsException("Invalid or expired Google token");
        }

        if (payload == null || payload.getEmail() == null || payload.getEmail().isBlank()) {
            throw new InvalidCredentialsException("Failed to retrieve email from Google account");
        }

        if (googleClientId != null && !googleClientId.isBlank()) {
            if (!googleClientId.equals(payload.getAud())) {
                log.warn("Google token audience mismatch. Expected: {}, Got: {}", googleClientId, payload.getAud());
                throw new InvalidCredentialsException("Invalid token audience");
            }
        }

        if (!"true".equalsIgnoreCase(payload.getEmailVerified())) {
            throw new InvalidCredentialsException("Google account email is not verified");
        }

        String email = payload.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            String name = payload.getName();
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }
            user = User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(User.Role.USER)
                    .status(User.Status.ACTIVE)
                    .authProvider(User.AuthProvider.GOOGLE)
                    .build();
            userRepository.save(user);
            userEventPublisher.publishUserRegistered(UserRegisteredEvent.from(user));
        } else {
            if (user.getAuthProvider() == null) {
                user.setAuthProvider(User.AuthProvider.GOOGLE);
            }
            if (user.getStatus() == User.Status.PENDING) {
                user.setStatus(User.Status.ACTIVE);
                userRepository.save(user);
            } else if (!user.getStatus().isActive()) {
                throw new AccountNotActiveException(
                    "Account is " + user.getStatus().name().toLowerCase() + ". Please contact support."
                );
            }
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        RefreshToken oldToken = refreshTokenService.validateRefreshToken(rawRefreshToken);
        Set<String> permissions = permissionService.getEffectivePermissions(oldToken.getUser().getId());


        User user = oldToken.getUser();

        if (!user.getStatus().isActive()) {
            refreshTokenService.revokeAllUserTokens(user.getId());
            throw new AccountNotActiveException("Account is no longer active.");
        }

        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(oldToken);

        String newAccessToken = jwtService.generateToken(user, permissions);

        return buildAuthResponse(user, newRefreshToken, newAccessToken);
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeToken(rawRefreshToken);
    }

    public void logoutAll(String userId) {
        refreshTokenService.revokeAllUserTokens(userId);
    }

    public AuthResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.getStatus().isActive()) {
            throw new AccountNotActiveException("Account is no longer active.");
        }

        Set<String> permissions = permissionService.getEffectivePermissions(user.getId());
        String accessToken = jwtService.generateToken(user, permissions);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(null)
                .tokenType("Bearer")
                .expiresIn(jwtService.expirationTime() / 1000)
                .role(user.getRole().name())
                .permissions(permissions)
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .status(user.getStatus().name())
                        .build())
                .build();
    }


        private AuthResponse buildAuthResponse(User user) {
        Set<String> permissions = permissionService.getEffectivePermissions(user.getId());
        String accessToken   = jwtService.generateToken(user, permissions);
        RefreshToken refresh = refreshTokenService.createRefreshToken(user);
        return buildAuthResponse(user, refresh, accessToken);
    }

    private AuthResponse buildAuthResponse(User user,
                                            RefreshToken refresh,
                                            String accessToken) {
        Set<String> permissions = permissionService.getEffectivePermissions(user.getId());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refresh.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.expirationTime()/1000)
                .role(user.getRole().name())
                .permissions(permissions)
                .user(AuthResponse.UserSummary.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .status(user.getStatus().name())
                        .build())
                .build();
    }


}