package com.eduflow;

import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@Profile("dev")
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(CourseRepository courseRepository, UserRepository userRepository, JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        long existingCount = courseRepository.count();
        boolean forceReseed = false; // Force reseed to correct invalid password hashes
        if (existingCount > 50 && !forceReseed) {
            log.info("Database already seeded ({} courses exist). Skipping re-seeding to protect data.", existingCount);
            return;
        }
        log.info("Found only {} courses in DB — loading full CSV catalog...", existingCount);
        log.info("Refreshing database for dev profile: clearing old seeded courses and instructors...");
        
        // Clear existing courses and instructors to allow re-seeding with correct prices and instructors
        courseRepository.deleteAll();
        List<User> existingInstructors = userRepository.findAll().stream()
                .filter(u -> "INSTRUCTOR".equals(u.getRole()))
                .toList();
        userRepository.deleteAll(existingInstructors);

        List<User> existingSeedStudents = userRepository.findAll().stream()
                .filter(u -> (u.getEmail().startsWith("student") && u.getEmail().endsWith("@eduflow.com")) || "seed.student@eduflow.com".equals(u.getEmail()))
                .toList();
        userRepository.deleteAll(existingSeedStudents);

        log.info("Starting database seeding: creating mock instructors...");
        
        // Create multiple mock instructors
        String[] instructorNames = {
            "Jonas Schmedtmann", "Tim Buchalka", "Navin Reddy", "Rahul Shetty Academy", 
            "Angela Yu", "Colt Steele", "Maximilian Schwarzmüller", "Jose Portilla", 
            "Brad Traversy", "Stephen Grider"
        };
        List<User> instructors = new ArrayList<>();
        for (String name : instructorNames) {
            String email = name.toLowerCase().replace(" ", "").replace("ä", "ae") + "@eduflow.com";
            User inst = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .name(name)
                                .email(email)
                                .passwordHash(passwordEncoder.encode("password")) // BCrypt for 'password'
                                .role("INSTRUCTOR")
                                .build();
                        return userRepository.save(newUser);
                    });
            instructors.add(inst);
        }

        // 2. Load and parse the CSV file from resources
        log.info("Loading udemy_courses.csv from classpath...");
        ClassPathResource resource = new ClassPathResource("udemy_courses.csv");
        
        List<Course> coursesToSeed = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            
            String line;
            boolean isHeader = true;
            
            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip the headers row
                }
                
                if (line.trim().isEmpty()) {
                    continue;
                }

                // Robust parsing logic to handle commas in title and description:
                String title = "";
                String slug = "";
                String category = "";
                String description = "";
                String priceStr = "";
                
                String[] knownCategories = {"Software Engineering", "AI & Data Science", "Finance & Trading"};
                int catStartIndex = -1;
                int catEndIndex = -1;
                String matchedCat = null;
                for (String cat : knownCategories) {
                    int idx = line.indexOf("," + cat + ",");
                    if (idx != -1) {
                        matchedCat = cat;
                        catStartIndex = idx + 1;
                        catEndIndex = idx + cat.length() + 1;
                        break;
                    }
                }
                
                if (matchedCat != null) {
                    String beforeCat = line.substring(0, catStartIndex - 1);
                    int slugCommaIdx = beforeCat.lastIndexOf(',');
                    if (slugCommaIdx == -1) continue;
                    
                    title = cleanCsvValue(beforeCat.substring(0, slugCommaIdx));
                    slug = cleanCsvValue(beforeCat.substring(slugCommaIdx + 1));
                    category = matchedCat;
                    
                    String afterCat = line.substring(catEndIndex + 1);
                    int priceCommaIdx = afterCat.lastIndexOf(',');
                    if (priceCommaIdx == -1) continue;
                    
                    description = cleanCsvValue(afterCat.substring(0, priceCommaIdx));
                    priceStr = cleanCsvValue(afterCat.substring(priceCommaIdx + 1));
                } else {
                    int firstComma = line.indexOf(',');
                    if (firstComma == -1) continue;
                    int secondComma = line.indexOf(',', firstComma + 1);
                    if (secondComma == -1) continue;
                    int thirdComma = line.indexOf(',', secondComma + 1);
                    if (thirdComma == -1) continue;
                    int lastComma = line.lastIndexOf(',');
                    if (lastComma == -1 || lastComma <= thirdComma) continue;

                    title = cleanCsvValue(line.substring(0, firstComma));
                    slug = cleanCsvValue(line.substring(firstComma + 1, secondComma));
                    category = cleanCsvValue(line.substring(secondComma + 1, thirdComma));
                    description = cleanCsvValue(line.substring(thirdComma + 1, lastComma));
                    priceStr = cleanCsvValue(line.substring(lastComma + 1));
                }
                
                try {
                    // Convert USD price to realistic INR value by scaling 20x and rounding to 0 decimal places
                    BigDecimal rawPrice = new BigDecimal(priceStr);
                    BigDecimal price = rawPrice.multiply(new BigDecimal("20")).setScale(0, RoundingMode.HALF_UP);
                    
                    // Seed approximately 10% of courses as free dynamically
                    if (Math.abs(title.hashCode()) % 10 == 0) {
                        price = BigDecimal.ZERO;
                    }
                    
                    // Select instructor dynamically based on the title's hash
                    int instIndex = Math.abs(title.hashCode()) % instructors.size();
                    User courseInstructor = instructors.get(instIndex);
                    
                    Course course = Course.builder()
                            .title(title)
                            .slug(slug)
                            .category(category)
                            .description(description)
                            .price(price)
                            .status("PUBLISHED")
                            .instructor(courseInstructor)
                            .createdAt(LocalDateTime.now().minusHours(coursesToSeed.size() * 4))
                            .build();
                    
                    coursesToSeed.add(course);
                } catch (NumberFormatException e) {
                    log.error("Failed to parse price '{}' for line: {}", priceStr, line);
                }
            }
        }

        log.info("Parsed {} courses from CSV. Executing batch save...", coursesToSeed.size());
        
        // 3. Batch save the parsed courses
        List<Course> savedCourses = courseRepository.saveAll(coursesToSeed);
        
        log.info("Seeding mock reviews/ratings to differentiate Top Rated section...");
        User studentUser = userRepository.findByEmail("seed.student@eduflow.com")
                .orElseGet(() -> {
                    User newStudent = User.builder()
                            .name("Seed Student")
                            .email("seed.student@eduflow.com")
                            .passwordHash(passwordEncoder.encode("password")) // 'password'
                            .role("STUDENT")
                            .build();
                    return userRepository.save(newStudent);
                });

        // Seed some active enrollments for seed.student@eduflow.com so "My Learning" is not empty
        for (int i = 0; i < 5; i++) {
            if (i < savedCourses.size()) {
                Course c = savedCourses.get(i);
                jdbcTemplate.update("INSERT INTO enrollments (course_id, user_id, paid_amount, enrolled_at) VALUES (?, ?, 0.00, NOW()) ON CONFLICT DO NOTHING",
                        c.getId(), studentUser.getId());
            }
        }

        for (int i = 0; i < 8; i++) {
            if (10 + i < savedCourses.size()) {
                Course c = savedCourses.get(10 + i);
                double rating = 5.0 - (i * 0.1);
                jdbcTemplate.update("INSERT INTO reviews (course_id, user_id, rating, body, created_at) VALUES (?, ?, ?, ?, NOW())",
                        c.getId(), studentUser.getId(), rating, "Excellent premium course content! Highly recommended.");
            }
        }

        log.info("Seeding mock students and enrollments to differentiate Trending section...");
        List<User> seedStudents = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            final int studentIdx = i;
            String email = "student" + studentIdx + "@eduflow.com";
            User s = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .name("Student " + studentIdx)
                                .email(email)
                                .passwordHash(passwordEncoder.encode("password"))
                                .role("STUDENT")
                                .build();
                        return userRepository.save(newUser);
                    });
            seedStudents.add(s);
        }

        for (int i = 0; i < 8; i++) {
            if (20 + i < savedCourses.size()) {
                Course c = savedCourses.get(20 + i);
                int enrollmentCount = 10 - i;
                for (int k = 0; k < enrollmentCount; k++) {
                    User student = seedStudents.get(k);
                    jdbcTemplate.update("INSERT INTO enrollments (course_id, user_id, paid_amount, enrolled_at) VALUES (?, ?, 0.00, NOW()) ON CONFLICT DO NOTHING",
                            c.getId(), student.getId());
                }
            }
        }

        log.info("Database seeding successfully completed! {} courses initialized with realistic prices and authors.", coursesToSeed.size());
    }

    private String cleanCsvValue(String val) {
        if (val == null) {
            return "";
        }
        val = val.trim();
        // Remove enclosing double quotes if present
        if (val.startsWith("\"") && val.endsWith("\"")) {
            val = val.substring(1, val.length() - 1);
        }
        // Unescape internal double quotes
        return val.replace("\"\"", "\"");
    }
}
