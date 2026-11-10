package com.userservice.userservices.service;

import com.userservice.userservices.dto.response.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {
    Page<AdminUserResponse> getAllUsers(Boolean blocked, Pageable pageable);
    AdminUserResponse getUserById(String userId);
    AdminUserResponse toggleBlockUser(String userId);
    void deleteUser(String userId);
}
