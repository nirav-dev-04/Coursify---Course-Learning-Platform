package com.eduflow.modules.course;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@Slf4j
public class VideoUploadController {

    private final S3Presigner s3Presigner;
    private final CourseRepository courseRepository;
    
    @Value("${aws.s3.bucket-name:eduflow-bucket}")
    private String bucketName;

    public VideoUploadController(S3Presigner s3Presigner, CourseRepository courseRepository) {
        this.s3Presigner = s3Presigner;
        this.courseRepository = courseRepository;
    }

    @PostMapping("/{courseId}/video-presigned-url")
    public ResponseEntity<?> getPreSignedUploadUrl(
            @PathVariable("courseId") Long courseId,
            @RequestParam("fileName") String fileName,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Generating pre-signed URL for Course: {}, User: {}", courseId, userPrincipal.getId());

        // Validate course existence and instructor ownership
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        if (!course.getInstructor().getId().equals(userPrincipal.getId())) {
            log.warn("Unauthorized attempt by User: {} to upload video to Course: {} (owned by Instructor: {})",
                    userPrincipal.getId(), courseId, course.getInstructor().getId());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Access Denied: You are not authorized to upload videos to this course.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        // Construct a unique key: courses/{courseId}/raw-videos/{uuid}-{fileName}
        String uniqueId = UUID.randomUUID().toString();
        String s3Key = String.format("courses/%d/raw-videos/%s-%s", courseId, uniqueId, fileName);

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("video/mp4")
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15)) // URL is valid for 15 minutes
                    .putObjectRequest(putObjectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            String uploadUrl = presignedRequest.url().toString();

            Map<String, String> response = new HashMap<>();
            response.put("uploadUrl", uploadUrl);
            response.put("s3Key", s3Key);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate S3 pre-signed upload URL", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Could not generate pre-signed upload URL: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
