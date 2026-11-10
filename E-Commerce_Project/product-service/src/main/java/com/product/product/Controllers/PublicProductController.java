package com.product.product.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.DTOs.Response.ProductDetailsDTO;
import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.IProductService;

@RestController
@RequestMapping("/products")
public class PublicProductController {
    @Autowired
    private IProductService productService;

    @GetMapping
    public ResponseEntity<GlobalResponse<List<ProductDetailsDTO>>> findAll() {
        List<ProductDetailsDTO> productDetails = productService.findAllDetails();
        return new ResponseEntity<>(new GlobalResponse<>(productDetails), HttpStatus.OK);
    }

    @GetMapping("/{productId}")
    public ResponseEntity<GlobalResponse<ProductDetailsDTO>> findById(@PathVariable Long productId) {
        ProductDetailsDTO productDetails = productService.findDetailsById(productId);
        return new ResponseEntity<>(new GlobalResponse<>(productDetails), HttpStatus.OK);
    }
}
