// package com.u.service;

// import com.u.exception.FileUploadException;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;
// import software.amazon.awssdk.core.sync.RequestBody;
// import software.amazon.awssdk.services.s3.S3Client;
// import software.amazon.awssdk.services.s3.model.PutObjectRequest;

// import java.io.IOException;
// import java.util.Objects;
// import java.util.UUID;

// @Service
// @RequiredArgsConstructor
// @Slf4j
// public class S3Service {

//     private final S3Client s3Client;

//     @Value("${aws.s3.bucket-name}")
//     private String bucketName;

//     @Value("${aws.s3.region}")
//     private String region;

//     private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB

//     public String uploadFile(MultipartFile file, String userId) {
//         validateFile(file);
//         String key = "profiles/" + userId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
//         try {
//             PutObjectRequest request = PutObjectRequest.builder()
//                     .bucket(bucketName)
//                     .key(key)
//                     .contentType(file.getContentType())
//                     .build();
//             s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
//             String url = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
//             log.info("File uploaded to S3: {}", url);
//             return url;
//         } catch (IOException e) {
//             throw new FileUploadException("Failed to read the uploaded file", e);
//         } catch (Exception e) {
//             throw new FileUploadException("Failed to upload file to S3: " + e.getMessage(), e);
//         }
//     }

//     private void validateFile(MultipartFile file) {
//         if (file == null || file.isEmpty()) {
//             throw new FileUploadException("File cannot be empty");
//         }
//         String contentType = Objects.requireNonNull(file.getContentType(), "Content type must be provided");
//         if (!contentType.startsWith("image/")) {
//             throw new FileUploadException("Only image files are allowed (jpeg, png, webp...)");
//         }
//         if (file.getSize() > MAX_FILE_SIZE) {
//             throw new FileUploadException("File size must not exceed 5MB");
//         }
//     }
// }
