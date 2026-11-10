package com.userservice.userservices.controller;

import com.userservice.userservices.dto.response.AdminUserResponse;
import com.userservice.userservices.dto.response.ApiResponse;
import com.userservice.userservices.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
// import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;


    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getAllUsers(
            @RequestParam(required = false) Boolean blocked,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getAllUsers(blocked, pageable)));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUserById(id)));
    }


    @PatchMapping("/{id}/block")
    public ResponseEntity<ApiResponse<AdminUserResponse>> toggleBlock(@PathVariable String id) {
        AdminUserResponse user = adminUserService.toggleBlockUser(id);
        String msg = user.isBlocked() ? "User blocked successfully" : "User unblocked successfully";
        return ResponseEntity.ok(ApiResponse.success(msg, user));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User permanently deleted", null));
    }
}
