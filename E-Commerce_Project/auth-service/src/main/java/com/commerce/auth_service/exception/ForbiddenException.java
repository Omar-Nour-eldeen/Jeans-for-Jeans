package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;


public class ForbiddenException extends BaseApiException {

    public ForbiddenException() {
        super("You do not have permission to access this resource", HttpStatus.FORBIDDEN);
    }

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}