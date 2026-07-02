package com.eduflow.modules.enrollment;

import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public EnrollmentController(EnrollmentRepository enrollmentRepository, CourseRepository courseRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/my-courses")
    public ResponseEntity<List<Enrollment>> getMyEnrolledCourses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userPrincipal.getId());
        return ResponseEntity.ok(enrollments);
    }

    @GetMapping("/check/{courseId}")
    public ResponseEntity<?> checkEnrollmentStatus(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userPrincipal.getId(), courseId);
        
        // If the user is the instructor of the course, grant enrollment access
        if (!isEnrolled) {
            Course course = courseRepository.findById(courseId).orElse(null);
            if (course != null && course.getInstructor() != null && course.getInstructor().getId().equals(userPrincipal.getId())) {
                isEnrolled = true;
            }
        }
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("isEnrolled", isEnrolled);
        return ResponseEntity.ok(response);
    }
}
