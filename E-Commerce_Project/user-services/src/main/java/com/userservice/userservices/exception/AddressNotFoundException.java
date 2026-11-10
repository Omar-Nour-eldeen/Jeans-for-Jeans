package com.userservice.userservices.exception;

public class AddressNotFoundException extends RuntimeException {
    public AddressNotFoundException(String addressId) {
        super("Address not found with id: " + addressId);
    }
}
