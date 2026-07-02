package com.eduflow.modules.enrollment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);
    
    // JOIN FETCH query to fetch enrolled courses along with instructor to avoid N+1 queries
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c JOIN FETCH c.instructor WHERE e.user.id = :userId")
    List<Enrollment> findByUserId(@Param("userId") Long userId);
}
