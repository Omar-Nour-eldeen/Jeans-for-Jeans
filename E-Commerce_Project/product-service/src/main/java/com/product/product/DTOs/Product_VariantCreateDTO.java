package com.product.product.DTOs;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record Product_VariantCreateDTO(

    @NotBlank(message = "Size is required")
    @Size(max = 50, message = "Variant size must be at most 50 characters")
    String size,

    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity must be >= 0")
    Integer stockQuantity
    ) {
}
