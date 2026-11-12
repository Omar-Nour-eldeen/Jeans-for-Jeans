package com.commerce.auth_service.interfaces;


public interface IEmailService {
    void sendPasswordResetEmail(String toEmail, String rawToken);
    void sendEmailVerificationEmail(String toEmail, String rawToken);
}
