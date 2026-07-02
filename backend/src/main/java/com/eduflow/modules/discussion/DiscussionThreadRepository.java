package com.eduflow.modules.discussion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionThreadRepository extends JpaRepository<DiscussionThread, Long> {

    List<DiscussionThread> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    List<DiscussionThread> findByCourseIdAndLectureIdOrderByCreatedAtDesc(Long courseId, Long lectureId);

    List<DiscussionThread> findByCourseInstructorIdOrderByCreatedAtDesc(Long instructorId);

    List<DiscussionThread> findAllByOrderByCreatedAtDesc();
}
