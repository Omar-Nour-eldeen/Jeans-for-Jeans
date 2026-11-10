package com.userservice.userservices.service;

import com.userservice.userservices.dto.request.AddressRequest;
import com.userservice.userservices.dto.request.SupportRequest;
import com.userservice.userservices.dto.request.UpdateProfileRequest;
import com.userservice.userservices.dto.response.AddressResponse;
import com.userservice.userservices.dto.response.UserProfileResponse;
// import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface UserService {
    UserProfileResponse getProfile(String userId);
    UserProfileResponse getProfile(String userId, String email);
    UserProfileResponse updateProfile(String userId, UpdateProfileRequest request);
    // String uploadPhoto(String userId, MultipartFile file);
    AddressResponse addAddress(String userId, AddressRequest request);
    List<AddressResponse> getAddresses(String userId);
    AddressResponse updateAddress(String userId, String addressId, AddressRequest request);
    void deleteAddress(String userId, String addressId);
    void submitSupportRequest(String userId, SupportRequest request);
}
