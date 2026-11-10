package com.product.product.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.product.product.DTOs.CategoryCreateDTO;
import com.product.product.DTOs.CategoryUpdateDTO;
import com.product.product.Exception_Handler.CustomExceptionResponse;
import com.product.product.Interfaces.ICategoryService;
import com.product.product.Models.Category;
import com.product.product.REPOs.CategoryRepo;
import com.product.product.REPOs.ProductRepo;

import jakarta.transaction.Transactional;

@Service
public class CategoryService implements ICategoryService {
    @Autowired
    private CategoryRepo categoryRepo;

    @Autowired
    private ProductRepo productRepo;

    @Override
    public Category findById(Long categoryId) {
        return categoryRepo.findById(categoryId)
            .orElseThrow(() -> CustomExceptionResponse.NotFound("Category with id " + categoryId + " not found"));
    }

    @Override
    public List<Category> findAll() {
        return categoryRepo.findAll();
    }

    @Override
    @Transactional
    public void delete(Long categoryId) {
        Category category = findById(categoryId);
        if (productRepo.existsByCategory_Id(categoryId)) {
            throw CustomExceptionResponse.Conflict("Category has products, please delete products first");
        }
        categoryRepo.clearParentForChildren(categoryId);
        categoryRepo.delete(category);
    }

    @Override
    public Category create(CategoryCreateDTO categoryDTO) {

        Category category = new Category();
        category.setName(categoryDTO.name());

        if (categoryDTO.parentId() != null) {
            Category parent = findById(categoryDTO.parentId());
            validateNoCycle(category, parent);
            category.setParent(parent);
        }

        return categoryRepo.save(category);
    }

    @Override
    public Category update(Long categoryId, CategoryUpdateDTO categoryDTO) {

        Category category = findById(categoryId);

        if (categoryDTO.name() != null && !categoryDTO.name().equals(category.getName())) {
            category.setName(categoryDTO.name());
        }

        if (categoryDTO.parentId() != null) {
            Category parent = findById(categoryDTO.parentId());
            validateNoCycle(category, parent);
            category.setParent(parent);
        }

        return categoryRepo.save(category);
    }

    public List<Category> getSubcategories(Long categoryId) {
        findById(categoryId);
        return categoryRepo.findByParent_Id(categoryId);
    }

    private void validateNoCycle(Category current, Category parent) {

        if (parent == null) return;

        if (parent.getId().equals(current.getId())) {
            throw CustomExceptionResponse.Conflict("Parent category cannot be the same as the current category");
        }

        Category temp = parent.getParent();

        while (temp != null) {

            if (temp.getId().equals(current.getId())) {
                throw CustomExceptionResponse.Conflict("Circular parent relation detected");
            }

            temp = temp.getParent();
        }
    }
}
