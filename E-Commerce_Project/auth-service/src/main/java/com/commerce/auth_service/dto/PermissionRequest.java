package com.commerce.auth_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
    public class PermissionRequest {
        @NotBlank(message = "Permission name is required")
        private String permission;
    }
