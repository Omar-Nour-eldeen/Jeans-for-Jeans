package com.order.order.interfaces;

import com.order.order.DTOs.Request.PlaceOrderRequest;
import com.order.order.DTOs.Request.UpdateOrderStatusRequest;
import com.order.order.DTOs.Response.AdminStatsResponse;
import com.order.order.DTOs.Response.OrderDetailResponse;
import com.order.order.DTOs.Response.OrderSummaryResponse;
import com.order.order.DTOs.Response.PagedResponse;
import com.order.order.ENUMs.OrderStatus;

public interface OrderService {
        OrderDetailResponse              placeOrder(String userId, PlaceOrderRequest request);
    PagedResponse<OrderSummaryResponse> getMyOrders(String userId, int page, int size);
    OrderDetailResponse              getMyOrderDetail(String userId, String orderId);
 
    // ── Admin endpoints ───────────────────────────────────────────────────────
    PagedResponse<OrderSummaryResponse> getAllOrders(OrderStatus status, int page, int size);
    OrderDetailResponse              getAnyOrderDetail(String orderId);
    void                             updateOrderStatus(String orderId, UpdateOrderStatusRequest req);
    AdminStatsResponse               getStats();
 
    // ── Internal (called by RabbitMQ consumer / Payment Service) ─────────────
    void confirmOrderAfterPayment(String orderId);

    // ── Stock Reservation ─────────────────────────────────────────────────────
    java.util.Map<String, Integer> getReservedStockMap();
    java.util.Map<String, Integer> getReservedStockMap(String userId);
}
