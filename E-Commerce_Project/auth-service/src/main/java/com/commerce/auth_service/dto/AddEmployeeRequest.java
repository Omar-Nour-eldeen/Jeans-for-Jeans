package com.commerce.auth_service.dto;

import java.util.Set;

import com.commerce.auth_service.entity.User;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor 
@AllArgsConstructor
@Builder
public class AddEmployeeRequest {

    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "Role is required")
    private User.Role role;

    @NotEmpty(message = "permissions cannot be empty")
    private Set<String> permissions;
}
