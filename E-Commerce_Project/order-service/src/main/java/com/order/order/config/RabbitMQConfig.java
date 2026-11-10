package com.order.order.config;

// NOTE: Change the package name to match each service:
//   com.shopflow.auth.config
//   com.shopflow.order.config
//   com.shopflow.payment.config
//   com.shopflow.notification.config
//   com.shopflow.product.config   (only if it publishes/consumes events)

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.exchange}")
    private String exchange;

    public static final String Q_ORDER_PLACED = "order.placed.queue";
    public static final String Q_ORDER_CANCELLED = "order.cancelled.queue";
    public static final String Q_ORDER_STATUS_UPDATED = "order.status.updated.queue";
    public static final String Q_PAYMENT_COMPLETED = "payment.completed.queue";
    public static final String Q_PAYMENT_FAILED = "payment.failed.queue";
    public static final String Q_PAYMENT_REFUNDED = "payment.refunded.queue";
    public static final String Q_USER_REGISTERED = "user.registered.queue";
    public static final String Q_PASSWORD_RESET = "password.reset.queue";

    public static final String RK_ORDER_PLACED = "order.placed";
    public static final String RK_ORDER_CANCELLED = "order.cancelled";
    public static final String RK_ORDER_STATUS_UPDATED = "order.status.updated";
    public static final String RK_PAYMENT_COMPLETED = "payment.completed";
    public static final String RK_PAYMENT_FAILED = "payment.failed";
    public static final String RK_PAYMENT_REFUNDED = "payment.refunded";
    public static final String RK_USER_REGISTERED = "user.registered";
    public static final String RK_PASSWORD_RESET = "password.reset";


    @Bean
    public CommandLineRunner test() {
        return args -> {
            System.out.println("RABBIT CONFIG LOADED");
        };
    }

    @Bean
    public ApplicationRunner runner(RabbitTemplate template) {
        return args -> {
            template.convertAndSend(exchange, RK_ORDER_PLACED, "HELLO");
            System.out.println("Message sent!");
        };
    }

    @Bean
    public TopicExchange shopflowExchange() {
        return new TopicExchange(exchange, true, false);
    }


    @Bean
    public Queue orderPlacedQueue() {
        System.out.println("Queue is created");
        return durable(Q_ORDER_PLACED);
    }

    @Bean
    public Queue orderCancelledQueue() {
        return durable(Q_ORDER_CANCELLED);
    }

    @Bean
    public Queue orderStatusUpdatedQueue() {
        return durable(Q_ORDER_STATUS_UPDATED);
    }

    @Bean
    public Queue paymentCompletedQueue() {
        return durable(Q_PAYMENT_COMPLETED);
    }

    @Bean
    public Queue paymentFailedQueue() {
        return durable(Q_PAYMENT_FAILED);
    }

    @Bean
    public Queue paymentRefundedQueue() {
        return durable(Q_PAYMENT_REFUNDED);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return durable(Q_USER_REGISTERED);
    }

    @Bean
    public Queue passwordResetQueue() {
        return durable(Q_PASSWORD_RESET);
    }


    @Bean
    public Binding bindOrderPlaced(Queue orderPlacedQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(orderPlacedQueue).to(shopflowExchange).with(RK_ORDER_PLACED);
    }

    @Bean
    public Binding bindOrderCancelled(Queue orderCancelledQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(orderCancelledQueue).to(shopflowExchange).with(RK_ORDER_CANCELLED);
    }

    @Bean
    public Binding bindOrderStatusUpdated(Queue orderStatusUpdatedQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(orderStatusUpdatedQueue).to(shopflowExchange).with(RK_ORDER_STATUS_UPDATED);
    }

    @Bean
    public Binding bindPaymentCompleted(Queue paymentCompletedQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(paymentCompletedQueue).to(shopflowExchange).with(RK_PAYMENT_COMPLETED);
    }

    @Bean
    public Binding bindPaymentFailed(Queue paymentFailedQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(paymentFailedQueue).to(shopflowExchange).with(RK_PAYMENT_FAILED);
    }

    @Bean
    public Binding bindPaymentRefunded(Queue paymentRefundedQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(paymentRefundedQueue).to(shopflowExchange).with(RK_PAYMENT_REFUNDED);
    }

    @Bean
    public Binding bindUserRegistered(Queue userRegisteredQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(shopflowExchange).with(RK_USER_REGISTERED);
    }

    @Bean
    public Binding bindPasswordReset(Queue passwordResetQueue, TopicExchange shopflowExchange) {
        return BindingBuilder.bind(passwordResetQueue).to(shopflowExchange).with(RK_PASSWORD_RESET);
    }


    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        template.setMandatory(true);
        return template;
    }

    private Queue durable(String name) {
        return new Queue(name, true, false, false);
    }
}
