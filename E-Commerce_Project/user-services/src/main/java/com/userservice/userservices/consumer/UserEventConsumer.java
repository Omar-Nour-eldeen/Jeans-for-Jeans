package com.userservice.userservices.consumer;

import com.userservice.userservices.config.RabbitMQConfig;
import com.userservice.userservices.dto.event.UserRegisteredEvent;
import com.userservice.userservices.entity.User;
import com.userservice.userservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventConsumer {

    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.USER_CREATED_QUEUE)
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for userId: {}, email: {}", event.getUserId(), event.getEmail());

        if (event.getUserId() == null || event.getEmail() == null) {
            log.warn("Invalid UserRegisteredEvent received: {}", event);
            return;
        }

        if (userRepository.existsById(event.getUserId())) {
            log.info("User with id {} already exists in userdb", event.getUserId());
            return;
        }

        User user = User.builder()
                .id(event.getUserId())
                .email(event.getEmail())
                .firstName("")
                .lastName("")
                .phoneNumber("")
                .street("")
                .city("")
                .country("")
                .zipCode("")
                .blocked(false)
                .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                .build();

        userRepository.save(user);
        log.info("Successfully provisioned user {} in userdb", event.getUserId());
    }
}
