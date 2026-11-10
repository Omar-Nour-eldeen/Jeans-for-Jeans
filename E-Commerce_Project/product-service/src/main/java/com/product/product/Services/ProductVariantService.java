package com.product.product.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.product.product.DTOs.Product_VariantCreateDTO;
import com.product.product.DTOs.Product_VariantUpdateDTO;
import com.product.product.Exception_Handler.CustomExceptionResponse;
import com.product.product.Interfaces.IProductService;
import com.product.product.Interfaces.IProductVariantService;
import com.product.product.Models.Product;
import com.product.product.Models.Product_Variant;
import com.product.product.REPOs.Product_VariantRepo;

@Service
public class ProductVariantService implements IProductVariantService {

    @Autowired
    private Product_VariantRepo variantRepo;
    
    @Autowired
    private IProductService productService;
    
    @Override
    public Product_Variant findById(Long productId, Long variantId) {
        productService.findById(productId);

        Product_Variant variant = variantRepo.findById(variantId)
            .orElseThrow(() -> CustomExceptionResponse.NotFound("Variant with id " + variantId + " not found for product " + productId));
        
        if (!variant.getProduct().getId().equals(productId)) {
            throw CustomExceptionResponse.BadRequest("Variant with id " + variantId + " does not belong to product " + productId);
        }
        
        return variant;
    }

    @Override
    public List<Product_Variant> findAll(Long productId) {
        productService.findById(productId);
        return variantRepo.findByProduct_Id(productId);
    }
    
    @Override
    public void delete(Long productId, Long variantId) {
        Product_Variant variant = findById(productId, variantId);
        variantRepo.delete(variant);
    }

    @Override
    public Product_Variant create(Long productId, Product_VariantCreateDTO variantDTO) {
        Product product = productService.findById(productId);

        Product_Variant variant = new Product_Variant();
        variant.setSize(variantDTO.size());
        variant.setStockQuantity(variantDTO.stockQuantity());
        variant.setProduct(product);
        return variantRepo.save(variant);
    }

    @Override
    public Product_Variant update(Long productId, Long variantId, Product_VariantUpdateDTO variantDTO) {
        Product_Variant variant = findById(productId, variantId);

        if (variantDTO.size() != null) {
            variant.setSize(variantDTO.size());
        }
        if (variantDTO.stockQuantity() != null) {
            variant.setStockQuantity(variantDTO.stockQuantity());
        }
        return variantRepo.save(variant);
    }

    @Override
    public void DecrementStock(Long productId, Long variantId, Integer quantity) {
        Product_Variant variant = findById(productId, variantId);
        if (variant.getStockQuantity() < quantity) {
            throw CustomExceptionResponse.BadRequest("Not enough items in stock");
        }
        if (quantity < 0) {
            throw CustomExceptionResponse.BadRequest("Quantity to decrement must be positive");
        }
        variant.setStockQuantity(variant.getStockQuantity() - quantity);
        variantRepo.save(variant);
    }

    @Override
    public void IncrementStock(Long productId, Long variantId, Integer quantity) {
        Product_Variant variant = findById(productId, variantId);
        if (quantity < 0) {
            throw CustomExceptionResponse.BadRequest("Quantity to increment must be positive");
        }
        variant.setStockQuantity(variant.getStockQuantity() + quantity);
        variantRepo.save(variant);
    }


}
