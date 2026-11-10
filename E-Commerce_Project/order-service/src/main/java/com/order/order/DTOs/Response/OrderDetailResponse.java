package com.order.order.DTOs.Response;

import com.order.order.ENUMs.OrderStatus;
import com.order.order.ENUMs.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {
    private String orderId;
    private String userId;
    private String customerEmail;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String notes;
    private List<OrderItemResponse> items;
    private AddressResponse shippingAddress;
    private LocalDateTime placedAt;
    private LocalDateTime updatedAt;

    // Enriched from Payment Service
    private String paymentStatus;
    private LocalDateTime paidAt;
}