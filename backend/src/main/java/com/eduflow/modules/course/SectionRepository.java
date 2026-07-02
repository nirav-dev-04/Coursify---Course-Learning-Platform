package com.eduflow.modules.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByCourseIdOrderBySortOrderAsc(Long courseId);
    void deleteByCourseId(Long courseId);
}
