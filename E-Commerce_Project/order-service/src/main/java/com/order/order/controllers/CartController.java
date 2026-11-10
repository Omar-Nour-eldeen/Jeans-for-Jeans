package com.order.order.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.order.order.DTOs.Request.AddCartItemRequest;
import com.order.order.DTOs.Request.UpdateCartItemRequest;
import com.order.order.DTOs.Response.ApiResponse;
import com.order.order.DTOs.Response.CartResponse;
import com.order.order.interfaces.CartService;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @RequestHeader("User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(userId)));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @RequestHeader("User-Id") String userId,
            @Valid @RequestBody AddCartItemRequest request) {
        CartResponse cart = cartService.addItem(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Item added to cart", cart));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @RequestHeader("User-Id") String userId,
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok("Cart item updated", cartService.updateItem(userId, itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @RequestHeader("User-Id") String userId,
            @PathVariable String itemId) {
        cartService.removeItem(userId, itemId);
        return ResponseEntity.ok(ApiResponse.ok("Item removed from cart", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @RequestHeader("User-Id") String userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.ok("Cart cleared", null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCartCount(
            @RequestHeader("User-Id") String userId) {
        return ResponseEntity.ok(
                ApiResponse.ok(Map.of("count", cartService.getCartCount(userId))));
    }
}