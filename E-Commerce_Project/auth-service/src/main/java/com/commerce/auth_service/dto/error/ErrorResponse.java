package com.commerce.auth_service.dto.error;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;
import lombok.*;


@Getter
@Builder 
public class ErrorResponse {

    private final LocalDateTime timestamp;
    private final int status;
    private final String error; 
    private final String message; 
    private final String path; 

    public static ErrorResponse of(HttpStatus httpStatus,
            String message,
            HttpServletRequest request) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(httpStatus.value())
                .error(httpStatus.getReasonPhrase()) 
                .message(message)
                .path(request.getRequestURI())
                .build();
    }
}