package com.product.product.Controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.DTOs.Product_ImageCreateDTO;
import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.IProductImageService;
import com.product.product.Models.Product_Image;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/products/{productId}/images")
public class ImageController {
    @Autowired
    private IProductImageService imageService;

    @PostMapping
    public ResponseEntity<GlobalResponse<Product_Image>> create(@PathVariable Long productId, @RequestBody @Valid Product_ImageCreateDTO imageDTO) {
        Product_Image image = imageService.create(productId, imageDTO);
        return new ResponseEntity<>(new GlobalResponse<>(image), HttpStatus.CREATED);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable Long imageId) {
        imageService.delete(productId, imageId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
