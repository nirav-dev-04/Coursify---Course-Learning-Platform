package com.eduflow.modules.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LectureProgressRepository extends JpaRepository<LectureProgress, Long> {
    Optional<LectureProgress> findByUserIdAndCourseIdAndLectureId(Long userId, Long courseId, Long lectureId);
    List<LectureProgress> findByUserIdAndCourseId(Long userId, Long courseId);
}
