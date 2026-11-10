package com.order.order.interfaces;

import com.order.order.DTOs.Request.AddCartItemRequest;
import com.order.order.DTOs.Request.UpdateCartItemRequest;
import com.order.order.DTOs.Response.CartResponse;

public interface CartService {
    CartResponse getCart(String userId);
    CartResponse addItem(String userId, AddCartItemRequest request);
    CartResponse updateItem(String userId, String itemId, UpdateCartItemRequest request);
    void removeItem(String userId, String itemId);
    void clearCart(String userId);
    int getCartCount(String userId);
}
