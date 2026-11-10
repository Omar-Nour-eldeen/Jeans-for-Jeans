package com.commerce.auth_service.event;

import java.time.LocalDateTime;

import com.commerce.auth_service.entity.User;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegisteredEvent {

    private String        userId;
    private String        email;
    private String        role;
    private String        status;
    private LocalDateTime createdAt;

    public static UserRegisteredEvent from(User user) {
        return UserRegisteredEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}