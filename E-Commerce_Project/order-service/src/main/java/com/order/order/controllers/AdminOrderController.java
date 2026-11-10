package com.order.order.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.order.order.DTOs.Request.UpdateOrderStatusRequest;
import com.order.order.DTOs.Response.AdminStatsResponse;
import com.order.order.DTOs.Response.ApiResponse;
import com.order.order.DTOs.Response.OrderDetailResponse;
import com.order.order.DTOs.Response.OrderSummaryResponse;
import com.order.order.DTOs.Response.PagedResponse;
import com.order.order.ENUMs.OrderStatus;
import com.order.order.interfaces.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderSummaryResponse>>> getAllOrders(
            @RequestParam(required = false)    OrderStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponse.ok(orderService.getAllOrders(status, page, size)));
    }
 
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getStats()));
    }
 
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getOrderDetail(
            @PathVariable String orderId) {
        return ResponseEntity.ok(
                ApiResponse.ok(orderService.getAnyOrderDetail(orderId)));
    }
 
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(
                ApiResponse.ok("Order status updated to " + request.getStatus(), null));
    }
}
