package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;


public class TokenInvalidException extends BaseApiException {

    public TokenInvalidException() {
        super("Token is invalid or expired", HttpStatus.UNAUTHORIZED);
    }

    public TokenInvalidException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
