package com.product.product.Interfaces;

import java.util.List;

import com.product.product.DTOs.CategoryCreateDTO;
import com.product.product.DTOs.CategoryUpdateDTO;
import com.product.product.Models.Category;

public interface ICategoryService {
    Category findById(Long categoryId);

    List<Category> findAll();

    void delete(Long categoryId);

    Category create(CategoryCreateDTO categoryDTO);

    Category update(Long categoryId, CategoryUpdateDTO categoryDTO);

    List<Category> getSubcategories(Long parentId);
}
