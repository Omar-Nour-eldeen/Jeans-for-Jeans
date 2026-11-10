package com.userservice.userservices.controller;

import com.userservice.userservices.dto.request.AddressRequest;
import com.userservice.userservices.dto.request.SupportRequest;
import com.userservice.userservices.dto.request.UpdateProfileRequest;
import com.userservice.userservices.dto.response.AddressResponse;
import com.userservice.userservices.dto.response.ApiResponse;
import com.userservice.userservices.dto.response.UserProfileResponse;
import com.userservice.userservices.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // US-5 — GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @RequestHeader("User-Id") String userId,
            @RequestHeader(value = "User-Email", required = false) String email) {
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId, email)));
    }

    // US-5 — PUT /api/users/me
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestHeader("User-Id") String userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully",
                        userService.updateProfile(userId, request)));
    }

    // US-5 — POST /api/users/me/photo
    // @PostMapping("/me/photo")
    // public ResponseEntity<ApiResponse<String>> uploadPhoto(
    //         @RequestHeader("X-User-Id") String userId,
    //         @RequestParam("file") MultipartFile file) {
    //     String photoUrl = userService.uploadPhoto(userId, file);
    //     return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", photoUrl));
    // }

    // US-5, US-19 — POST /api/users/me/addresses
    @PostMapping("/me/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @RequestHeader("User-Id") String userId,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse address = userService.addAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added successfully", address));
    }

    // US-19 — GET /api/users/me/addresses
    @GetMapping("/me/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(
            @RequestHeader("User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAddresses(userId)));
    }

    // US-5 — PUT /api/users/me/addresses/{id}
    @PutMapping("/me/addresses/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @RequestHeader("User-Id") String userId,
            @PathVariable String id,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Address updated successfully",
                        userService.updateAddress(userId, id, request)));
    }

    // US-5 — DELETE /api/users/me/addresses/{id}
    @DeleteMapping("/me/addresses/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @RequestHeader("User-Id") String userId,
            @PathVariable String id) {
        userService.deleteAddress(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }

    // US-7 — POST /api/users/support
    @PostMapping("/support")
    public ResponseEntity<ApiResponse<Void>> submitSupport(
            @RequestHeader("User-Id") String userId,
            @Valid @RequestBody SupportRequest request) {
        userService.submitSupportRequest(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Support request submitted successfully", null));
    }
}
