package com.product.product.DTOs;

import java.math.BigDecimal;

import com.product.product.enums.ProductStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record ProductUpdateDTO(
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    String name,

    @Size(min = 3, message = "Product description must be at least 3 characters long")
    String description,

    ProductStatus status,

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    BigDecimal price,

    Long categoryId
) {

}
