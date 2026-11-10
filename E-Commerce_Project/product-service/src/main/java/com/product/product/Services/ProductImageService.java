package com.product.product.Services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.product.product.DTOs.Product_ImageCreateDTO;
import com.product.product.Exception_Handler.CustomExceptionResponse;
import com.product.product.Interfaces.IProductImageService;
import com.product.product.Interfaces.IProductService;
import com.product.product.Models.Product;
import com.product.product.Models.Product_Image;
import com.product.product.REPOs.Product_ImageRepo;

import jakarta.transaction.Transactional;

@Service
public class ProductImageService implements IProductImageService {

    @Autowired
    private Product_ImageRepo imgRepo;

    @Autowired
    private IProductService productService;

    @Override
    public List<Product_Image> findAll(Long productId) {
        productService.findById(productId);
        return imgRepo.findByProduct_IdOrderBySortOrderAsc(productId);
    }

    @Override
    public Product_Image findById(Long productId, Long imageId) {
        productService.findById(productId);

        Product_Image image = imgRepo.findById(imageId)
            .orElseThrow(() -> CustomExceptionResponse.NotFound("Image with id " + imageId + " not found for product " + productId));
        
        if (!image.getProduct().getId().equals(productId)) {
            throw CustomExceptionResponse.BadRequest("Image with id " + imageId + " does not belong to product " + productId);
        }

        return image;
    }
    
    @Override
    @Transactional
    public void delete(Long productId, Long imageId) {
        Product_Image image = findById(productId, imageId);
        Integer deletedOrder = image.getSortOrder();
        imgRepo.delete(image);
        imgRepo.decrementSortOrderAfter(productId, deletedOrder);
        imgRepo.syncPrimaryBySortOrder(productId);
    }

    @Override
    @Transactional
    public Product_Image create(Long productId, Product_ImageCreateDTO imgDTO) {
        Product product = productService.findById(productId);

        Product_Image image = new Product_Image();
        image.setS3Url(imgDTO.s3Url());
        image.setProduct(product);
        image.setSortOrder(imgRepo.findByProduct_IdOrderBySortOrderAsc(productId).size() + 1);
        
        imgRepo.save(image);
        imgRepo.syncPrimaryBySortOrder(productId);

        return image;
    }
}
