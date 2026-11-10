package com.order.order.repos;

import com.order.order.Entites.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    Optional<CartItem> findByIdAndCartUserId(String id, String userId);

    boolean existsByCartId(String cartId, String variantId);
}
