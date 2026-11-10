package com.product.product.Interfaces;

import java.util.List;

import com.product.product.DTOs.Product_ImageCreateDTO;
import com.product.product.Models.Product_Image;

public interface IProductImageService {
    List<Product_Image> findAll(Long productId);

    Product_Image findById(Long productId, Long imageId);

    Product_Image create(Long productId, Product_ImageCreateDTO imgDTO);

    void delete(Long productId, Long imageId);
}
