package com.order.order.Events.Publishers;

import com.order.order.config.RabbitMQConfig;
import com.order.order.Events.OrderCancelledEvent;
import com.order.order.Events.OrderPlacedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange}")
    private String exchange;


    public void publishOrderPlaced(OrderPlacedEvent event) {
        log.info("Publishing order.placed — orderId={}", event.getOrderId());
        try {
            rabbitTemplate.convertAndSend(
                    exchange,
                    RabbitMQConfig.RK_ORDER_PLACED,
                    event);
        } catch (Exception ex) {
            log.error("Failed to publish order.placed for orderId={}: {}",
                    event.getOrderId(), ex.getMessage());
        }
    }

    public void publishOrderCancelled(OrderCancelledEvent event) {
        log.info("Publishing order.cancelled — orderId={}", event.getOrderId());
        try {
            rabbitTemplate.convertAndSend(
                    exchange,
                    RabbitMQConfig.RK_ORDER_CANCELLED,
                    event);
        } catch (Exception ex) {
            log.error("Failed to publish order.cancelled for orderId={}: {}",
                    event.getOrderId(), ex.getMessage());
        }
    }
}
