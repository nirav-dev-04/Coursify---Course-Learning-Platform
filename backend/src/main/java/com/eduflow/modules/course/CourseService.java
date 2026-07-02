package com.eduflow.modules.course;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.course.dto.CourseCreateRequest;
import com.eduflow.modules.course.dto.CourseListDTO;
import com.eduflow.modules.user.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;

    public CourseService(CourseRepository courseRepository,
                         SectionRepository sectionRepository,
                         LectureRepository lectureRepository) {
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.lectureRepository = lectureRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseListDTO> getAllCourses() {
        return courseRepository.findAllProjected();
    }

    @Transactional(readOnly = true)
    public List<CourseListDTO> searchCourses(String query) {
        if (query == null || query.trim().isEmpty()) {
            return courseRepository.findAllProjected();
        }
        String cleanQuery = query.trim();
        // Convert to prefix-matching tsquery syntax: "word1:* & word2:*"
        String tsQuery = java.util.Arrays.stream(cleanQuery.split("\\s+"))
                .filter(w -> !w.isEmpty())
                .map(w -> w.replaceAll("[^a-zA-Z0-9]", ""))
                .filter(w -> !w.isEmpty())
                .map(w -> w + ":*")
                .collect(java.util.stream.Collectors.joining(" & "));
        if (tsQuery.isEmpty()) {
            tsQuery = "dummy";
        }
        return courseRepository.searchCoursesProjected(cleanQuery, tsQuery);
    }

    @Transactional(readOnly = true)
    public List<CourseListDTO> getCoursesByCategory(String category) {
        return courseRepository.findByCategoryProjected(category);
    }

    @Transactional(readOnly = true)
    public Course getCourseBySlug(String slug) {
        return courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with slug: " + slug));
    }

    @Transactional(readOnly = true)
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<CourseListDTO> getCoursesFiltered(String category, Integer limit, Long exclude, String sort) {
        org.springframework.data.domain.Pageable pageable = (limit != null && limit > 0)
                ? org.springframework.data.domain.PageRequest.of(0, limit)
                : org.springframework.data.domain.Pageable.unpaged();
                
        if ("trending".equalsIgnoreCase(sort)) {
            return courseRepository.findCoursesFilteredTrending(category, exclude, pageable);
        } else if ("newest".equalsIgnoreCase(sort)) {
            return courseRepository.findCoursesFilteredNewest(category, exclude, pageable);
        } else if ("top-rated".equalsIgnoreCase(sort)) {
            return courseRepository.findCoursesFilteredTopRated(category, exclude, pageable);
        }
        
        return courseRepository.findCoursesFiltered(category, exclude, pageable);
    }

    @Transactional
    public Course createCourse(CourseCreateRequest request, User instructor) {
        String slug = generateSlug(request.getTitle());
        
        Course course = Course.builder()
                .title(request.getTitle())
                .slug(slug)
                .category(request.getCategory())
                .description(request.getDescription())
                .price(request.getPrice())
                .status("DRAFT") // Initially created as Draft
                .type(request.getType() != null ? request.getType() : "COURSE")
                .instructor(instructor)
                .build();
                
        return courseRepository.save(course);
    }

    @Transactional(readOnly = true)
    public List<CourseListDTO> getCoursesByInstructor(Long instructorId) {
        return courseRepository.findByInstructorIdProjected(instructorId);
    }

    @Transactional
    public Course updateCourse(Long id, CourseCreateRequest request, User instructor) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new AccessDeniedException("Not your course");
        }

        course.setTitle(request.getTitle());
        course.setCategory(request.getCategory());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourseStatus(Long id, String status, User instructor) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new AccessDeniedException("Not your course");
        }

        List<String> allowed = List.of("DRAFT", "PUBLISHED");
        if (!allowed.contains(status)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        course.setStatus(status);
        return courseRepository.save(course);
    }

    @Transactional(readOnly = true)
    public List<com.eduflow.modules.course.dto.CurriculumSectionDTO> getCurriculum(Long courseId) {
        List<Section> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        List<com.eduflow.modules.course.dto.CurriculumSectionDTO> dtos = new java.util.ArrayList<>();
        for (Section sec : sections) {
            List<Lecture> lectures = lectureRepository.findBySectionIdOrderBySortOrderAsc(sec.getId());
            List<com.eduflow.modules.course.dto.CurriculumLectureDTO> lectureDTOs = new java.util.ArrayList<>();
            for (Lecture lec : lectures) {
                lectureDTOs.add(com.eduflow.modules.course.dto.CurriculumLectureDTO.builder()
                        .id(String.valueOf(lec.getId()))
                        .title(lec.getTitle())
                        .videoKey(lec.getVideoKey())
                        .durationSec(lec.getDurationSec())
                        .isPreview(lec.getIsPreview())
                        .sortOrder(lec.getSortOrder())
                        .build());
            }
            dtos.add(com.eduflow.modules.course.dto.CurriculumSectionDTO.builder()
                    .id(String.valueOf(sec.getId()))
                    .title(sec.getTitle())
                    .sortOrder(sec.getSortOrder())
                    .lectures(lectureDTOs)
                    .build());
        }
        return dtos;
    }

    @Transactional
    public List<com.eduflow.modules.course.dto.CurriculumSectionDTO> saveCurriculum(
            Long courseId,
            List<com.eduflow.modules.course.dto.CurriculumSectionDTO> incomingSections,
            User instructor) {
            
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        if (!course.getInstructor().getId().equals(instructor.getId())) {
            throw new AccessDeniedException("Not your course");
        }

        // Fetch existing sections & lectures to perform differential update / delete
        List<Section> existingSections = sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId);

        // Keep track of incoming section and lecture IDs that we process
        List<Long> activeSectionIds = new java.util.ArrayList<>();
        List<Long> activeLectureIds = new java.util.ArrayList<>();

        for (int i = 0; i < incomingSections.size(); i++) {
            com.eduflow.modules.course.dto.CurriculumSectionDTO secDto = incomingSections.get(i);
            Section section;
            Long secId = null;
            try {
                secId = Long.parseLong(secDto.getId());
            } catch (NumberFormatException ignored) {}

            if (secId != null) {
                // Find existing
                final Long finalSecId = secId;
                section = existingSections.stream()
                        .filter(s -> s.getId().equals(finalSecId))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Section not found: " + finalSecId));
                section.setTitle(secDto.getTitle());
                section.setSortOrder(secDto.getSortOrder() != null ? secDto.getSortOrder() : i + 1);
                section = sectionRepository.save(section);
            } else {
                // Create new
                section = Section.builder()
                        .course(course)
                        .title(secDto.getTitle())
                        .sortOrder(secDto.getSortOrder() != null ? secDto.getSortOrder() : i + 1)
                        .build();
                section = sectionRepository.save(section);
            }
            activeSectionIds.add(section.getId());

            // Process lectures
            List<com.eduflow.modules.course.dto.CurriculumLectureDTO> incomingLectures = secDto.getLectures();
            if (incomingLectures != null) {
                for (int j = 0; j < incomingLectures.size(); j++) {
                    com.eduflow.modules.course.dto.CurriculumLectureDTO lecDto = incomingLectures.get(j);
                    Lecture lecture;
                    Long lecId = null;
                    try {
                        lecId = Long.parseLong(lecDto.getId());
                    } catch (NumberFormatException ignored) {}

                    if (lecId != null) {
                        final Long finalLecId = lecId;
                        lecture = lectureRepository.findById(finalLecId)
                                .orElseThrow(() -> new ResourceNotFoundException("Lecture not found: " + finalLecId));
                        lecture.setTitle(lecDto.getTitle());
                        lecture.setVideoKey(lecDto.getVideoKey());
                        lecture.setDurationSec(lecDto.getDurationSec() != null ? lecDto.getDurationSec() : 0);
                        lecture.setIsPreview(lecDto.getIsPreview() != null ? lecDto.getIsPreview() : false);
                        lecture.setSortOrder(lecDto.getSortOrder() != null ? lecDto.getSortOrder() : j + 1);
                        lecture.setSection(section);
                        lecture = lectureRepository.save(lecture);
                    } else {
                        lecture = Lecture.builder()
                                .section(section)
                                .title(lecDto.getTitle())
                                .videoKey(lecDto.getVideoKey())
                                .durationSec(lecDto.getDurationSec() != null ? lecDto.getDurationSec() : 0)
                                .isPreview(lecDto.getIsPreview() != null ? lecDto.getIsPreview() : false)
                                .sortOrder(lecDto.getSortOrder() != null ? lecDto.getSortOrder() : j + 1)
                                .build();
                        lecture = lectureRepository.save(lecture);
                    }
                    activeLectureIds.add(lecture.getId());
                }
            }
        }

        // Clean up / delete lectures that are no longer active
        for (Section sec : existingSections) {
            List<Lecture> existingLectures = lectureRepository.findBySectionIdOrderBySortOrderAsc(sec.getId());
            for (Lecture lec : existingLectures) {
                if (!activeLectureIds.contains(lec.getId())) {
                    lectureRepository.delete(lec);
                }
            }
        }

        // Clean up / delete sections that are no longer active
        for (Section sec : existingSections) {
            if (!activeSectionIds.contains(sec.getId())) {
                sectionRepository.delete(sec);
            }
        }

        return getCurriculum(courseId);
    }

    private String generateSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "") // Remove special characters
                .replaceAll("\\s+", "-");       // Replace spaces with dashes
                
        // Suffix with short UUID to ensure uniqueness
        return base + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
