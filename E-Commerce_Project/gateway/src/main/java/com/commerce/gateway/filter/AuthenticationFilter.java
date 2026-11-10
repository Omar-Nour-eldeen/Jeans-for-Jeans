package com.commerce.gateway.filter;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import com.commerce.gateway.security.RoleHierarchy;
import com.commerce.gateway.security.RouteRule;
import com.commerce.gateway.util.JwtUtil;
import jakarta.ws.rs.core.HttpHeaders;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

        @Autowired
        private JwtUtil jwtUtil;
        @Autowired
        private List<RouteRule> routeRules;

        private static final Set<String> PUBLIC_PATHS = Set.of(
                        "/auth/login",
                        "/auth/register",
                        "/auth/refresh",
                        "/auth/forgot-password",   
                        "/auth/reset-password",
                        "/auth/subscribe",
                        "/orders/reserved-stock" ) ;

        @Override
        public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

                String path = exchange.getRequest().getPath().toString();
                HttpMethod method = exchange.getRequest().getMethod();
                log.info(">>> REQUEST: {} {}", method, path);
                log.info(">>> HEADERS: {}", exchange.getRequest().getHeaders());

                // Bypass CORS preflight requests so browser gets CORS headers
                if (method == HttpMethod.OPTIONS) {
                        return chain.filter(exchange);
                }

                ServerHttpRequest sanitizedRequest = exchange.getRequest()
                                .mutate()
                                .headers(headers -> {
                                        headers.remove("User-Id");
                                        headers.remove("User-Role");
                                        headers.remove("User-Email");
                                        headers.remove("User-Permissions");
                                })
                                .build();

                ServerWebExchange sanitizedExchange = exchange.mutate()
                                .request(sanitizedRequest)
                                .build();

                if (isPublicPath(path)) {
                        return chain.filter(sanitizedExchange);
                }

                String authHeader = sanitizedExchange.getRequest()
                                .getHeaders()
                                .getFirst(HttpHeaders.AUTHORIZATION);

                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        return reject(exchange, HttpStatus.UNAUTHORIZED,
                                        "Missing or malformed Authorization header");
                }

                String token = authHeader.substring(7);

                if (!jwtUtil.isTokenValid(token)) {
                        return reject(exchange, HttpStatus.UNAUTHORIZED,
                                        "Token is invalid or expired");
                }

                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);
                String userId = jwtUtil.extractUserId(token);
                Set<String> permissions = jwtUtil.extractPermissions(token);

                if (!isRoleAuthorized(path, method, role)) {
                        return reject(exchange, HttpStatus.FORBIDDEN,
                                        "You do not have permission to access this resource");
                }
                if (!isPermissionAuthorized(path, method, role, permissions)) {
                        return reject(exchange, HttpStatus.FORBIDDEN,
                                        "You do not have the required permission for this action");
                }

                ServerHttpRequest enrichedRequest = sanitizedExchange.getRequest()
                                .mutate()
                                .header("User-Id", String.valueOf(userId))
                                .header("User-Role", role)
                                .header("User-Permissions", String.join(",", permissions))
                                .header("User-Email", email)
                                .build();

                return chain.filter(sanitizedExchange.mutate()
                                .request(enrichedRequest)
                                .build());
        }

        @Override
        public int getOrder() {
                return -1;
        }

        private boolean isRoleAuthorized(String path,
                        HttpMethod method,
                        String role) {
                if (RoleHierarchy.isElevatedRole(role))
                        return true;

                return routeRules.stream()
                                .filter(rule -> rule.matches(path, method))
                                .findFirst()
                                .map(rule -> rule.isRoleAllowed(role))
                                .orElse(false);
        }

        private boolean isPermissionAuthorized(String path,
                        HttpMethod method,
                        String role,
                        Set<String> permissions) {
                return routeRules.stream()
                                .filter(rule -> rule.matches(path, method))
                                .findFirst()
                                .map(rule -> {
                                        if (!rule.isPermissionRequired())
                                                return true;

                                        if (RoleHierarchy.isElevatedRole(role)) {
                                                return true;
                                        }

                                        return rule.hasRequiredPermission(permissions);
                                })
                                .orElse(false);
        }

        private boolean isPublicPath(String path) {
                return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
        }

        private Mono<Void> reject(ServerWebExchange exchange,
                        HttpStatus status,
                        String message) {

                ServerHttpResponse response = exchange.getResponse();
                response.setStatusCode(status);
                response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

                String origin = exchange.getRequest().getHeaders().getOrigin();
                if (origin != null && !origin.isBlank()) {
                        response.getHeaders().set("Access-Control-Allow-Origin", origin);
                        response.getHeaders().set("Access-Control-Allow-Credentials", "true");
                        response.getHeaders().set("Access-Control-Allow-Headers", "*");
                        response.getHeaders().set("Access-Control-Allow-Methods", "*");
                }

                String body = String.format(
                                "{\"status\":%d,\"error\":\"%s\",\"message\":\"%s\"}",
                                status.value(),
                                status.getReasonPhrase(),
                                message);

                DataBuffer buffer = response.bufferFactory()
                                .wrap(body.getBytes(StandardCharsets.UTF_8));

                return response.writeWith(Mono.just(buffer));
        }

}
