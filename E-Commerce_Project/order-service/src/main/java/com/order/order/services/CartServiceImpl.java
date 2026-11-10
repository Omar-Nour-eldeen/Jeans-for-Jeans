package com.order.order.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.order.order.interfaces.CartService;
import com.order.order.messages.*;
import com.order.order.messages.ProductServiceClient.ProductDetail;
import com.order.order.messages.ProductServiceClient.VariantResponseDTO;
import com.order.order.repos.*;
import com.order.order.DTOs.Request.*;
import com.order.order.DTOs.Response.*;
import com.order.order.Entites.Cart;
import com.order.order.Entites.CartItem;
import com.order.order.Exceptions.*;

import com.order.order.ENUMs.OrderStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductServiceClient productClient;
    private final OrderRepository orderRepository;

    @Value("${order.max-cart-items:50}")
    private int maxCartItems;

    private int getEffectiveStock(String userId, Long variantId, Integer physicalStock) {
        if (physicalStock == null) {
            return 0;
        }
        if (variantId == null || userId == null || userId.isBlank()) {
            return Math.max(0, physicalStock);
        }
        Long reserved = orderRepository.getReservedQuantityByUser(variantId, userId, OrderStatus.PENDING);
        int pendingReserved = reserved != null ? reserved.intValue() : 0;
        return Math.max(0, physicalStock - pendingReserved);
    }

    // ── GET /api/cart ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public CartResponse getCart(String userId) {
        Cart cart = findOrCreateCart(userId);
        consolidateCartDuplicates(cart);
        return toCartResponse(cart);
    }

    // ── POST /api/cart/items ──────────────────────────────────────────────────

    @Override
    @Transactional
    public CartResponse addItem(String userId, AddCartItemRequest request) {
        Cart cart = findOrCreateCart(userId);
        consolidateCartDuplicates(cart);

        if (cart.getItems().size() >= maxCartItems) {
            throw new IllegalStateException(
                    "Cart cannot exceed " + maxCartItems + " items.");
        }

        cart.getItems().stream()
                .filter(i -> i.getProductId().equals(request.getProductId())
                        && matchesVariant(i, request.getVariantId()))
                .findFirst()
                .ifPresentOrElse(
                        existing -> {
                            ProductDetail detail = productClient.getProductDetail(request.getProductId());
                            VariantResponseDTO variant = detail.getVariants().stream()
                                    .filter(v -> matchesVariantId(v.getId(), request.getVariantId()))
                                    .findFirst()
                                    .orElseThrow(() -> new ResourceNotFoundException(
                                            "Variant not found: " + request.getVariantId()
                                                    + " for product: " + request.getProductId()));

                            int newQty = existing.getQuantity() + request.getQuantity();
                            int effectiveStock = getEffectiveStock(userId, variant.getId(), variant.getStockQuantity());
                            if (effectiveStock <= 0) {
                                throw new InsufficientStockException(
                                        detail.getName() + " (" + existing.getVariantLabel() + ")",
                                        newQty,
                                        0);
                            }
                            if (newQty > effectiveStock) {
                                throw new InsufficientStockException(
                                        detail.getName() + " (" + existing.getVariantLabel() + ")",
                                        newQty,
                                        effectiveStock);
                            }

                            existing.setQuantity(newQty);
                            log.debug("Cart item quantity updated: productId={} variantId={} newQty={}",
                                    request.getProductId(), request.getVariantId(),
                                    existing.getQuantity());
                        },
                        () -> {
                            ProductDetail detail = productClient.getProductDetail(request.getProductId());

                            VariantResponseDTO variant = detail.getVariants().stream()
                                    .filter(v -> matchesVariantId(v.getId(), request.getVariantId()))
                                    .findFirst()
                                    .orElseThrow(() -> new ResourceNotFoundException(
                                            "Variant not found: " + request.getVariantId()
                                                    + " for product: " + request.getProductId()));
                            int effectiveStock = getEffectiveStock(userId, variant.getId(), variant.getStockQuantity());
                            if (effectiveStock <= 0) {
                                throw new InsufficientStockException(
                                        detail.getName() + " (Size: " + variant.getSize() + ")",
                                        request.getQuantity(),
                                        0);
                            }
                            if (request.getQuantity() > effectiveStock) {
                                throw new InsufficientStockException(
                                        detail.getName() + " (Size: " + variant.getSize() + ")",
                                        request.getQuantity(),
                                        effectiveStock);
                            }
                            String ID = String.valueOf(detail.getId());

                            CartItem newItem = CartItem.builder()
                                    .cart(cart)
                                    .productId(ID)
                                    .productName(detail.getName())
                                    .imageUrl(detail.getImages().stream().findFirst().orElse(null))
                                    .unitPrice(detail.getPrice())
                                    .variantId(variant.getId()) 
                                    .variantLabel("Size: " + variant.getSize()) 
                                    .quantity(request.getQuantity())
                                    .build();

                            cart.getItems().add(newItem);
                            log.debug("New item added: productId={} variantId={} size={} price={}",
                                    ID , variant.getId(),
                                    variant.getSize(), detail.getPrice());
                        });

        cartRepository.save(cart);
        return toCartResponse(cart);
    }

    // ── PUT /api/cart/items/{id} ──────────────────────────────────────────────

    @Override
    @Transactional
    public CartResponse updateItem(String userId, String itemId,
            UpdateCartItemRequest request) {
        CartItem item = cartItemRepository
                .findByIdAndCartUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cart item not found: " + itemId));

        if (request.getQuantity() <= 0) {
            Cart cart = item.getCart();
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
            cartRepository.save(cart);
            return toCartResponse(cart);
        }

        try {
            ProductDetail detail = productClient.getProductDetail(item.getProductId());
            if (detail != null && detail.getVariants() != null && item.getVariantId() != null) {
                VariantResponseDTO variant = detail.getVariants().stream()
                        .filter(v -> v.getId() != null && v.getId().equals(item.getVariantId()))
                        .findFirst()
                        .orElse(null);
                if (variant != null) {
                    int effectiveStock = getEffectiveStock(userId, variant.getId(), variant.getStockQuantity());
                    if (request.getQuantity() > effectiveStock) {
                        throw new InsufficientStockException(
                                item.getProductName() + " (" + item.getVariantLabel() + ")",
                                request.getQuantity(),
                                effectiveStock);
                    }
                }
            }
        } catch (InsufficientStockException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not check stock when updating cart item: {}", e.getMessage());
        }

        item.setQuantity(request.getQuantity());
        cartItemRepository.save(item);

        Cart cart = findOrCreateCart(userId);
        return toCartResponse(cart);
    }

    // ── DELETE /api/cart/items/{id} ───────────────────────────────────────────

    @Override
    @Transactional
    public void removeItem(String userId, String itemId) {
        CartItem item = cartItemRepository
                .findByIdAndCartUserId(itemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Cart item not found: " + itemId));

        Cart cart = item.getCart();
        cart.getItems().remove(item);
        cartRepository.save(cart);
    }

    // ── DELETE /api/cart ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public void clearCart(String userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
            log.debug("Cart cleared for userId={}", userId);
        });
    }

    // ── GET /api/cart/count ───────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public int getCartCount(String userId) {
        return cartRepository.findByUserId(userId)
                .map(cart -> cart.getItems().stream()
                        .mapToInt(CartItem::getQuantity)
                        .sum())
                .orElse(0);
    }

    private Cart findOrCreateCart(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.debug("Creating new cart for userId={}", userId);
                    return cartRepository.save(Cart.builder().userId(userId).build());
                });
    }

    private boolean matchesVariantId(Long itemVariantId, String requestedVariantId) {
        if (itemVariantId == null && (requestedVariantId == null || requestedVariantId.isBlank())) {
            return true;
        }
        if (itemVariantId == null || requestedVariantId == null || requestedVariantId.isBlank()) {
            return false;
        }
        try {
            return itemVariantId.equals(Long.parseLong(requestedVariantId.trim()));
        } catch (NumberFormatException e) {
            return String.valueOf(itemVariantId).equalsIgnoreCase(requestedVariantId.trim());
        }
    }

    private boolean matchesVariant(CartItem item, String requestedVariantId) {
        return matchesVariantId(item.getVariantId(), requestedVariantId);
    }

    private void consolidateCartDuplicates(Cart cart) {
        if (cart.getItems() == null || cart.getItems().size() <= 1) {
            return;
        }

        List<CartItem> items = new ArrayList<>(cart.getItems());
        Map<String, CartItem> uniqueMap = new LinkedHashMap<>();
        List<CartItem> toRemove = new ArrayList<>();

        for (CartItem item : items) {
            String key = item.getProductId() + "_" + (item.getVariantId() != null ? item.getVariantId() : "null");
            if (uniqueMap.containsKey(key)) {
                CartItem existing = uniqueMap.get(key);
                existing.setQuantity(existing.getQuantity() + item.getQuantity());
                toRemove.add(item);
            } else {
                uniqueMap.put(key, item);
            }
        }

        if (!toRemove.isEmpty()) {
            cart.getItems().removeAll(toRemove);
            cartItemRepository.deleteAll(toRemove);
            cartRepository.save(cart);
            log.info("Consolidated {} duplicate cart items for cartId={}", toRemove.size(), cart.getId());
        }
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(item -> {
                    BigDecimal lineTotal = item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity()));

                    Integer availableStock = null;
                    try {
                        ProductDetail detail = productClient.getProductDetail(item.getProductId());
                        if (detail != null && detail.getVariants() != null && item.getVariantId() != null) {
                            VariantResponseDTO variant = detail.getVariants().stream()
                                    .filter(v -> v.getId() != null && v.getId().equals(item.getVariantId()))
                                    .findFirst()
                                    .orElse(null);
                            if (variant != null) {
                                availableStock = getEffectiveStock(cart.getUserId(), variant.getId(), variant.getStockQuantity());
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Stock lookup skipped for item {}: {}", item.getId(), e.getMessage());
                    }

                    return CartItemResponse.builder()
                            .itemId(item.getId())
                            .productId(item.getProductId())
                            .productName(item.getProductName())
                            .variantId(item.getVariantId())
                            .variantLabel(item.getVariantLabel())
                            .imageUrl(item.getImageUrl())
                            .unitPrice(item.getUnitPrice())
                            .quantity(item.getQuantity())
                            .lineTotal(lineTotal)
                            .availableStock(availableStock)
                            .build();
                })
                .toList();

        BigDecimal subtotal = itemResponses.stream()
                .map(CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .subtotal(subtotal)
                .totalItems(totalItems)
                .build();
    }
}