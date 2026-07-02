package com.eduflow.modules.user;

import com.eduflow.modules.payment.Order;
import com.eduflow.modules.payment.OrderRepository;
import com.eduflow.modules.user.dto.SecurityUpdateRequest;
import com.eduflow.modules.user.dto.UserProfileUpdateRequest;
import com.eduflow.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import com.eduflow.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, OrderRepository orderRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        if (request.getFirstName() != null && request.getLastName() != null) {
            user.setName(request.getFirstName().trim() + " " + request.getLastName().trim());
        } else if (request.getFirstName() != null) {
            user.setName(request.getFirstName().trim());
        }

        if (request.getHeadline() != null) {
            user.setHeadline(request.getHeadline());
        }
        if (request.getBiography() != null) {
            user.setBiography(request.getBiography());
        }
        if (request.getLanguage() != null) {
            user.setLanguage(request.getLanguage());
        }
        if (request.getWebsiteUrl() != null) {
            user.setWebsiteUrl(request.getWebsiteUrl());
        }
        if (request.getFacebookUrl() != null) {
            user.setFacebookUrl(request.getFacebookUrl());
        }
        if (request.getInstagramUrl() != null) {
            user.setInstagramUrl(request.getInstagramUrl());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);

        return ResponseEntity.ok(user);
    }

    @PutMapping("/me/security")
    public ResponseEntity<?> updateMySecurity(
            @Valid @RequestBody SecurityUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        // Update email if requested and different
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Email is already in use by another account.");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
            user.setEmail(request.getEmail().trim());
        }

        // Update password if requested
        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Current password is required to change password.");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Current password does not match.");
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Security settings updated successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/payment-methods")
    public ResponseEntity<?> getPaymentMethods(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Order> orders = orderRepository.findByUserIdAndStatus(userPrincipal.getId(), "SUCCESS");
        
        List<Map<String, String>> methods = orders.stream()
                .filter(o -> o.getPaymentMethod() != null)
                .map(o -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("method", o.getPaymentMethod());
                    m.put("details", o.getPaymentDetails() != null ? o.getPaymentDetails() : "");
                    m.put("date", o.getUpdatedAt().toString());
                    return m;
                })
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(methods);
    }

    @GetMapping("/me/subscriptions")
    public ResponseEntity<?> getSubscriptions(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Order> orders = orderRepository.findByUserIdAndStatus(userPrincipal.getId(), "SUCCESS");
        
        Optional<Order> subOrderOpt = orders.stream()
                .filter(o -> o.getTotalAmount() != null && 
                        (o.getTotalAmount().compareTo(new BigDecimal("780.00")) == 0 || 
                         o.getTotalAmount().compareTo(new BigDecimal("6000.00")) == 0))
                .findFirst();

        Map<String, Object> response = new HashMap<>();
        if (subOrderOpt.isPresent()) {
            Order subOrder = subOrderOpt.get();
            response.put("active", true);
            response.put("plan", subOrder.getTotalAmount().compareTo(new BigDecimal("6000.00")) == 0 ? "Yearly Personal Plan" : "Monthly Personal Plan");
            response.put("amount", subOrder.getTotalAmount());
            response.put("startDate", subOrder.getUpdatedAt());
            response.put("status", "ACTIVE");
        } else {
            response.put("active", false);
            response.put("status", "NONE");
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/become-instructor")
    public ResponseEntity<?> becomeInstructor(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if ("INSTRUCTOR".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "User is already an instructor"));
        }

        user.setRole("INSTRUCTOR");
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Role updated to INSTRUCTOR", "role", "INSTRUCTOR"));
    }
}
