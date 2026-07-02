package com.eduflow.modules.cart;

import com.eduflow.exception.CartConflictException;
import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.modules.enrollment.EnrollmentRepository;
import com.eduflow.modules.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CartService(CartRepository cartRepository, CourseRepository courseRepository,
                       EnrollmentRepository enrollmentRepository) {
        this.cartRepository = cartRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional(readOnly = true)
    public List<CartItem> getCartItems(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    @Transactional
    public CartItem addToCart(Long userId, Long courseId, User user) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        // Validation 1: Already in Cart
        if (cartRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new CartConflictException("Course is already in your shopping cart.");
        }

        // Validation 2: Already Enrolled
        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new CartConflictException("You have already purchased and enrolled in this course.");
        }

        CartItem item = CartItem.builder()
                .user(user)
                .course(course)
                .build();

        return cartRepository.save(item);
    }

    @Transactional
    public void removeFromCart(Long userId, Long courseId) {
        CartItem item = cartRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course is not in your cart"));
        cartRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }
}
