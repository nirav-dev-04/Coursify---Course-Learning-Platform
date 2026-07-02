package com.eduflow.modules.payment;

import com.eduflow.modules.payment.dto.CheckoutRequest;
import com.eduflow.modules.payment.dto.OrderResponse;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(
            @Valid @RequestBody CheckoutRequest checkoutRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        OrderResponse response = orderService.createCheckoutOrder(checkoutRequest, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestParam("razorpay_order_id") String razorpayOrderId,
            @RequestParam("razorpay_payment_id") String razorpayPaymentId,
            @RequestParam("razorpay_signature") String razorpaySignature) {
            
        orderService.verifyAndEnroll(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Payment verified and student successfully enrolled in courses.");
        return ResponseEntity.ok(response);
    }
}
