package com.order.order.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class CartEmptyException extends RuntimeException {
    public CartEmptyException() {
        super("Cart is empty. Add items before placing an order.");
    }
}
