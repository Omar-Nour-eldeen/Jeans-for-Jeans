package com.order.order.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.order.order.DTOs.Request.PlaceOrderRequest;
import com.order.order.DTOs.Response.ApiResponse;
import com.order.order.DTOs.Response.OrderDetailResponse;
import com.order.order.DTOs.Response.OrderSummaryResponse;
import com.order.order.DTOs.Response.PagedResponse;
import com.order.order.interfaces.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
 
    @PostMapping
    public ResponseEntity<ApiResponse<OrderDetailResponse>> placeOrder(
            @RequestHeader("User-Id") String userId,
            @RequestHeader(value = "User-Email", required = false) String userEmail,
            @Valid @RequestBody PlaceOrderRequest request) {
        if ((request.getCustomerEmail() == null || request.getCustomerEmail().isBlank()) && userEmail != null) {
            request.setCustomerEmail(userEmail);
        }
        OrderDetailResponse order = orderService.placeOrder(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Order placed successfully", order));
    }
 
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderSummaryResponse>>> getMyOrders(
            @RequestHeader("User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                ApiResponse.ok(orderService.getMyOrders(userId, page, size)));
    }
 
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getOrderDetail(
            @RequestHeader("User-Id") String userId,
            @PathVariable String orderId) {
        return ResponseEntity.ok(
                ApiResponse.ok(orderService.getMyOrderDetail(userId, orderId)));
    }

    @GetMapping("/reserved-stock")
    public ResponseEntity<ApiResponse<java.util.Map<String, Integer>>> getReservedStock(
            @RequestHeader(value = "User-Id", required = false) String userId) {
        return ResponseEntity.ok(
                ApiResponse.ok(orderService.getReservedStockMap(userId)));
    }

}
