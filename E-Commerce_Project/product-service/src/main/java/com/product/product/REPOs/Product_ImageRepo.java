package com.product.product.REPOs;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.product.product.Models.Product_Image;

@Repository
public interface Product_ImageRepo extends JpaRepository<Product_Image, Long> {
    List<Product_Image> findByProduct_IdOrderBySortOrderAsc(Long productId);

    @Modifying
    @Query("""
        UPDATE Product_Image I
        SET I.sortOrder = I.sortOrder - 1
        WHERE I.product.id = :productId
        AND I.sortOrder > :deletedOrder
    """)
    void decrementSortOrderAfter(Long productId, Integer deletedOrder);

    @Modifying
    @Query("""
        UPDATE Product_Image I
        SET I.isPrimary = CASE WHEN I.sortOrder = 1 THEN true ELSE false END
        WHERE I.product.id = :productId
    """)
    void syncPrimaryBySortOrder(Long productId);
}
