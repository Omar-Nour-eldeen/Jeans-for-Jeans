package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;

public class OAuthAccountException extends BaseApiException {

    public OAuthAccountException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

