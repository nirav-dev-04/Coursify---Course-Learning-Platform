package com.eduflow.modules.payment;

import com.eduflow.exception.PaymentException;
import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.cart.CartItem;
import com.eduflow.modules.cart.CartService;
import com.eduflow.modules.coupon.CouponService;
import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.modules.enrollment.Enrollment;
import com.eduflow.modules.enrollment.EnrollmentRepository;
import com.eduflow.modules.payment.dto.CheckoutRequest;
import com.eduflow.modules.payment.dto.OrderResponse;
import com.eduflow.modules.user.User;
import com.razorpay.RazorpayClient;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SignatureException;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final EnrollmentRepository enrollmentRepository;
    private final RazorpayClient razorpayClient;
    private final CourseRepository courseRepository;
    private final CouponService couponService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:mock_webhook_secret}")
    private String webhookSecret;

    public OrderService(OrderRepository orderRepository, CartService cartService,
                        EnrollmentRepository enrollmentRepository, RazorpayClient razorpayClient,
                        CourseRepository courseRepository, CouponService couponService) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.enrollmentRepository = enrollmentRepository;
        this.razorpayClient = razorpayClient;
        this.courseRepository = courseRepository;
        this.couponService = couponService;
    }

    @Transactional
    public OrderResponse createCheckoutOrder(CheckoutRequest request, User user) {
        String key = request.getIdempotencyKey();

        // 1. Idempotency Check
        Optional<Order> existingOrderOpt = orderRepository.findByIdempotencyKey(key);
        if (existingOrderOpt.isPresent()) {
            Order existingOrder = existingOrderOpt.get();
            log.info("Idempotency match: Found existing order {} with status {}", existingOrder.getId(), existingOrder.getStatus());
            
            return OrderResponse.builder()
                    .orderId(existingOrder.getId())
                    .razorpayOrderId(existingOrder.getRazorpayOrderId())
                    .amount(existingOrder.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue())
                    .currency("INR")
                    .status(existingOrder.getStatus())
                    .razorpayKeyId(keyId)
                    .build();
        }

        // 2. Fetch User Cart Items or use subscription parameters
        BigDecimal total;
        String courseIdsStr;
        
        if (request.getIsSubscription() != null && request.getIsSubscription()) {
            if (request.getCourseId() == null) {
                throw new PaymentException("Cannot execute subscription checkout: course ID is required.");
            }
            if ("monthly".equalsIgnoreCase(request.getSubscriptionPeriod())) {
                total = new BigDecimal("780.00");
            } else {
                total = new BigDecimal("6000.00");
            }
            courseIdsStr = String.valueOf(request.getCourseId());
        } else if (request.getIsGift() != null && request.getIsGift()) {
            if (request.getCourseId() == null) {
                throw new PaymentException("Cannot execute gift checkout: course ID is required.");
            }
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));
            total = course.getPrice();
            courseIdsStr = String.valueOf(request.getCourseId());
        } else {
            List<CartItem> cartItems = cartService.getCartItems(user.getId());
            if (cartItems.isEmpty()) {
                throw new PaymentException("Cannot execute checkout: Your shopping cart is empty.");
            }
            total = cartItems.stream()
                    .map(item -> item.getCourse().getPrice())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            courseIdsStr = cartItems.stream()
                    .map(item -> String.valueOf(item.getCourse().getId()))
                    .collect(java.util.stream.Collectors.joining(","));
        }

        // 4. Apply coupon discount if present
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCoupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            discountAmount = couponService.applyCouponAndGetDiscount(
                    request.getCouponCode(), total, request.getCourseId());
            if (discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                appliedCoupon = request.getCouponCode().trim().toUpperCase();
                log.info("Coupon {} applied: ₹{} discount on ₹{} subtotal", appliedCoupon, discountAmount, total);
                total = total.subtract(discountAmount).max(BigDecimal.ZERO);
            }
        }

        // 5. Create local Pending Order
        String pm = request.getPaymentMethod();
        if (pm == null || pm.trim().isEmpty()) {
            pm = "UPI";
        }
        String pd = request.getPaymentDetails();
        if (pd == null || pd.trim().isEmpty()) {
            pd = "card".equalsIgnoreCase(pm) ? "Visa **** 4111" : "upi@oksbi";
        }

        Order order = Order.builder()
                .user(user)
                .idempotencyKey(key)
                .totalAmount(total)
                .courseIds(courseIdsStr)
                .status("PENDING")
                .paymentMethod(pm.toUpperCase())
                .paymentDetails(pd)
                .isGift(request.getIsGift() != null && request.getIsGift())
                .recipientName(request.getRecipientName())
                .recipientEmail(request.getRecipientEmail())
                .deliveryDate(request.getDeliveryDate())
                .giftMessage(request.getGiftMessage())
                .couponCode(appliedCoupon)
                .discountAmount(discountAmount)
                .build();
        order = orderRepository.save(order);

        // 6. Create remote order via Razorpay Client
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", total.multiply(BigDecimal.valueOf(100)).longValue()); // Razorpay expects paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_rcpt_" + order.getId());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            // Update local order with Razorpay Order ID
            order.setRazorpayOrderId(razorpayOrderId);
            orderRepository.save(order);

            log.info("Successfully generated Razorpay order {} for local order {}", razorpayOrderId, order.getId());

            return OrderResponse.builder()
                    .orderId(order.getId())
                    .razorpayOrderId(razorpayOrderId)
                    .amount(total.multiply(BigDecimal.valueOf(100)).longValue())
                    .currency("INR")
                    .status(order.getStatus())
                    .razorpayKeyId(keyId)
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Razorpay checkout order", e);
            order.setStatus("FAILED");
            orderRepository.save(order);
            throw new PaymentException("Razorpay checkout order generation failed: " + e.getMessage());
        }
    }

    @Transactional
    public void verifyAndEnroll(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        log.info("Verifying payment signature for Order: {}, Payment: {}", razorpayOrderId, razorpayPaymentId);

        // Verify Razorpay signature
        String data = razorpayOrderId + "|" + razorpayPaymentId;
        boolean isValid = false;
        try {
            isValid = calculateHmacSha256(data, keySecret).equals(razorpaySignature);
        } catch (Exception e) {
            log.error("Failed to calculate HMAC signature", e);
        }

        if (!isValid) {
            throw new PaymentException("Payment verification failed: Invalid transaction signature.");
        }

        // Lock and load the order
        Order order = orderRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("No order matching Razorpay Order ID: " + razorpayOrderId));

        processSuccessfulOrder(order);
    }

    @Transactional
    public void processWebhookPayment(String payload, String signatureHeader) {
        log.info("Processing Razorpay webhook callback...");

        boolean isValid = false;
        try {
            isValid = calculateHmacSha256(payload, webhookSecret).equals(signatureHeader);
        } catch (Exception e) {
            log.error("Failed to verify webhook signature", e);
        }

        if (!isValid) {
            throw new PaymentException("Invalid webhook signature. Request rejected.");
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.optString("event");

        if ("order.paid".equals(eventType)) {
            JSONObject paymentEntity = event.getJSONObject("payload")
                    .getJSONObject("order")
                    .getJSONObject("entity");

            String razorpayOrderId = paymentEntity.getString("id");

            // Load and lock the local order record
            Order order = orderRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseThrow(() -> new ResourceNotFoundException("No local order mapped to Razorpay ID: " + razorpayOrderId));

            processSuccessfulOrder(order);
        }
    }

    private void processSuccessfulOrder(Order order) {
        if ("SUCCESS".equals(order.getStatus())) {
            log.info("Order {} already completed. Skipping duplicate processing.", order.getId());
            return; // Already processed by concurrent thread / redirect redirect
        }

        log.info("Setting Order {} status to SUCCESS. Registering student enrollments...", order.getId());
        order.setStatus("SUCCESS");
        orderRepository.save(order);

        // Enroll based on snapshotted course IDs in the order
        if (order.getIsGift() != null && order.getIsGift()) {
            log.info("Order {} is a gift order for {}. Skipping purchaser enrollment.", order.getId(), order.getRecipientEmail());
        } else if (order.getCourseIds() != null && !order.getCourseIds().trim().isEmpty()) {
            String[] courseIdArray = order.getCourseIds().split(",");
            for (String courseIdStr : courseIdArray) {
                Long courseId = Long.valueOf(courseIdStr);
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

                // Check if enrollment already exists to prevent duplicate key violations
                if (!enrollmentRepository.existsByUserIdAndCourseId(order.getUser().getId(), courseId)) {
                    Enrollment enrollment = Enrollment.builder()
                            .user(order.getUser())
                            .course(course)
                            .paidAmount(course.getPrice())
                            .build();
                    enrollmentRepository.save(enrollment);
                }
            }
        } else {
            // Fallback for pre-existing orders without courseIds snapshots
            List<CartItem> cartItems = cartService.getCartItems(order.getUser().getId());
            for (CartItem item : cartItems) {
                if (!enrollmentRepository.existsByUserIdAndCourseId(order.getUser().getId(), item.getCourse().getId())) {
                    Enrollment enrollment = Enrollment.builder()
                            .user(order.getUser())
                            .course(item.getCourse())
                            .paidAmount(item.getCourse().getPrice())
                            .build();
                    enrollmentRepository.save(enrollment);
                }
            }
        }

        // Clear user cart only if this is not a subscription checkout
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(new BigDecimal("350.00")) != 0) {
            cartService.clearCart(order.getUser().getId());
            log.info("Cart cleared and enrollments finalized for User {}", order.getUser().getId());
        } else {
            log.info("Subscription order finalized for User {}. Cart kept intact.", order.getUser().getId());
        }
    }

    private String calculateHmacSha256(String data, String key) throws java.security.SignatureException {
        try {
            SecretKeySpec signingKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(rawHmac);
        } catch (Exception e) {
            throw new SignatureException("Failed to generate HMAC : " + e.getMessage());
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
