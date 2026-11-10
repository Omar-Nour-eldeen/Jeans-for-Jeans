package com.product.product.DTOs;

import jakarta.validation.constraints.NotBlank;

public record Product_ImageCreateDTO(

    @NotBlank(message = "Image URL is required")
    String s3Url
) {

}
