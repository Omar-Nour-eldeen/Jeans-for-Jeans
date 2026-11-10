package com.order.order.messages;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class ProductServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ProductServiceClient(
            RestTemplate restTemplate,
            @Value("${services.product-service}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public ProductDetail getProductDetail(String productId) {
        String url = baseUrl + "/products/" + productId;
        try {
            ProductResponse response = restTemplate.getForObject(url, ProductResponse.class);
            System.out.println(response);
            if (response == null || response.getData() == null) {
                throw new RuntimeException("Empty response from Product Service for productId=" + productId);
            }
            return response.getData();
        } catch (HttpClientErrorException.NotFound e) {
            throw new com.order.order.Exceptions.ResourceNotFoundException(
                    "Product not found: " + productId);
        } catch (com.order.order.Exceptions.ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Product Service unreachable for productId={}: {}", productId, e.getMessage());
            throw new com.order.order.Exceptions.ServiceUnavailableException(
                    "Product Service is currently unavailable. Please try again.");
        }
    }

    public void decrementStock(String productId, int qty, Long variantId) {
        String url = baseUrl + "/internal/products/" + productId
                + "/variants/" + variantId + "/decrement-stock/" + qty;
        try {
            restTemplate.postForObject(url, null, Void.class);
            log.info("Stock decremented: productId={} qty={} variantId={}", productId, qty, variantId);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT || e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                log.warn("STOCK_CONFLICT: productId={} qty={} variantId={} - insufficient stock at decrement time",
                        productId, qty, variantId);
                throw new IllegalStateException("Insufficient stock to confirm this order for variant " + variantId);
            } else {
                log.error("STOCK_DECREMENT_FAILED: productId={} qty={} variantId={} status={}: {}",
                        productId, qty, variantId, e.getStatusCode(), e.getMessage());
                throw new RuntimeException("Failed to decrement stock: " + e.getMessage());
            }
        } catch (Exception e) {
            log.error("STOCK_DISCREPANCY: decrementStock failed productId={} qty={} variantId={}: {}",
                    productId, qty, variantId, e.getMessage());
            throw e;
        }
    }

    public void incrementStock(String productId, int qty, Long variantId) {
        String url = baseUrl + "/internal/products/" + productId
                + "/variants/" + variantId + "/increment-stock/" + qty;
        try {
            restTemplate.postForObject(url, null, Void.class);
            log.info("Stock incremented: productId={} qty={} variantId={}", productId, qty, variantId);
        } catch (Exception e) {
            log.error("STOCK_INCREMENT_FAILED: productId={} qty={} variantId={}: {}",
                    productId, qty, variantId, e.getMessage());
        }
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductResponse {

        private String status;

        private ProductDetail data;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    public static class ProductDetail {

        private Long id;

        private String name;

        private String description;

        private BigDecimal price;

        private String status;

        private String category;

        private String categoryParent;

        private List<String> images;

        private List<VariantResponseDTO> variants = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    public static class VariantResponseDTO {

        private Long id;

        private String size;

        private Integer stockQuantity;
    }
}