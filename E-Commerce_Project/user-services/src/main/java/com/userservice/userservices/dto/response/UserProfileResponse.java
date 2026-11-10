package com.userservice.userservices.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String photoUrl;
    private String street;
    private String city;
    private String country;
    private String zipCode;
}
