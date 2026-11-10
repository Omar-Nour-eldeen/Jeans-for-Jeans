package com.product.product.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.DTOs.Product_VariantCreateDTO;
import com.product.product.DTOs.Product_VariantUpdateDTO;
import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.IProductVariantService;
import com.product.product.Models.Product_Variant;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/products/{productId}/variants")
public class VariantController {
    @Autowired
    private IProductVariantService variantService;

    @PostMapping
    public ResponseEntity<GlobalResponse<Product_Variant>> create(@PathVariable Long productId, @RequestBody @Valid Product_VariantCreateDTO variantDTO) {
        Product_Variant variant = variantService.create(productId, variantDTO);
        return new ResponseEntity<>(new GlobalResponse<>(variant), HttpStatus.CREATED);
    }

    @PutMapping("/{variantId}")
    public ResponseEntity<GlobalResponse<Product_Variant>> update(@PathVariable Long productId, @PathVariable Long variantId, @RequestBody @Valid Product_VariantUpdateDTO variantDTO) {
        Product_Variant variant = variantService.update(productId, variantId, variantDTO);
        return new ResponseEntity<>(new GlobalResponse<>(variant), HttpStatus.OK);
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable Long variantId) {
        variantService.delete(productId, variantId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
