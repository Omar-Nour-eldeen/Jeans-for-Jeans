package com.userservice.userservices.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegisteredEvent {
    private String userId;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}
