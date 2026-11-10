package com.commerce.auth_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import javax.crypto.SecretKey;

import com.commerce.auth_service.config.JwtProperties;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.interfaces.IJwtService;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtServiceImp implements IJwtService  {

    // @Value("${jwt.secret}")
    // private String secretKey;
    // @Value("${jwt.expiration}")
    // private long expirationTime;
        @Autowired
        private JwtProperties jwtProperties;


    public String generateToken(User user, Set<String> permissions) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role",        user.getRole().name());
        claims.put("userId",      user.getId());
        claims.put("permissions", permissions);   
        return buildToken(claims, user.getEmail(), jwtProperties.getExpiration());
    }

    private String buildToken(Map<String, Object> extraClaims,
            String subject,
            long expiration) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject) // email as subject
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUserId(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("userId", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public Long expirationTime() {
        return jwtProperties.getExpiration();
    }

}
