package com.product.product.REPOs;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.product.product.Models.Product_Variant;

@Repository
public interface Product_VariantRepo extends JpaRepository<Product_Variant, Long> {
    List<Product_Variant> findByProduct_Id(Long productId);
}
