package com.order.order.messages;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

/**
 * HTTP client for Payment Service internal endpoints.
 * Used only to enrich order detail response with payment status.
 * Fails gracefully — if Payment Service is down, returns UNKNOWN status.
 */
@Component
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public PaymentServiceClient(
            RestTemplate restTemplate,
            @Value("${services.payment-service}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public PaymentStatus getPaymentStatus(String orderId) {
        String url = baseUrl + "/api/internal/payments/" + orderId;
        try {
            PaymentStatus status = restTemplate.getForObject(url, PaymentStatus.class);
            return status != null ? status : PaymentStatus.unknown();
        } catch (Exception e) {
            log.warn("Could not fetch payment status for orderId={}: {}", orderId, e.getMessage());
            return PaymentStatus.unknown();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentStatus {
        private String paymentId;
        private String status;
        private LocalDateTime paidAt;

        public static PaymentStatus unknown() {
            return PaymentStatus.builder().status("UNKNOWN").build();
        }
    }
}