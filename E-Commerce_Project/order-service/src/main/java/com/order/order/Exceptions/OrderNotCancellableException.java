package com.order.order.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class OrderNotCancellableException extends RuntimeException {
    public OrderNotCancellableException(String orderId) {
        super("Order " + orderId
                + " cannot be cancelled. Either its status does not allow cancellation or the cancellation window has passed.");
    }
}
