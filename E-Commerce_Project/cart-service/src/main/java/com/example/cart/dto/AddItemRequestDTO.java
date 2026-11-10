package com.example.cart.dto;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddItemRequestDTO {

    @JsonProperty("productId")
    private String productId;

    @JsonProperty("variantId")
    private String variantId;

    @JsonProperty("productName")
    private String productName;

    @JsonProperty("variantLabel")
    private String variantLabel;

    @JsonProperty("unitPrice")
    private BigDecimal unitPrice;

    @JsonProperty("quantity")
    private Integer quantity;
}