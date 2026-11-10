package com.userservice.userservices.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private String id;
    private String recipientName;
    private String street;
    private String city;
    private String country;
    private String zipCode;
}
