package com.product.product.DTOs;

import jakarta.validation.constraints.Size;

public record CategoryUpdateDTO(

    @Size(min = 3, max = 50, message = "Category name must be between 3 and 50 characters")
    String name,

    Long parentId
) {

}
