package com.product.product.DTOs;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record Product_VariantUpdateDTO(
    @Size(max = 50, message = "Variant size must be at most 50 characters")
    String size,

    @Min(value = 0, message = "Stock quantity must be >= 0")
    Integer stockQuantity
) {

}
