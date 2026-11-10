package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;

public class AccountNotActiveException extends BaseApiException {

    public AccountNotActiveException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}