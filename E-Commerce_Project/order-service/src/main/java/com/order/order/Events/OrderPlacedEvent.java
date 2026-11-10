package com.order.order.Events;

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
public class OrderPlacedEvent {
    private String orderId;
    private String userId;
    private List<OrderItemEvent> items;
    private BigDecimal totalAmount;
    private String recipientName;
    private String shippingCity;
    private String shippingCountry;
    private String paymentMethod;
    private LocalDateTime placedAt;
    

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemEvent {
        private String productId;
        private String variantId;
        private String productName;
        private String variantLabel;
        private int quantity;
        private BigDecimal unitPrice;
    }
}
