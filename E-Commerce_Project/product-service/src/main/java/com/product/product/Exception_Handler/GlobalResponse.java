package com.product.product.Exception_Handler;

import java.util.List;

import lombok.Getter;

@Getter
public class GlobalResponse<T> {
    public final static String Success = "Success";
    public final static String Error = "Error";

    private final String status;
    private final T data;
    private final List<ErrorItem> errors;

    public GlobalResponse(List<ErrorItem> errors) {
        this.status = Error;
        this.data = null;
        this.errors = errors;
    }

    public GlobalResponse(T data) {
        this.status = Success;
        this.data = data;
        this.errors = null;
    }

    public record ErrorItem(String message) {
    }
}
