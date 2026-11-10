package com.product.product.Interfaces;

import java.util.List;

import com.product.product.DTOs.Product_VariantCreateDTO;
import com.product.product.DTOs.Product_VariantUpdateDTO;
import com.product.product.Models.Product_Variant;

public interface IProductVariantService {
    List<Product_Variant> findAll(Long productId);

    Product_Variant findById(Long productId, Long variantId);

    Product_Variant create(Long productId, Product_VariantCreateDTO variantDTO);

    Product_Variant update(Long productId, Long variantId, Product_VariantUpdateDTO variantDTO);

    void delete(Long productId, Long variantId);

    void DecrementStock(Long productId, Long variantId, Integer quantity);

    void IncrementStock(Long productId, Long variantId, Integer quantity);
}
