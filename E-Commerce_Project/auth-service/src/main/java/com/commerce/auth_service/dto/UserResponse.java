package com.commerce.auth_service.dto;

import java.time.LocalDateTime;
import java.util.Set;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private String          id;
    private String          name;
    private String          email;
    private String          role;
    private String          status;
    private Set<String>     permissions;
    private LocalDateTime   createdAt;
}
