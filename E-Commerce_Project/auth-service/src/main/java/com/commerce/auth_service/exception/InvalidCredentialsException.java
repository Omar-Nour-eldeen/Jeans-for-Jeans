package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;


public class InvalidCredentialsException extends BaseApiException {

    public InvalidCredentialsException() {
        super("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    public InvalidCredentialsException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
