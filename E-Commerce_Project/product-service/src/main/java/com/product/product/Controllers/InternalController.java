package com.product.product.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.Interfaces.IProductVariantService;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;


@RestController
@RequestMapping("/internal")
public class InternalController {
    @Autowired
    private IProductVariantService variantService;

    @PostMapping("products/{productId}/variants/{variantId}/decrement-stock/{quantity}")
    public void decrementStock(@PathVariable Long productId, @PathVariable Long variantId, @PathVariable Integer quantity) {
        variantService.DecrementStock(productId, variantId, quantity);
    }

    @PostMapping("products/{productId}/variants/{variantId}/increment-stock/{quantity}")
    public void incrementStock(@PathVariable Long productId, @PathVariable Long variantId, @PathVariable Integer quantity) {
        variantService.IncrementStock(productId, variantId, quantity);
    }
}
