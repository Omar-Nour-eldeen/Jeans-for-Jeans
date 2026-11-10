package com.order.order.Events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Published by Payment Service, consumed here to confirm the order
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    private String paymentId;
    private String orderId;
    private String userId;
    private BigDecimal amount;
    private String gatewayRef;
    private LocalDateTime paidAt;
}