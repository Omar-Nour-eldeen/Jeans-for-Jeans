package com.commerce.auth_service.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SseEmitterService {

    private final Map<String, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    private final ScheduledExecutorService heartbeatScheduler = Executors.newSingleThreadScheduledExecutor();

    @PostConstruct
    public void init() {
        // Send keepalive ping every 25 seconds to prevent reverse-proxy timeouts (Render, Cloudflare, Nginx)
        heartbeatScheduler.scheduleAtFixedRate(this::sendHeartbeat, 25, 25, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void destroy() {
        heartbeatScheduler.shutdownNow();
    }

    private void sendHeartbeat() {
        userEmitters.values().forEach(emitters -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("keepalive"));
                } catch (Exception e) {
                    emitters.remove(emitter);
                }
            }
        });
    }

    public SseEmitter createEmitter(String userId) {
        // 30 minutes timeout
        SseEmitter emitter = new SseEmitter(1800000L);

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> {
            List<SseEmitter> list = userEmitters.get(userId);
            if (list != null) {
                list.remove(emitter);
                if (list.isEmpty()) {
                    userEmitters.remove(userId);
                }
            }
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to permission stream"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event for user {}", userId);
            cleanup.run();
        }

        return emitter;
    }

    public void sendPermissionUpdate(String userId, Set<String> newPermissions) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("permissions-updated")
                        .data(newPermissions));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    public void sendAccountDeleted(String userId) {
        List<SseEmitter> emitters = userEmitters.remove(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("account-deleted")
                        .data("Account deleted"));
                emitter.complete();
            } catch (Exception e) {
                // Ignore broken connections
            }
        }
    }
}
