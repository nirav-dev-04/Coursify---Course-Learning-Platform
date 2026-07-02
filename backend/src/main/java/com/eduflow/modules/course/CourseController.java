package com.eduflow.modules.course;

import com.eduflow.modules.course.dto.CourseCreateRequest;
import com.eduflow.modules.course.dto.CourseListDTO;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import com.eduflow.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    public CourseController(CourseService courseService, UserRepository userRepository) {
        this.courseService = courseService;
        this.userRepository = userRepository;
    }


    @GetMapping
    public ResponseEntity<List<CourseListDTO>> getCourses(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "exclude", required = false) Long exclude,
            @RequestParam(value = "sort", required = false) String sort,
            org.springframework.web.context.request.WebRequest request) {
            
        List<CourseListDTO> courses;
        if (query != null && !query.trim().isEmpty()) {
            courses = courseService.searchCourses(query);
        } else {
            courses = courseService.getCoursesFiltered(category, limit, exclude, sort);
        }

        String etag = "\"" + Integer.toHexString(courses.hashCode()) + "\"";
        if (request.checkNotModified(etag)) {
            return null; // Automatically returns 304 Not Modified
        }

        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(org.springframework.http.CacheControl.noCache().mustRevalidate())
                .body(courses);
    }

    @GetMapping("/by-id/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<Course> getCourseDetail(@PathVariable("slugOrId") String slugOrId) {
        try {
            Long id = Long.parseLong(slugOrId);
            return ResponseEntity.ok(courseService.getCourseById(id));
        } catch (NumberFormatException e) {
            return ResponseEntity.ok(courseService.getCourseBySlug(slugOrId));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CourseCreateRequest createRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        User instructor = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Instructor profile not found"));
                
        Course createdCourse = courseService.createCourse(createRequest, instructor);
        return new ResponseEntity<>(createdCourse, HttpStatus.CREATED);
    }

    @GetMapping("/instructor/me")
    public ResponseEntity<List<CourseListDTO>> getInstructorCourses(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(courseService.getCoursesByInstructor(userPrincipal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User instructor = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(courseService.updateCourse(id, request, instructor));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateCourseStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User instructor = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(courseService.updateCourseStatus(id, body.get("status"), instructor));
    }

    @GetMapping("/{courseId}/curriculum")
    public ResponseEntity<List<com.eduflow.modules.course.dto.CurriculumSectionDTO>> getCurriculum(
            @PathVariable("courseId") Long courseId) {
        return ResponseEntity.ok(courseService.getCurriculum(courseId));
    }

    @PutMapping("/{courseId}/curriculum")
    public ResponseEntity<List<com.eduflow.modules.course.dto.CurriculumSectionDTO>> saveCurriculum(
            @PathVariable("courseId") Long courseId,
            @RequestBody List<com.eduflow.modules.course.dto.CurriculumSectionDTO> sections,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        User instructor = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found"));
                
        return ResponseEntity.ok(courseService.saveCurriculum(courseId, sections, instructor));
    }
}
