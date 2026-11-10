package com.commerce.auth_service.dto;
import java.util.Set;

import lombok.*;


@Data
@AllArgsConstructor
@Builder
public class AuthResponse {
    private final String accessToken;
    private final String refreshToken;
    private final String tokenType;     
    private final long expiresIn;      
    private final String role;
    private final UserSummary user;
    private final Set<String> permissions;

    @Getter
    @Builder
    public static class UserSummary {
        private final String id;
        private final String name;
        private final String email;
        private final String status;
    }
}
