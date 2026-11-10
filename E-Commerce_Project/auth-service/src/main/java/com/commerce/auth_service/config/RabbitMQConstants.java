package com.commerce.auth_service.config;

public final class RabbitMQConstants {

    public static final String USER_EXCHANGE     = "user.exchange";

    public static final String USER_CREATED_QUEUE = "user.created.queue";
    // public static final String USER_CREATED_DLQ   = "user.created.dlq";    

    public static final String USER_CREATED_KEY   = "user.created";

    private RabbitMQConstants() {}
}