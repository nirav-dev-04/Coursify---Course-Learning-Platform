package com.eduflow.modules.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PracticeTestAttemptRepository extends JpaRepository<PracticeTestAttempt, Long> {
    List<PracticeTestAttempt> findByUserIdAndCourseIdOrderByAttemptedAtDesc(Long userId, Long courseId);
    
    // Find the latest attempt
    Optional<PracticeTestAttempt> findFirstByUserIdAndCourseIdOrderByAttemptedAtDesc(Long userId, Long courseId);
    
    // Check if there is any passing attempt
    boolean existsByUserIdAndCourseIdAndPassedTrue(Long userId, Long courseId);
}
