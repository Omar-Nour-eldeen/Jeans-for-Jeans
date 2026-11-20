package com.order.order.DTOs.Request;

import com.order.order.ENUMs.PaymentMethod;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class PlaceOrderRequest {

    @NotNull(message = "Shipping address is required")
    @Valid
    private ShippingAddressRequest shippingAddress;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String notes;
    private String customerEmail;
    private List<OrderItemRequest> items;
}

