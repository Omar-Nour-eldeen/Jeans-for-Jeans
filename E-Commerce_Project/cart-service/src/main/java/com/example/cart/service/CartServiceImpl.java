package com.example.cart.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cart.dto.AddItemRequestDTO;
import com.example.cart.dto.CartResponseDTO;
import com.example.cart.dto.UpdateItemRequestDTO;
import com.example.cart.entity.Cart;
import com.example.cart.entity.CartItem;
import com.example.cart.repository.CartItemRepository;
import com.example.cart.repository.CartRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;

    @Override
    public CartResponseDTO getCart(String userId) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseGet(() -> cartRepo.save(
                        Cart.builder().userId(userId).build()
                ));

        List<CartItem> items = itemRepo.findByCartId(cart.getId());

        int totalItems = items.stream().mapToInt(CartItem::getQuantity).sum();

        BigDecimal totalPrice = items.stream()
                .map(i -> i.getUnitPrice()
                        .multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponseDTO.builder()
                .cartId(cart.getId())
                .items(items)
                .totalItems(totalItems)
                .totalPrice(totalPrice)
                .build();
    }

    @Override
    public CartResponseDTO addItem(String userId, AddItemRequestDTO req) {
        Cart cart = cartRepo.findByUserId(userId)
                .orElseGet(() -> cartRepo.save(
                        Cart.builder().userId(userId).build()
                ));

        itemRepo.save(CartItem.builder()
                .cartId(cart.getId())
                .productId(req.getProductId())
                .variantId(req.getVariantId())
                .productName(req.getProductName())
                .variantLabel(req.getVariantLabel())
                .unitPrice(req.getUnitPrice())
                .quantity(req.getQuantity())
                .build());

        return getCart(userId);
    }

    @Override
    public CartResponseDTO updateItem(String userId, String itemId, UpdateItemRequestDTO req) {
        CartItem item = itemRepo.findById(itemId).orElseThrow();
        item.setQuantity(req.getQuantity());
        itemRepo.save(item);
        return getCart(userId);
    }

    @Override
    public CartResponseDTO removeItem(String userId, String itemId) {
        itemRepo.deleteById(itemId);
        return getCart(userId);
    }

    @Override
    @Transactional
    public void clearCart(String userId) {
        cartRepo.findByUserId(userId).ifPresent(cart ->
            itemRepo.deleteAllByCartId(cart.getId())
        );
    }
}