package com.commerce.auth_service.interfaces;

import com.commerce.auth_service.entity.User;

public interface IEmailVerificationService {
    void createVerificationTokenAndSendEmail(User user);
    void verifyEmail(String rawToken);
    void resendVerificationEmail(String email);
}

