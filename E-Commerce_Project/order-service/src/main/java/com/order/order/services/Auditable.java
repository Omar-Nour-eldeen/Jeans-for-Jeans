package com.order.order.services;

public @interface Auditable {

    String action();

    String entityType();

}
