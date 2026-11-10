package com.example.cart.dto;

import java.math.BigDecimal;
import java.util.List;

import com.example.cart.entity.CartItem;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartResponseDTO {
    private String cartId;
    private List<CartItem> items;
    private int totalItems;
    private BigDecimal totalPrice;
}