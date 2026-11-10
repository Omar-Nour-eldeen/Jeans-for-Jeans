package com.commerce.auth_service.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.commerce.auth_service.dto.ResetPasswordRequest;
import com.commerce.auth_service.entity.PasswordResetToken;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.exception.PasswordMismatchException;
import com.commerce.auth_service.exception.TokenInvalidException;
import com.commerce.auth_service.interfaces.IPasswordResetService;
import com.commerce.auth_service.repository.PasswordResetTokenRepository;
import com.commerce.auth_service.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PasswordResetServiceImp implements IPasswordResetService {
    
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordResetTokenRepository tokenRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailServiceImp emailService;

    @Value("${app.reset-token-expiry-minutes:15}")
    private int tokenExpiryMinutes;

    @Transactional
    public void forgotPassword(String email) {

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}",
                    email);
            return;
        }

        User user = userOpt.get();

        if (!user.getStatus().isActive()) {
            log.warn("Password reset for inactive user: {}", email);
            return; 
        }

        tokenRepository.deleteAllByUserId(user.getId());

        String rawToken = generateSecureToken();
        String tokenHash = hashWithSHA256(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now()
                        .plusMinutes(tokenExpiryMinutes))
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);

        log.info("Password reset token generated for user: {}", email);
    }


    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        if (!request.getNewPassword()
                .equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException(
                    "New password and confirm password do not match");
        }

        String tokenHash = hashWithSHA256(request.getToken());

        PasswordResetToken resetToken = tokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new TokenInvalidException(
                        "Reset token is invalid or does not exist"));

        if (resetToken.isUsed()) {
            throw new TokenInvalidException(
                    "Reset token has already been used");
        }

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new TokenInvalidException(
                    "Reset token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

    }


    @Scheduled(cron = "0 0 * * * *") 
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredAndUsed(LocalDateTime.now());
        log.info("Expired password reset tokens cleaned up");
    }


    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    private String hashWithSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                    input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1)
                    hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}