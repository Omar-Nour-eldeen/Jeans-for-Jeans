package com.commerce.auth_service.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.commerce.auth_service.RabbitMQConfig.RabbitMQConstants;

@Configuration
@Slf4j
public class RabbitMQConfig {

    @Bean
    public TopicExchange userExchange() {
        return ExchangeBuilder
                .topicExchange(RabbitMQConstants.USER_EXCHANGE)
                .durable(true)
                .build();
    }
    @Bean
    public Queue userCreatedQueue() {
        return QueueBuilder
                .durable(RabbitMQConstants.USER_CREATED_QUEUE)
                .build();
    }

    @Bean
    public Binding userCreatedBinding() {
        return BindingBuilder
                .bind(userCreatedQueue())
                .to(userExchange())
                .with(RabbitMQConstants.USER_CREATED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {

        RabbitTemplate template = new RabbitTemplate(connectionFactory);

        template.setMessageConverter(jsonMessageConverter());

        template.setConfirmCallback((correlationData, ack, cause) -> {

            if (!ack) {
                log.error("Message failed to reach exchange: {}", cause);
            }

        });
        template.setMandatory(true);

        template.setReturnsCallback(returned ->

            log.error(
                "Message returned from exchange: {} — reason: {}",
                returned.getMessage(),
                returned.getReplyText()
            )
        );
        return template;
    }
}