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


import com.product.product.DTOs.ProductCreateDTO;
import com.product.product.DTOs.ProductUpdateDTO;
import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.IProductService;
import com.product.product.Models.Product;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/products")
public class ProductController {
    @Autowired
    private IProductService productService;

    @PostMapping
    public ResponseEntity<GlobalResponse<Product>> create(@RequestBody @Valid ProductCreateDTO productDTO) {
        Product product = productService.create(productDTO);
        return new ResponseEntity<>(new GlobalResponse<>(product), HttpStatus.CREATED);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<GlobalResponse<Product>> update(@PathVariable Long productId, @RequestBody @Valid ProductUpdateDTO productDTO) {
        Product product = productService.update(productId, productDTO);
        return new ResponseEntity<>(new GlobalResponse<>(product), HttpStatus.OK);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId) {
        productService.delete(productId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
