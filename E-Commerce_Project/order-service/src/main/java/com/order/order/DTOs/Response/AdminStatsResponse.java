package com.order.order.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalOrders;
    private long ordersToday;
    private BigDecimal totalRevenue;
    private BigDecimal revenueToday;
    private long pendingOrders;
    private long cancelledOrders;
}