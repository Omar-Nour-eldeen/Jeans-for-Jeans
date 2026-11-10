package com.userservice.userservices.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SupportRequest {

    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 150, message = "Subject must be between 5 and 150 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 2000, message = "Message must be between 10 and 2000 characters")
    private String message;
}
