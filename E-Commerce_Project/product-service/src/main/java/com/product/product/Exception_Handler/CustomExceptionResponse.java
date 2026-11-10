package com.product.product.Exception_Handler;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class CustomExceptionResponse extends RuntimeException {
    private int code;
    private String message;

    public static CustomExceptionResponse Conflict(String message) {
        return new CustomExceptionResponse(409, message);
    }

    public static CustomExceptionResponse InternalServerError(String message) {
        return new CustomExceptionResponse(500, message);
    }

    public static CustomExceptionResponse NotFound(String message) {
        return new CustomExceptionResponse(404, message);
    }

    public static CustomExceptionResponse BadRequest(String message) {
        return new CustomExceptionResponse(400, message);
    }

}
