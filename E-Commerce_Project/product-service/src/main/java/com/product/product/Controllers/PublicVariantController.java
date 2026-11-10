package com.product.product.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.IProductVariantService;
import com.product.product.Models.Product_Variant;

@RestController
@RequestMapping("/products/{productId}/variants")
public class PublicVariantController {
    @Autowired
    private IProductVariantService productVariantService;

    @GetMapping
    public ResponseEntity<GlobalResponse<List<Product_Variant>>> findAll(@PathVariable Long productId) {
        List<Product_Variant> variants = productVariantService.findAll(productId);
        return new ResponseEntity<>(new GlobalResponse<>(variants), HttpStatus.OK);
    }

    @GetMapping("/{variantId}")
    public ResponseEntity<GlobalResponse<Product_Variant>> findById(@PathVariable Long productId, @PathVariable Long variantId) {
        Product_Variant variant = productVariantService.findById(productId, variantId);
        return new ResponseEntity<>(new GlobalResponse<>(variant), HttpStatus.OK);
    }

}
