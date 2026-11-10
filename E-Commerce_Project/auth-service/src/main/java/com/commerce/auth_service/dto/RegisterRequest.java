package com.commerce.auth_service.dto;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
public class RegisterRequest {
    @NotNull
    @NotBlank
    @NotEmpty
    private String name;
    @NotNull
    @NotBlank
    @NotEmpty
    @Email
    private String email;
    @NotNull
    @NotBlank
    @NotEmpty
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
}
