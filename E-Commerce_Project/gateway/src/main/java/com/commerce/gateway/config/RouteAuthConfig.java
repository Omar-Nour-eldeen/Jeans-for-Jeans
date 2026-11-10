package com.commerce.gateway.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import com.commerce.gateway.security.RouteRule;

@Configuration
public class RouteAuthConfig {

        @Bean
        public List<RouteRule> routeRules() {
                return List.of(
                                RouteRule.adminOnly("/users/manage/**"),

                                // Employee management routes
                                RouteRule.withPermission(
                                                "/admin/auth/employees/**", HttpMethod.GET,
                                                "employee:read", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/auth/employees/**", HttpMethod.POST,
                                                "employee:create", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/auth/employees/**", HttpMethod.PUT,
                                                "employee:update", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/auth/employees/**", HttpMethod.DELETE,
                                                "employee:delete", "ADMIN", "EMPLOYEE"),

                                // Product routes
                                RouteRule.withPermission(
                                                "/admin/products/**", HttpMethod.POST,
                                                "product:create", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/products/**", HttpMethod.PUT,
                                                "product:update", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/products/**", HttpMethod.DELETE,
                                                "product:delete", "ADMIN", "EMPLOYEE"),
                                // Order routes
                                RouteRule.withPermission(
                                                "/admin/orders/stats", HttpMethod.GET,
                                                "admin:dashboard,order:read", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/orders/**", HttpMethod.GET,
                                                "order:read", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/orders/**", HttpMethod.POST,
                                                "order:create", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/orders/**", HttpMethod.PATCH,
                                                "order:update,order:cancel", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/orders/**", HttpMethod.DELETE,
                                                "order:delete", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/orders/**", HttpMethod.GET,
                                                "order:read", "USER", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/products/**", HttpMethod.GET,
                                                "product:read", "USER", "ADMIN", "EMPLOYEE"),

                                // category routes
                                RouteRule.withPermission(
                                                "/admin/categories/**", HttpMethod.POST,
                                                "category:create", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/categories/**", HttpMethod.PUT,
                                                "category:update", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/admin/categories/**", HttpMethod.DELETE,
                                                "category:delete", "ADMIN", "EMPLOYEE"),

                                RouteRule.withPermission(
                                                "/categories/**", HttpMethod.GET,
                                                "category:read", "USER", "ADMIN", "EMPLOYEE"),

                                RouteRule.forMethod("/auth/refresh", HttpMethod.POST, "USER", "EMPLOYEE"),

                                RouteRule.forRoles("/orders/**", "USER", "EMPLOYEE"),
                                RouteRule.forRoles("/payments/**", "USER", "EMPLOYEE"),
                                RouteRule.forRoles("/auth/**", "USER", "EMPLOYEE"),
                                RouteRule.forRoles("/cart/**", "USER", "EMPLOYEE"),
                                RouteRule.forRoles("/users/**", "USER", "EMPLOYEE", "ADMIN"),
                                RouteRule.adminOnly("/admin/users/**"),

                                RouteRule.adminOnly("/**")

                );
        }
}