package com.commerce.auth_service.event;

import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.commerce.auth_service.RabbitMQConfig.RabbitMQConstants;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class UserEventPublisher {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void publishUserRegistered(UserRegisteredEvent event) {
        try {
            CorrelationData correlationData =
                new CorrelationData(event.getUserId());

            rabbitTemplate.convertAndSend(
                RabbitMQConstants.USER_EXCHANGE,
                RabbitMQConstants.USER_CREATED_KEY,
                event,
                correlationData
            );

            log.info("Published UserRegisteredEvent for userId: {}",
                    event.getUserId());

        } catch (AmqpException e) {
            log.error("Failed to publish UserRegisteredEvent for userId: {}",
                    event.getUserId(), e);
        }
    }
}
