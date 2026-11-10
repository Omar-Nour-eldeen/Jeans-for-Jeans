package com.product.product.Controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.ICategoryService;
import com.product.product.Interfaces.IProductService;
import com.product.product.Models.Category;
import com.product.product.Models.Product;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/categories")
public class PublicCategoryController {
    @Autowired
    private ICategoryService categoryService;

    @Autowired
    private IProductService productService;

    @GetMapping
    public ResponseEntity<GlobalResponse<List<Category>>> findAll() {
        List<Category> categories = categoryService.findAll();
        return new ResponseEntity<>(new GlobalResponse<>(categories), HttpStatus.OK);
    }
    
    @GetMapping("/{categoryId}")
    public ResponseEntity<GlobalResponse<Category>> findById(@PathVariable Long categoryId) {
        Category category = categoryService.findById(categoryId);
        return new ResponseEntity<>(new GlobalResponse<>(category), HttpStatus.OK);
    }

    @GetMapping("/{categoryId}/subcategories")
    public ResponseEntity<GlobalResponse<List<Category>>> findAllSubcategories(@PathVariable Long categoryId) {
        List<Category> subcategories = categoryService.getSubcategories(categoryId);
        return new ResponseEntity<>(new GlobalResponse<>(subcategories), HttpStatus.OK);
    }

    @GetMapping("/{categoryId}/products")
    public ResponseEntity<GlobalResponse<List<Product>>> findAllProductsByCategory(@PathVariable Long categoryId) {
        List<Product> products = productService.findAllByCategoryId(categoryId);
        return new ResponseEntity<>(new GlobalResponse<>(products), HttpStatus.OK);
    }

}
