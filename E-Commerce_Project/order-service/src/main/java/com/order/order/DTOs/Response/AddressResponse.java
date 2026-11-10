package com.order.order.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private String recipientName;
    private String phone;
    private String email;
    private String street;
    private String city;
    private String country;
    private String zipCode;
}
