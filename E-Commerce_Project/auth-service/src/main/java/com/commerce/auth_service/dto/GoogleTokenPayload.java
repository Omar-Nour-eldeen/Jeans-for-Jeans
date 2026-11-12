package com.commerce.auth_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleTokenPayload {

    private String sub;

    private String email;

    @JsonProperty("email_verified")
    private String emailVerified;

    private String name;

    private String picture;

    private String aud;

    private String iss;
}

