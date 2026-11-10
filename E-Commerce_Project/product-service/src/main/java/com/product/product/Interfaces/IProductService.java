package com.product.product.Interfaces;

import java.util.List;

import com.product.product.DTOs.ProductCreateDTO;
import com.product.product.DTOs.ProductUpdateDTO;
import com.product.product.DTOs.Response.ProductDetailsDTO;
import com.product.product.Models.Product;

public interface IProductService {
    Product findById(Long productId);

    List<Product> findAll();

    void delete(Long productId);

    Product create(ProductCreateDTO productDTO);

    Product update(Long productId, ProductUpdateDTO productDTO);

    List<Product> findAllByCategoryId(Long categoryId);

    List<ProductDetailsDTO> findAllDetails();

    ProductDetailsDTO findDetailsById(Long productId);
}
