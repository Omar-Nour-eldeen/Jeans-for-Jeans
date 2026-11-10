package com.example.cart.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cart.dto.AddItemRequestDTO;
import com.example.cart.dto.CartResponseDTO;
import com.example.cart.dto.UpdateItemRequestDTO;
import com.example.cart.service.CartService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService service;

    @GetMapping
    public CartResponseDTO getCart() {
        return service.getCart("user1");
    }

    @PostMapping("/items")
    public CartResponseDTO addItem(@RequestBody AddItemRequestDTO req) {
        return service.addItem("user1", req);
    }

    @PutMapping("/items/{id}")
    public CartResponseDTO updateItem(@PathVariable String id,
                                      @RequestBody UpdateItemRequestDTO req) {
        return service.updateItem("user1", id, req);
    }

    @DeleteMapping("/items/{id}")
    public CartResponseDTO removeItem(@PathVariable String id) {
        return service.removeItem("user1", id);
    }

    @DeleteMapping
    public String clearCart() {
        service.clearCart("user1");
        return "cleared";
    }
}