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
import org.springframework.stereotype.Service;

import com.commerce.auth_service.entity.EmailVerificationToken;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.exception.AccountNotActiveException;
import com.commerce.auth_service.exception.ResourceNotFoundException;
import com.commerce.auth_service.exception.TokenInvalidException;
import com.commerce.auth_service.interfaces.IEmailVerificationService;
import com.commerce.auth_service.repository.EmailVerificationTokenRepository;
import com.commerce.auth_service.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailVerificationServiceImp implements IEmailVerificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private EmailServiceImp emailService;

    @Value("${app.verification-token-expiry-hours:24}")
    private int tokenExpiryHours;

    @Transactional
    public void createVerificationTokenAndSendEmail(User user) {
        tokenRepository.deleteAllByUserId(user.getId());

        String rawToken = generateSecureToken();
        String tokenHash = hashWithSHA256(rawToken);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusHours(tokenExpiryHours))
                .used(false)
                .build();

        tokenRepository.save(token);

        emailService.sendEmailVerificationEmail(user.getEmail(), rawToken);
        log.info("Email verification token sent to: {}", user.getEmail());
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        String tokenHash = hashWithSHA256(rawToken);

        EmailVerificationToken token = tokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new TokenInvalidException("Verification link is invalid or does not exist."));

        if (token.isUsed()) {
            throw new TokenInvalidException("This verification link has already been used.");
        }

        if (token.isExpired()) {
            tokenRepository.delete(token);
            throw new TokenInvalidException("Verification link has expired. Please request a new one.");
        }

        User user = token.getUser();
        user.setStatus(User.Status.ACTIVE);
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("User email successfully verified: {}", user.getEmail());
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));

        if (user.getStatus() == User.Status.ACTIVE) {
            throw new IllegalStateException("This account is already verified.");
        }

        createVerificationTokenAndSendEmail(user);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredAndUsed(LocalDateTime.now());
        log.info("Expired email verification tokens cleaned up");
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashWithSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}

