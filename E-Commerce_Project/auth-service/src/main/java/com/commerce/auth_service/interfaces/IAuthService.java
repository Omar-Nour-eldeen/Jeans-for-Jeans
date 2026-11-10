package com.commerce.auth_service.interfaces;

import com.commerce.auth_service.dto.*;

public interface IAuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String rawRefreshToken);
    void logout(String rawRefreshToken);
    void logoutAll(String userId);
    AuthResponse getCurrentUser(String userId);
}
