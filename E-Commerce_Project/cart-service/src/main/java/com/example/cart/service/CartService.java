package com.example.cart.service;

import com.example.cart.dto.AddItemRequestDTO;
import com.example.cart.dto.CartResponseDTO;
import com.example.cart.dto.UpdateItemRequestDTO;

public interface CartService {
    CartResponseDTO getCart(String userId);
    CartResponseDTO addItem(String userId, AddItemRequestDTO request);
    CartResponseDTO updateItem(String userId, String itemId, UpdateItemRequestDTO request);
    CartResponseDTO removeItem(String userId, String itemId);
    void clearCart(String userId);
}