package com.product.product.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.product.product.DTOs.ProductCreateDTO;
import com.product.product.DTOs.ProductUpdateDTO;
import com.product.product.DTOs.Response.ProductDetailsDTO;
import com.product.product.DTOs.Response.VariantResponseDTO;
import com.product.product.Exception_Handler.CustomExceptionResponse;
import com.product.product.Interfaces.ICategoryService;
import com.product.product.Interfaces.IProductService;
import com.product.product.Models.Category;
import com.product.product.Models.Product;
import com.product.product.Models.Product_Image;
import com.product.product.REPOs.ProductRepo;

@Service
public class ProductService implements IProductService {

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private ICategoryService categoryService;

    @Override
    public Product findById(Long productId) {
        return productRepo.findById(productId)
                .orElseThrow(() -> CustomExceptionResponse.NotFound("Product with id " + productId + " not found"));
    }

    @Override
    public List<Product> findAll() {
        return productRepo.findAll();
    }

    @Override
    public void delete(Long productId) {
        Product product = findById(productId);
        productRepo.delete(product);
    }

    @Override
    public Product create(ProductCreateDTO productDTO) {
        Category category = categoryService.findById(productDTO.categoryId());

        Product product = new Product();
        product.setName(productDTO.name());
        product.setDescription(productDTO.description());
        product.setPrice(productDTO.price());
        product.setStatus(productDTO.status());
        product.setCategory(category);

        return productRepo.save(product);
    }

    @Override
    public Product update(Long productId, ProductUpdateDTO productDTO) {
        Product product = findById(productId);

        if (productDTO.name() != null) {
            product.setName(productDTO.name());
        }
        if (productDTO.description() != null) {
            product.setDescription(productDTO.description());
        }
        if (productDTO.price() != null) {
            product.setPrice(productDTO.price());
        }
        if (productDTO.status() != null) {
            product.setStatus(productDTO.status());
        }
        if (productDTO.categoryId() != null) {
            Category category = categoryService.findById(productDTO.categoryId());
            product.setCategory(category);
        }

        return productRepo.save(product);
    }

    @Override
    public List<Product> findAllByCategoryId(Long categoryId) {
        categoryService.findById(categoryId);
        return productRepo.findByCategory_Id(categoryId);
    }

    @Override
    public List<ProductDetailsDTO> findAllDetails() {
        List<Product> products = productRepo.findAll();
        return products.stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public ProductDetailsDTO findDetailsById(Long productId) {
        Product product = findById(productId);
        return mapToDTO(product);
    }

    private ProductDetailsDTO mapToDTO(Product product) {
        return new ProductDetailsDTO(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStatus(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                (product.getCategory() != null && product.getCategory().getParent() != null)
                        ? product.getCategory().getParent().getName()
                        : null,
                product.getImages()
                        .stream()
                        .map(Product_Image::getS3Url)
                        .toList(),
                product.getVariants()
                        .stream()
                        .map(variant -> new VariantResponseDTO(
                                variant.getId(),
                                variant.getSize(),
                                variant.getStockQuantity()))
                        .toList()
        );
    }
}
