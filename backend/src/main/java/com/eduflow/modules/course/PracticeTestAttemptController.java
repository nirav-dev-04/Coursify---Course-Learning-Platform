package com.eduflow.modules.course;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.enrollment.Enrollment;
import com.eduflow.modules.enrollment.EnrollmentRepository;
import com.eduflow.security.UserPrincipal;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses/{courseId}/attempts")
public class PracticeTestAttemptController {

    private final PracticeTestAttemptRepository attemptRepository;
    private final PracticeQuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public PracticeTestAttemptController(PracticeTestAttemptRepository attemptRepository,
                                         PracticeQuestionRepository questionRepository,
                                         CourseRepository courseRepository,
                                         EnrollmentRepository enrollmentRepository) {
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    // Get latest attempt for a course
    @GetMapping("/latest")
    public ResponseEntity<PracticeTestAttempt> getLatestAttempt(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        return ResponseEntity.ok(attemptRepository
                .findFirstByUserIdAndCourseIdOrderByAttemptedAtDesc(userPrincipal.getId(), courseId)
                .orElse(null));
    }

    // Submit practice test answers
    @PostMapping
    public ResponseEntity<?> submitAttempt(
            @PathVariable("courseId") Long courseId,
            @RequestBody List<AnswerSubmission> submissions,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        // Verify the student is enrolled in this course
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userPrincipal.getId(), courseId)
                .orElseThrow(() -> new IllegalArgumentException("You must be enrolled in this course to take the test"));

        List<PracticeQuestion> questions = questionRepository.findByCourseId(courseId);
        if (questions.isEmpty()) {
            throw new IllegalArgumentException("This practice test has no questions yet");
        }

        // Map submissions for easy lookup
        Map<Long, String> answersMap = new HashMap<>();
        for (AnswerSubmission sub : submissions) {
            answersMap.put(sub.getQuestionId(), sub.getSelectedOption());
        }

        int correctCount = 0;
        for (PracticeQuestion q : questions) {
            String selected = answersMap.get(q.getId());
            if (selected != null && selected.equalsIgnoreCase(q.getCorrectOption())) {
                correctCount++;
            }
        }

        double scorePercent = ((double) correctCount / questions.size()) * 100.0;
        boolean passed = scorePercent >= 70.0; // 70% is passing threshold

        // Save Attempt
        PracticeTestAttempt attempt = PracticeTestAttempt.builder()
                .userId(userPrincipal.getId())
                .courseId(courseId)
                .score(scorePercent)
                .passed(passed)
                .build();
        attemptRepository.save(attempt);

        // If passed, mark the enrollment as completed
        if (passed && !enrollment.isCompleted()) {
            enrollment.setCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("score", scorePercent);
        response.put("passed", passed);
        response.put("correctCount", correctCount);
        response.put("totalCount", questions.size());

        // Also compile details of which questions were correct/incorrect for review
        return ResponseEntity.ok(response);
    }

    @Data
    public static class AnswerSubmission {
        private Long questionId;
        private String selectedOption; // 'A', 'B', 'C', 'D'
    }
}
