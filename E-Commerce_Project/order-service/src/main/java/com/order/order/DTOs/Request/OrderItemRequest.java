package com.order.order.DTOs.Request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    private String productId;
    private Long variantId;
    private String variantLabel;
    private int quantity;
}
