
package com.userservice.userservices.service;

import com.userservice.userservices.dto.response.AdminUserResponse;
import com.userservice.userservices.entity.User;
import com.userservice.userservices.exception.UserNotFoundException;
import com.userservice.userservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceimpl implements AdminUserService {

    private final UserRepository userRepository;

    @Override
    public Page<AdminUserResponse> getAllUsers(Boolean blocked, Pageable pageable) {
        Page<User> users = (blocked != null)
                ? userRepository.findByBlocked(blocked, pageable)
                : userRepository.findAll(pageable);
        return users.map(this::mapToAdminResponse);
    }

    @Override
    public AdminUserResponse getUserById(String userId) {
        return mapToAdminResponse(findUserById(userId));
    }

    @Override
    @Transactional
    public AdminUserResponse toggleBlockUser(String userId) {
        User user = findUserById(userId);
        user.setBlocked(!user.isBlocked());
        User saved = userRepository.save(user);
        // SRS 3.2.2: Auth Service rejects existing JWTs on next verification
        // by querying the blocked flag from this service / shared DB
        log.info("User {} toggled — now {}", userId, saved.isBlocked() ? "BLOCKED" : "ACTIVE");
        return mapToAdminResponse(saved);
    }






    @Override
    @Transactional
    public void deleteUser(String userId) {
        User user = findUserById(userId);
        userRepository.delete(user);  // cascades to addresses (orphanRemoval = true)
        log.info("User {} permanently deleted by admin", userId);
    }





    // ── helpers ──────────────────────────────────────────────────

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }






    private AdminUserResponse mapToAdminResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .photoUrl(user.getPhotoUrl())
                .blocked(user.isBlocked())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
