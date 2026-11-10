package com.commerce.auth_service.exception;

import org.springframework.http.HttpStatus;


public class ResourceNotFoundException extends BaseApiException {

    public ResourceNotFoundException(String resourceName, String id) {
        super(resourceName + " not found with id: " + id, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}