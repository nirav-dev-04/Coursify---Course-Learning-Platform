package com.eduflow.modules.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureRepository extends JpaRepository<Lecture, Long> {
    List<Lecture> findBySectionIdOrderBySortOrderAsc(Long sectionId);
    void deleteBySectionCourseId(Long courseId);
}
