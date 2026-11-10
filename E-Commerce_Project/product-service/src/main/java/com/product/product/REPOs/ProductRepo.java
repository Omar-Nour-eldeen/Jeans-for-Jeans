package com.product.product.REPOs;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.product.product.Models.Product;

@Repository
public interface ProductRepo extends JpaRepository<Product, Long> {
    List<Product> findByCategory_Id(Long categoryId);

    boolean existsByCategory_Id(Long categoryId);
}
