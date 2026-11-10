package com.commerce.auth_service.interfaces;

import java.util.Set;

import com.commerce.auth_service.entity.User;

public interface IJwtService {
    String generateToken(User user, Set<String> permissions);
    String extractUserId(String token);
    Long expirationTime();
}
