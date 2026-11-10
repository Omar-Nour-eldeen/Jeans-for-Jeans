package com.commerce.auth_service.interfaces;


import com.commerce.auth_service.entity.RefreshToken;
import com.commerce.auth_service.entity.User;

public interface IRefreshTokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken validateRefreshToken(String token);
    RefreshToken rotateRefreshToken(RefreshToken oldToken);
    void revokeToken(String token);
    void revokeAllUserTokens(String userId);
    void cleanupExpiredTokens();
}