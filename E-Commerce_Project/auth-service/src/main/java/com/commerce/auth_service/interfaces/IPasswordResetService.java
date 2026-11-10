package com.commerce.auth_service.interfaces;


import com.commerce.auth_service.dto.ResetPasswordRequest;

public interface IPasswordResetService {
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
}
