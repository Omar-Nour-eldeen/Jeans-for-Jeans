package com.product.product.REPOs;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.product.product.Models.Category;

@Repository
public interface CategoryRepo extends JpaRepository<Category, Long> {
    List<Category> findByParent_Id(Long parentId);

    @Modifying
    @Query("UPDATE Category c SET c.parent = null WHERE c.parent.id = :parentId")
    void clearParentForChildren(Long parentId);
}
