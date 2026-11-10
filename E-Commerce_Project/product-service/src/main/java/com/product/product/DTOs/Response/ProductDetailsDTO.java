package com.product.product.DTOs.Response;

import java.math.BigDecimal;
import java.util.List;

import com.product.product.enums.ProductStatus;

public record ProductDetailsDTO(
    Long id,
    String name,
    String description,
    BigDecimal price,
    ProductStatus status,
    Long categoryId,
    String category,
    String categoryParent,
    List<String> images,
    List<VariantResponseDTO> variants
) {

}
