package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;

public class PasswordMismatchException extends BaseApiException {

    public PasswordMismatchException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}