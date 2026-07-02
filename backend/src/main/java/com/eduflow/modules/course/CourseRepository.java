package com.eduflow.modules.course;

import com.eduflow.modules.course.dto.CourseListDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    // Optimized projection query to load course listings without N+1 select loops
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' " +
           "GROUP BY c.id, u.name")
    List<CourseListDTO> findAllProjected();

    // Native SQL query mapping PostgreSQL Full-Text Search and rating averages to the DTO projection
    @Query(value = "SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
                   "c.price AS price, c.status AS status, u.name AS instructorName, " +
                   "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
                   "FROM courses c " +
                   "JOIN users u ON c.instructor_id = u.id " +
                   "LEFT JOIN reviews r ON c.id = r.course_id " +
                   "WHERE c.status = 'PUBLISHED' " +
                   "AND (c.search_vector @@ to_tsquery('english', :tsQuery) " +
                   "     OR LOWER(c.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                   "     OR LOWER(c.category) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
                   "     OR LOWER(u.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
                   ") " +
                   "GROUP BY c.id, u.name", 
           nativeQuery = true)
    List<CourseListDTO> searchCoursesProjected(
            @Param("searchTerm") String searchTerm,
            @Param("tsQuery") String tsQuery);
    
    // Category filter query
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' AND c.category = :category " +
           "GROUP BY c.id, u.name")
    List<CourseListDTO> findByCategoryProjected(@Param("category") String category);

    // Optimized dynamic filter query supporting limit and exclude course
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' " +
           "AND (:category IS NULL OR c.category = :category) " +
           "AND (:exclude IS NULL OR c.id <> :exclude) " +
           "GROUP BY c.id, u.name")
    List<CourseListDTO> findCoursesFiltered(
            @Param("category") String category,
            @Param("exclude") Long exclude,
            org.springframework.data.domain.Pageable pageable);

    // Trending sorting query (ordered by enrollment count)
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' " +
           "AND (:category IS NULL OR c.category = :category) " +
           "AND (:exclude IS NULL OR c.id <> :exclude) " +
           "GROUP BY c.id, u.name " +
           "ORDER BY (SELECT COUNT(e) FROM Enrollment e WHERE e.course = c) DESC, c.id DESC")
    List<CourseListDTO> findCoursesFilteredTrending(
            @Param("category") String category,
            @Param("exclude") Long exclude,
            org.springframework.data.domain.Pageable pageable);

    // Newest sorting query (ordered by creation timestamp)
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' " +
           "AND (:category IS NULL OR c.category = :category) " +
           "AND (:exclude IS NULL OR c.id <> :exclude) " +
           "GROUP BY c.id, u.name " +
           "ORDER BY c.createdAt DESC, c.id DESC")
    List<CourseListDTO> findCoursesFilteredNewest(
            @Param("category") String category,
            @Param("exclude") Long exclude,
            org.springframework.data.domain.Pageable pageable);

    // Top Rated sorting query (ordered by average rating)
    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.status = 'PUBLISHED' " +
           "AND (:category IS NULL OR c.category = :category) " +
           "AND (:exclude IS NULL OR c.id <> :exclude) " +
           "GROUP BY c.id, u.name " +
           "ORDER BY COALESCE(AVG(r.rating), 0.0) DESC, c.id DESC")
    List<CourseListDTO> findCoursesFilteredTopRated(
            @Param("category") String category,
            @Param("exclude") Long exclude,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT c.id AS id, c.title AS title, c.slug AS slug, c.category AS category, " +
           "c.price AS price, c.status AS status, u.name AS instructorName, " +
           "COALESCE(AVG(r.rating), 0.0) AS avgRating " +
           "FROM Course c " +
           "JOIN c.instructor u " +
           "LEFT JOIN Review r ON r.courseId = c.id " +
           "WHERE c.instructor.id = :instructorId " +
           "GROUP BY c.id, u.name " +
           "ORDER BY c.createdAt DESC")
    List<CourseListDTO> findByInstructorIdProjected(@Param("instructorId") Long instructorId);
}
