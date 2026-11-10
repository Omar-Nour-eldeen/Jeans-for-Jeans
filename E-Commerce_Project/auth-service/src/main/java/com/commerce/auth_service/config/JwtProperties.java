package com.commerce.auth_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@ConfigurationProperties(prefix = "jwt")
@Component
@Data
public class JwtProperties {
    private String secret;
    private long expiration;
}