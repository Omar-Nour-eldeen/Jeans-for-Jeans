package com.userservice.userservices.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_CREATED_QUEUE = "user.created.queue";
    public static final String USER_CREATED_KEY = "user.created";

    @Bean
    public TopicExchange userExchange() {
        return ExchangeBuilder
                .topicExchange(USER_EXCHANGE)
                .durable(true)
                .build();
    }

    @Bean
    public Queue userCreatedQueue() {
        return QueueBuilder
                .durable(USER_CREATED_QUEUE)
                .build();
    }

    @Bean
    public Binding userCreatedBinding() {
        return BindingBuilder
                .bind(userCreatedQueue())
                .to(userExchange())
                .with(USER_CREATED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
