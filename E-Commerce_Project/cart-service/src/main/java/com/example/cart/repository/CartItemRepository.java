package com.example.cart.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cart.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, String> {

    List<CartItem> findByCartId(String cartId);

    Optional<CartItem> findByCartIdAndVariantId(String cartId, String variantId);

    void deleteAllByCartId(String cartId);
}