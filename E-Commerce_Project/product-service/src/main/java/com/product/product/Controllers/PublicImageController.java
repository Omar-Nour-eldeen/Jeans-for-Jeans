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
import com.product.product.Interfaces.IProductImageService;
import com.product.product.Models.Product_Image;

@RestController
@RequestMapping("/products/{productId}/images")
public class PublicImageController {
    @Autowired
    private IProductImageService productImageService;

    @GetMapping
    public ResponseEntity<GlobalResponse<List<Product_Image>>> findAll(@PathVariable Long productId) {
        List<Product_Image> images = productImageService.findAll(productId);
        return new ResponseEntity<>(new GlobalResponse<>(images), HttpStatus.OK);
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<GlobalResponse<Product_Image>> findById(@PathVariable Long productId, @PathVariable Long imageId) {
        Product_Image image = productImageService.findById(productId, imageId);
        return new ResponseEntity<>(new GlobalResponse<>(image), HttpStatus.OK);
    }
}
