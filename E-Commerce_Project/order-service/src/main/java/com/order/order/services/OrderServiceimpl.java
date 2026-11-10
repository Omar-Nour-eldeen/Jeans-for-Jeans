package com.order.order.services;

import com.order.order.Entites.Cart;
import com.order.order.Entites.CartItem;
import com.order.order.Entites.Order;
import com.order.order.Entites.OrderAddress;
import com.order.order.Entites.OrderItem;
import com.order.order.Events.OrderPlacedEvent;
import com.order.order.Events.Publishers.OrderEventPublisher;
import com.order.order.Exceptions.CartEmptyException;
import com.order.order.Exceptions.InsufficientStockException;
import com.order.order.Exceptions.ResourceNotFoundException;
import com.order.order.interfaces.OrderService;
import com.order.order.messages.PaymentServiceClient;
import com.order.order.messages.ProductServiceClient;
import com.order.order.messages.ProductServiceClient.VariantResponseDTO;
import com.order.order.repos.CartRepository;
import com.order.order.repos.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.order.order.DTOs.Request.PlaceOrderRequest;
import com.order.order.DTOs.Request.UpdateOrderStatusRequest;
import com.order.order.DTOs.Response.AddressResponse;
import com.order.order.DTOs.Response.AdminStatsResponse;
import com.order.order.DTOs.Response.OrderDetailResponse;
import com.order.order.DTOs.Response.OrderItemResponse;
import com.order.order.DTOs.Response.OrderSummaryResponse;
import com.order.order.DTOs.Response.PagedResponse;
import com.order.order.ENUMs.OrderStatus;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceimpl implements OrderService {

        private final OrderRepository orderRepository;
        private final CartRepository cartRepository;
        private final ProductServiceClient productClient;
        private final PaymentServiceClient paymentClient;
        private final OrderEventPublisher eventProducer;

        @Override
        @Transactional
        public OrderDetailResponse placeOrder(String userId, PlaceOrderRequest request) {

                Cart cart = cartRepository.findByUserId(userId)
                                .filter(c -> !c.getItems().isEmpty())
                                .orElseThrow(CartEmptyException::new);

                List<VariantResponseDTO> liveVariants = new ArrayList<>();

                for (CartItem cartItem : cart.getItems()) {
                        ProductServiceClient.ProductDetail live = productClient
                                        .getProductDetail(cartItem.getProductId());
                        log.info("Product: {}", live);
                        VariantResponseDTO liveVariant = live.getVariants().stream()
                                        .filter(v -> v.getId().equals(cartItem.getVariantId()))
                                        .findFirst()
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Variant not found: " + cartItem.getVariantId()));

                        int physicalStock = liveVariant.getStockQuantity() != null ? liveVariant.getStockQuantity() : 0;
                        Long reserved = orderRepository.getReservedQuantityByUser(cartItem.getVariantId(), userId, OrderStatus.PENDING);
                        int pendingReserved = reserved != null ? reserved.intValue() : 0;
                        int effectiveStock = Math.max(0, physicalStock - pendingReserved);

                        if (effectiveStock < cartItem.getQuantity()) {
                                throw new InsufficientStockException(
                                                cartItem.getProductName() + " - " + cartItem.getVariantLabel(),
                                                cartItem.getQuantity(),
                                                effectiveStock);
                        }

                        liveVariants.add(liveVariant);
                }

                BigDecimal subtotal = BigDecimal.ZERO;
                List<OrderItem> orderItems = new ArrayList<>();
                List<CartItem> cartItemList = new ArrayList<>(cart.getItems());

                for (int i = 0; i < cartItemList.size(); i++) {
                        CartItem ci = cartItemList.get(i);
                        ProductServiceClient.ProductDetail live = productClient.getProductDetail(ci.getProductId());
                        VariantResponseDTO lv = liveVariants.get(i);

                        BigDecimal livePrice = live.getPrice();
                        BigDecimal lineTotal = livePrice.multiply(BigDecimal.valueOf(ci.getQuantity()));
                        subtotal = subtotal.add(lineTotal);

                        orderItems.add(OrderItem.builder()
                                        .productId(ci.getProductId())
                                        .productName(ci.getProductName())
                                        .imageUrl(ci.getImageUrl())
                                        .unitPrice(livePrice)
                                        .quantity(ci.getQuantity())
                                        .lineTotal(lineTotal)
                                        .variantId(ci.getVariantId())
                                        .variantLabel(ci.getVariantLabel())
                                        .build());
                }

                var addr = request.getShippingAddress();
                String email = request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()
                                ? request.getCustomerEmail()
                                : addr.getEmail();

                OrderAddress shippingAddress = OrderAddress.builder()
                                .recipientName(addr.getRecipientName())
                                .phone(addr.getPhone())
                                .email(email)
                                .street(addr.getStreet())
                                .city(addr.getCity())
                                .country(addr.getCountry())
                                .zipCode(addr.getZipCode())
                                .build();

                BigDecimal shippingFee = calculateShippingFee(subtotal);
                BigDecimal totalAmount = subtotal.add(shippingFee);

                Order order = Order.builder()
                                .userId(userId)
                                .customerEmail(email)
                                .status(OrderStatus.PENDING)
                                .paymentMethod(request.getPaymentMethod())
                                .subtotal(subtotal)
                                .shippingFee(shippingFee)
                                .totalAmount(totalAmount)
                                .notes(request.getNotes())
                                .build();

                orderItems.forEach(item -> item.setOrder(order));
                order.getItems().addAll(orderItems);
                shippingAddress.setOrder(order);
                order.setShippingAddress(shippingAddress);

                Order saved = orderRepository.save(order);
                log.info("Order {} created for userId={} total={} (pending confirmation)", saved.getId(), userId, totalAmount);

                cart.getItems().clear();
                cartRepository.save(cart);

                eventProducer.publishOrderPlaced(buildOrderPlacedEvent(saved));

                return toDetailResponse(saved, null, null);
        }

        @Override
        @Transactional
        public PagedResponse<OrderSummaryResponse> getMyOrders(
                        String userId, int page, int size) {
                Page<Order> result = orderRepository
                                .findByUserIdOrderByPlacedAtDesc(userId, PageRequest.of(page, size));
                return toPagedSummary(result);
        }

        @Override
        @Transactional
        public OrderDetailResponse getMyOrderDetail(String userId, String orderId) {
                Order order = orderRepository.findByIdAndUserId(orderId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Order not found: " + orderId));

                PaymentServiceClient.PaymentStatus payment = paymentClient.getPaymentStatus(orderId);

                return toDetailResponse(order, payment.getStatus(), payment.getPaidAt());
        }

        @Override
        @Transactional
        public PagedResponse<OrderSummaryResponse> getAllOrders(
                        OrderStatus status, int page, int size) {
                PageRequest pageable = PageRequest.of(page, size);
                Page<Order> result = (status != null)
                                ? orderRepository.findByStatusOrderByPlacedAtDesc(status, pageable)
                                : orderRepository.findAllByOrderByPlacedAtDesc(pageable);
                return toPagedSummary(result);
        }

        @Override
        @Transactional
        public OrderDetailResponse getAnyOrderDetail(String orderId) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Order not found: " + orderId));
                PaymentServiceClient.PaymentStatus payment = paymentClient.getPaymentStatus(orderId);
                return toDetailResponse(order, payment.getStatus(), payment.getPaidAt());
        }

        @Override
        @Transactional
        public void updateOrderStatus(String orderId, UpdateOrderStatusRequest req) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Order not found: " + orderId));
                OrderStatus oldStatus = order.getStatus();
                OrderStatus newStatus = req.getStatus();

                if (oldStatus == OrderStatus.CANCELLED) {
                        throw new IllegalStateException("Cancelled orders cannot be reopened.");
                }
                if (oldStatus == OrderStatus.DELIVERED && newStatus != OrderStatus.DELIVERED) {
                        throw new IllegalStateException("Delivered orders cannot be modified.");
                }
                if (newStatus != OrderStatus.CANCELLED && newStatus.ordinal() < oldStatus.ordinal()) {
                        throw new IllegalStateException("Order status cannot move backwards: " + oldStatus + " -> " + newStatus);
                }

                boolean wasStockDecremented = (oldStatus == OrderStatus.CONFIRMED
                                || oldStatus == OrderStatus.SHIPPED
                                || oldStatus == OrderStatus.DELIVERED);

                boolean shouldDecrementStock = (oldStatus == OrderStatus.PENDING
                                && (newStatus == OrderStatus.CONFIRMED
                                                || newStatus == OrderStatus.SHIPPED
                                                || newStatus == OrderStatus.DELIVERED));

                if (shouldDecrementStock) {
                        for (OrderItem item : order.getItems()) {
                                ProductServiceClient.ProductDetail detail = productClient.getProductDetail(item.getProductId());
                                ProductServiceClient.VariantResponseDTO variant = detail.getVariants().stream()
                                                .filter(v -> (item.getVariantId() != null && v.getId().equals(item.getVariantId()))
                                                                || (item.getVariantLabel() != null && item.getVariantLabel().equalsIgnoreCase(v.getSize())))
                                                .findFirst()
                                                .orElseThrow(() -> new ResourceNotFoundException(
                                                                "Variant not found for product: " + item.getProductName()));

                                int availableStock = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                                if (availableStock <= 0) {
                                        throw new IllegalStateException("Out of stock: Product '" + item.getProductName()
                                                        + "' (" + (item.getVariantLabel() != null ? item.getVariantLabel() : "Standard")
                                                        + ") is completely out of stock (Stock is 0). Cannot update status to " + newStatus + ".");
                                }
                                if (availableStock < item.getQuantity()) {
                                        throw new IllegalStateException("Insufficient stock: Product '" + item.getProductName()
                                                        + "' (" + (item.getVariantLabel() != null ? item.getVariantLabel() : "Standard")
                                                        + ") only has " + availableStock + " available, but order requires "
                                                        + item.getQuantity() + ". Cannot update status to " + newStatus + ".");
                                }
                        }

                        for (OrderItem item : order.getItems()) {
                                productClient.decrementStock(item.getProductId(), item.getQuantity(), item.getVariantId());
                        }
                        log.info("Order {} updated to {}; stock decremented for {} items", orderId, newStatus, order.getItems().size());
                } else if (wasStockDecremented && newStatus == OrderStatus.CANCELLED) {
                        for (OrderItem item : order.getItems()) {
                                productClient.incrementStock(item.getProductId(), item.getQuantity(), item.getVariantId());
                        }
                        log.info("Order {} cancelled; stock restored for {} items", orderId, order.getItems().size());
                }

                order.setStatus(newStatus);
                orderRepository.save(order);
                log.info("Order {} status updated from {} to {} by admin", orderId, oldStatus, newStatus);
        }

        @Override
        @Transactional
        public AdminStatsResponse getStats() {
                LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
                LocalDateTime endOfDay = startOfDay.plusDays(1);

                return AdminStatsResponse.builder()
                                .totalOrders(orderRepository.count())
                                .ordersToday(orderRepository.countBetween(startOfDay, endOfDay))
                                .totalRevenue(orderRepository.totalRevenue())
                                .revenueToday(orderRepository.revenueBetween(startOfDay, endOfDay))
                                .pendingOrders(orderRepository.countByStatus(OrderStatus.PENDING))
                                .cancelledOrders(orderRepository.countByStatus(OrderStatus.CANCELLED))
                                .build();
        }

        @Override
        @Transactional
        public void confirmOrderAfterPayment(String orderId) {
                orderRepository.findById(orderId).ifPresent(order -> {
                        if (order.getStatus() == OrderStatus.PENDING) {
                                order.setStatus(OrderStatus.CONFIRMED);
                                for (OrderItem item : order.getItems()) {
                                        productClient.decrementStock(item.getProductId(), item.getQuantity(), item.getVariantId());
                                }
                                orderRepository.save(order);
                                log.info("Order {} auto-confirmed after payment and stock decremented", orderId);
                        }
                });
        }

        @Override
        public Map<String, Integer> getReservedStockMap() {
                List<Object[]> rows = orderRepository.findReservedStockByStatus(OrderStatus.PENDING);
                Map<String, Integer> map = new HashMap<>();
                for (Object[] row : rows) {
                        if (row[0] != null && row[1] != null) {
                                map.put(String.valueOf(row[0]), ((Number) row[1]).intValue());
                        }
                }
                return map;
        }

        @Override
        public Map<String, Integer> getReservedStockMap(String userId) {
                if (userId == null || userId.isBlank()) {
                        return new HashMap<>();
                }
                List<Object[]> rows = orderRepository.findReservedStockByUserAndStatus(userId, OrderStatus.PENDING);
                Map<String, Integer> map = new HashMap<>();
                for (Object[] row : rows) {
                        if (row[0] != null && row[1] != null) {
                                map.put(String.valueOf(row[0]), ((Number) row[1]).intValue());
                        }
                }
                return map;
        }

        private BigDecimal calculateShippingFee(BigDecimal subtotal) {
                return BigDecimal.ZERO;
        }

        private OrderPlacedEvent buildOrderPlacedEvent(Order order) {
                List<OrderPlacedEvent.OrderItemEvent> itemEvents = order.getItems().stream()
                                .map(i -> OrderPlacedEvent.OrderItemEvent.builder()
                                                .productId(i.getProductId())
                                                .productName(i.getProductName())
                                                .quantity(i.getQuantity())
                                                .unitPrice(i.getUnitPrice())
                                                .build())
                                .toList();

                return OrderPlacedEvent.builder()
                                .orderId(order.getId())
                                .userId(order.getUserId())
                                .items(itemEvents)
                                .totalAmount(order.getTotalAmount())
                                .recipientName(order.getShippingAddress().getRecipientName())
                                .shippingCity(order.getShippingAddress().getCity())
                                .shippingCountry(order.getShippingAddress().getCountry())
                                .paymentMethod(order.getPaymentMethod().name())
                                .placedAt(order.getPlacedAt())
                                .build();
        }

        private OrderDetailResponse toDetailResponse(Order order,
                        String paymentStatus,
                        LocalDateTime paidAt) {
                List<OrderItemResponse> items = order.getItems().stream()
                                .map(i -> OrderItemResponse.builder()
                                                .itemId(i.getId())
                                                .productId(i.getProductId())
                                                .variantId(i.getVariantId() != null ? String.valueOf(i.getVariantId()) : null)
                                                .variantLabel(i.getVariantLabel())
                                                .productName(i.getProductName())
                                                .imageUrl(i.getImageUrl())
                                                .unitPrice(i.getUnitPrice())
                                                .quantity(i.getQuantity())
                                                .lineTotal(i.getLineTotal())
                                                .build())
                                .toList();

                AddressResponse address = null;
                if (order.getShippingAddress() != null) {
                        OrderAddress a = order.getShippingAddress();
                        address = AddressResponse.builder()
                                        .recipientName(a.getRecipientName())
                                        .phone(a.getPhone())
                                        .email(a.getEmail())
                                        .street(a.getStreet())
                                        .city(a.getCity())
                                        .country(a.getCountry())
                                        .zipCode(a.getZipCode())
                                        .build();
                }

                String customerEmail = order.getCustomerEmail() != null
                                ? order.getCustomerEmail()
                                : (address != null ? address.getEmail() : null);

                return OrderDetailResponse.builder()
                                .orderId(order.getId())
                                .userId(order.getUserId())
                                .customerEmail(customerEmail)
                                .status(order.getStatus())
                                .paymentMethod(order.getPaymentMethod())
                                .subtotal(order.getSubtotal())
                                .shippingFee(order.getShippingFee())
                                .totalAmount(order.getTotalAmount())
                                .notes(order.getNotes())
                                .items(items)
                                .shippingAddress(address)
                                .placedAt(order.getPlacedAt())
                                .updatedAt(order.getUpdatedAt())
                                .paymentStatus(paymentStatus)
                                .paidAt(paidAt)
                                .build();
        }

        private PagedResponse<OrderSummaryResponse> toPagedSummary(Page<Order> page) {
                List<OrderSummaryResponse> items = page.getContent().stream()
                                .map(order -> {
                                        String firstName = order.getItems().isEmpty() ? ""
                                                        : order.getItems().get(0).getProductName();
                                        String firstImage = order.getItems().isEmpty() ? null
                                                        : order.getItems().get(0).getImageUrl();

                                        List<OrderItemResponse> orderItems = order.getItems().stream()
                                                        .map(i -> OrderItemResponse.builder()
                                                                        .itemId(i.getId())
                                                                        .productId(i.getProductId())
                                                                        .variantId(i.getVariantId() != null ? String.valueOf(i.getVariantId()) : null)
                                                                        .variantLabel(i.getVariantLabel())
                                                                        .productName(i.getProductName())
                                                                        .imageUrl(i.getImageUrl())
                                                                        .unitPrice(i.getUnitPrice())
                                                                        .quantity(i.getQuantity())
                                                                        .lineTotal(i.getLineTotal())
                                                                        .build())
                                                        .toList();

                                        AddressResponse address = null;
                                        if (order.getShippingAddress() != null) {
                                                OrderAddress a = order.getShippingAddress();
                                                address = AddressResponse.builder()
                                                                .recipientName(a.getRecipientName())
                                                                .phone(a.getPhone())
                                                                .email(a.getEmail())
                                                                .street(a.getStreet())
                                                                .city(a.getCity())
                                                                .country(a.getCountry())
                                                                .zipCode(a.getZipCode())
                                                                .build();
                                        }

                                        String email = order.getCustomerEmail() != null
                                                        ? order.getCustomerEmail()
                                                        : (address != null ? address.getEmail() : null);

                                        return OrderSummaryResponse.builder()
                                                        .orderId(order.getId())
                                                        .userId(order.getUserId())
                                                        .customerEmail(email)
                                                        .status(order.getStatus())
                                                        .paymentMethod(order.getPaymentMethod())
                                                        .subtotal(order.getSubtotal())
                                                        .shippingFee(order.getShippingFee())
                                                        .totalAmount(order.getTotalAmount())
                                                        .itemCount(order.getItems().size())
                                                        .placedAt(order.getPlacedAt())
                                                        .updatedAt(order.getUpdatedAt())
                                                        .notes(order.getNotes())
                                                        .firstItemName(firstName)
                                                        .firstItemImage(firstImage)
                                                        .items(orderItems)
                                                        .shippingAddress(address)
                                                        .build();
                                })
                                .toList();

                return PagedResponse.<OrderSummaryResponse>builder()
                                .items(items)
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .currentPage(page.getNumber())
                                .pageSize(page.getSize())
                                .hasNext(page.hasNext())
                                .hasPrevious(page.hasPrevious())
                                .build();
        }
}
