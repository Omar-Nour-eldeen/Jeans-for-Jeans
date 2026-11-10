package com.commerce.auth_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.commerce.auth_service.interfaces.IEmailService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImp implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail,
            String rawToken) {
        try {
            String resetLink = frontendUrl
                    + "/reset-password?token="
                    + rawToken;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your Password");
            helper.setText(buildEmailBody(resetLink), true); // true = HTML

            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email. Please try again.");
        }
    }

    private String buildEmailBody(String resetLink) {
        return """
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p>You requested to reset your password.</p>
                    <p>Click the button below to reset it.
                       This link expires in <strong>15 minutes</strong>.</p>
                    <a href="%s"
                       style="display: inline-block;
                              padding: 12px 24px;
                              background-color: #4CAF50;
                              color: white;
                              text-decoration: none;
                              border-radius: 4px;
                              margin: 16px 0;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 12px;">
                        If you didn't request this, ignore this email.
                        Your password won't change.
                    </p>
                    <p style="color: #666; font-size: 12px;">
                        Or copy this link: <br/>
                        <a href="%s">%s</a>
                    </p>
                </body>
                </html>
                """.formatted(resetLink, resetLink, resetLink);
    }
}