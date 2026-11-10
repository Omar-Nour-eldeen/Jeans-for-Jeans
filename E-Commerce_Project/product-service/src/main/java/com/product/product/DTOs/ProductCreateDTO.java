package com.product.product.DTOs;

import java.math.BigDecimal;

import com.product.product.enums.ProductStatus;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


public record ProductCreateDTO(

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    String name,

    @NotBlank(message = "Product description is required")
    @Size(min = 3, message = "Product description must be at least 3 characters long")
    String description,

    @NotNull(message = "Product status is required")
    ProductStatus status,

    @NotNull(message = "Product price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    BigDecimal price,

    @NotNull(message = "Product category is required")
    Long categoryId
) {

}
