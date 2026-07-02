package com.eduflow.modules.course;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/questions")
public class PracticeQuestionController {

    private final PracticeQuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public PracticeQuestionController(PracticeQuestionRepository questionRepository,
                                      CourseRepository courseRepository,
                                      UserRepository userRepository) {
        this.questionRepository = questionRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    // Get all questions (public/student access)
    @GetMapping
    public ResponseEntity<List<PracticeQuestion>> getQuestions(@PathVariable("courseId") Long courseId) {
        // Just verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found: " + courseId);
        }
        return ResponseEntity.ok(questionRepository.findByCourseId(courseId));
    }

    // Add a new question (instructor only)
    @PostMapping
    public ResponseEntity<PracticeQuestion> addQuestion(
            @PathVariable("courseId") Long courseId,
            @RequestBody PracticeQuestion question,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Course course = getVerifiedCourse(courseId, userPrincipal);
        question.setCourseId(course.getId());
        return new ResponseEntity<>(questionRepository.save(question), HttpStatus.CREATED);
    }

    // Update a question (instructor only)
    @PutMapping("/{questionId}")
    public ResponseEntity<PracticeQuestion> updateQuestion(
            @PathVariable("courseId") Long courseId,
            @PathVariable("questionId") Long questionId,
            @RequestBody PracticeQuestion updatedQuestion,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Course course = getVerifiedCourse(courseId, userPrincipal);
        PracticeQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        if (!question.getCourseId().equals(course.getId())) {
            throw new IllegalArgumentException("Question does not belong to this course");
        }

        question.setQuestionText(updatedQuestion.getQuestionText());
        question.setOptionA(updatedQuestion.getOptionA());
        question.setOptionB(updatedQuestion.getOptionB());
        question.setOptionC(updatedQuestion.getOptionC());
        question.setOptionD(updatedQuestion.getOptionD());
        question.setCorrectOption(updatedQuestion.getCorrectOption());
        question.setExplanation(updatedQuestion.getExplanation());

        return ResponseEntity.ok(questionRepository.save(question));
    }

    // Delete a question (instructor only)
    @DeleteMapping("/{questionId}")
    public ResponseEntity<?> deleteQuestion(
            @PathVariable("courseId") Long courseId,
            @PathVariable("questionId") Long questionId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Course course = getVerifiedCourse(courseId, userPrincipal);
        PracticeQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + questionId));

        if (!question.getCourseId().equals(course.getId())) {
            throw new IllegalArgumentException("Question does not belong to this course");
        }

        questionRepository.delete(question);
        return ResponseEntity.ok().build();
    }

    // Helper method to verify course ownership
    private Course getVerifiedCourse(Long courseId, UserPrincipal userPrincipal) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userPrincipal.getId()));

        // Verify the user is the instructor of this course
        if (!course.getInstructor().getId().equals(user.getId())) {
            throw new AccessDeniedException("Not your course");
        }

        return course;
    }
}
