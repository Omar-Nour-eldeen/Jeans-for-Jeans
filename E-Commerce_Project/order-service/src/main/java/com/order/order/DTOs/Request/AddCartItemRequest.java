package com.order.order.DTOs.Request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddCartItemRequest {

    @NotBlank(message = "productId is required")
    private String productId;
    @NotBlank(message = "variantId is required")
    private String variantId;
    @Min(value = 1, message = "Quantity must be at least 1")
    @Max(value = 99, message = "Quantity cannot exceed 99")
    private int quantity;
}