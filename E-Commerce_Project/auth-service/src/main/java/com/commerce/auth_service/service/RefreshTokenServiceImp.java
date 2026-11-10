package com.commerce.auth_service.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.commerce.auth_service.entity.RefreshToken;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.exception.TokenInvalidException;
import com.commerce.auth_service.interfaces.IRefreshTokenService;
import com.commerce.auth_service.repository.RefreshTokenRepository;

import jakarta.transaction.Transactional;

@Service
public class RefreshTokenServiceImp implements IRefreshTokenService {
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token.expiration-days:7}")
    private int refreshTokenExpirationDays;
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        long activeSessions = refreshTokenRepository
                .countActiveTokensByUserId(user.getId(), LocalDateTime.now());

        if (activeSessions >= 5) {
            refreshTokenRepository.revokeAllByUserId(user.getId());
        }

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(generateSecureToken())
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenInvalidException("Refresh token not found"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new TokenInvalidException("Refresh token has expired. Please log in again.");
        }

        if (refreshToken.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(refreshToken.getUser().getId());
            throw new TokenInvalidException("Refresh token was revoked. Security alert triggered.");
        }

        return refreshToken;
    }

    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken) {
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        return createRefreshToken(oldToken.getUser());
    }

    @Transactional
    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void revokeAllUserTokens(String userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Scheduled(cron = "0 0 3 * * *")   
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredAndRevoked(LocalDateTime.now());
    }


    private String generateSecureToken() {
        byte[] tokenBytes = new byte[64];
        new SecureRandom().nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }
}