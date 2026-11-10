package com.order.order.DTOs.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShippingAddressRequest {

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    private String phone;
    private String email;

    @NotBlank(message = "Street is required")
    private String street;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Country is required")
    private String country;

    private String zipCode;
}
