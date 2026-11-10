package com.commerce.auth_service.service;

import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)  
                .status(User.Status.ACTIVE)  
                .build();

        userRepository.save(user);
        userEventPublisher.publishUserRegistered(
                UserRegisteredEvent.from(user));
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