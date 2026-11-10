package com.userservice.userservices.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddressRequest {

    @NotBlank(message = "Recipient name is required")
    @Size(min = 2, max = 100, message = "Recipient name must be between 2 and 100 characters")
    private String recipientName;

    // @NotBlank(message = "Street is required")
    // @Size(max = 200, message = "Street must not exceed 200 characters")
    // private String street;

    // @NotBlank(message = "City is required")
    // @Size(max = 100, message = "City must not exceed 100 characters")
    // private String city;

    // @NotBlank(message = "Country is required")
    // @Size(max = 100, message = "Country must not exceed 100 characters")
    // private String country;

    // @NotBlank(message = "Zip code is required")
    // @Pattern(regexp = "^[A-Za-z0-9\\- ]{3,10}$", message = "Invalid zip code format")
    // private String zipCode;
}
