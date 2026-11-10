package com.product.product.Controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.product.product.DTOs.CategoryCreateDTO;
import com.product.product.DTOs.CategoryUpdateDTO;
import com.product.product.Exception_Handler.GlobalResponse;
import com.product.product.Interfaces.ICategoryService;
import com.product.product.Models.Category;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;



@RestController
@RequestMapping("/admin/categories")
public class CategoryController {
    @Autowired
    private ICategoryService categoryService;

    @PostMapping
    public ResponseEntity<GlobalResponse<Category>> create(@RequestBody @Valid CategoryCreateDTO categoryDTO) {
        Category category = categoryService.create(categoryDTO);
        return new ResponseEntity<>(new GlobalResponse<>(category), HttpStatus.CREATED);
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<GlobalResponse<Category>> update(@PathVariable Long categoryId, @RequestBody @Valid CategoryUpdateDTO categoryDTO) {
        Category category = categoryService.update(categoryId, categoryDTO);
        return new ResponseEntity<>(new GlobalResponse<>(category), HttpStatus.OK);
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(@PathVariable Long categoryId) {
        categoryService.delete(categoryId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
