package com.userservice.userservices.service;

import com.userservice.userservices.dto.request.AddressRequest;
import com.userservice.userservices.dto.request.SupportRequest;
import com.userservice.userservices.dto.request.UpdateProfileRequest;
import com.userservice.userservices.dto.response.AddressResponse;
import com.userservice.userservices.dto.response.UserProfileResponse;
import com.userservice.userservices.entity.Address;
import com.userservice.userservices.entity.User;
import com.userservice.userservices.exception.AddressNotFoundException;
import com.userservice.userservices.exception.UserNotFoundException;
import com.userservice.userservices.repository.AddressRepository;
import com.userservice.userservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService  {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    // private final S3Service s3Service;

    @Override
    public UserProfileResponse getProfile(String userId) {
        return getProfile(userId, null);
    }

    @Override
    @Transactional
    public UserProfileResponse getProfile(String userId, String email) {
        User user = findOrCreateUser(userId, email);
        if (email != null && !email.isBlank() && (user.getEmail() == null
                || user.getEmail().endsWith("@example.com")
                || user.getEmail().endsWith("@local.com")
                || user.getEmail().startsWith("user-"))) {
            user.setEmail(email);
            user = userRepository.save(user);
        }
        return mapToProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = findUserById(userId);
        // SRS 3.2.1: email and id are NOT updatable
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getStreet() != null) user.setStreet(request.getStreet());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getCountry() != null) user.setCountry(request.getCountry());
        if (request.getZipCode() != null) user.setZipCode(request.getZipCode());
        if (request.getPhotoUrl() != null) user.setPhotoUrl(request.getPhotoUrl());
        User saved = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);
        return mapToProfileResponse(saved);
    }

    // @Override
    // @Transactional
    // public String uploadPhoto(String userId, MultipartFile file) {
    //     User user = findUserById(userId);
    //     String photoUrl = s3Service.uploadFile(file, userId);
    //     user.setPhotoUrl(photoUrl);
    //     userRepository.save(user);
    //     log.info("Photo uploaded for user: {}", userId);
    //     return photoUrl;
    // }

    @Override
    @Transactional
    public AddressResponse addAddress(String userId, AddressRequest request) {
        User user = findUserById(userId);
        Address address = Address.builder()
                .user(user)
                .recipientName(request.getRecipientName())
                .build();
        Address saved = addressRepository.save(address);
        log.info("Address added for user: {}", userId);
        return mapToAddressResponse(saved);
    }

    @Override
    public List<AddressResponse> getAddresses(String userId) {
        findUserById(userId); // verify user exists
        return addressRepository.findByUserId(userId)
                .stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(String userId, String addressId, AddressRequest request) {
        // findByIdAndUserId prevents users from updating other users' addresses
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AddressNotFoundException(addressId));
        address.setRecipientName(request.getRecipientName());
        Address saved = addressRepository.save(address);
        log.info("Address {} updated for user: {}", addressId, userId);
        return mapToAddressResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(String userId, String addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AddressNotFoundException(addressId));
        addressRepository.delete(address);
        log.info("Address {} deleted for user: {}", addressId, userId);
    }

    @Override
    public void submitSupportRequest(String userId, SupportRequest request) {
        findUserById(userId); // verify user exists
        log.info("Support request submitted | user: {} | subject: {}", userId, request.getSubject());
    }

    // ── helpers ──────────────────────────────────────────────────

    private User findOrCreateUser(String userId, String email) {
        return userRepository.findById(userId)
                .orElseGet(() -> {
                    log.info("User {} not found in userdb, auto-provisioning record...", userId);
                    String fallbackEmail = (email != null && !email.isBlank())
                            ? email
                            : "user-" + (userId != null && userId.length() >= 8 ? userId.substring(0, 8) : userId) + "@local.com";
                    User newUser = User.builder()
                            .id(userId)
                            .email(fallbackEmail)
                            .firstName("")
                            .lastName("")
                            .phoneNumber("")
                            .street("")
                            .city("")
                            .country("")
                            .zipCode("")
                            .blocked(false)
                            .createdAt(java.time.LocalDateTime.now())
                            .build();
                    return userRepository.save(newUser);
                });
    }

    private User findUserById(String userId) {
        return findOrCreateUser(userId, null);
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .photoUrl(user.getPhotoUrl())
                .street(user.getStreet())
                .city(user.getCity())
                .country(user.getCountry())
                .zipCode(user.getZipCode())
                .build();
    }

    private AddressResponse mapToAddressResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .recipientName(address.getRecipientName())
                .build();
    }
}
