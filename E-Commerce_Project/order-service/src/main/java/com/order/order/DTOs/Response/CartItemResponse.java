package com.order.order.DTOs.Response;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    private String itemId;
    private String productId;
    private String productName;
    private Long variantId; // e.g. 3 (references variant in Product Service)
    private String variantLabel; // e.g. "Size: M"
    private String imageUrl;
    private BigDecimal unitPrice; // price at time of add-to-cart (display only)
    private int quantity;
    private BigDecimal lineTotal;
    private Integer availableStock;
}