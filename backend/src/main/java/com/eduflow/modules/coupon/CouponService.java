package com.eduflow.modules.coupon;

import com.eduflow.modules.coupon.dto.CouponValidationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    /**
     * Validate a coupon code against an order subtotal and optional course ID.
     * Returns a response with the discount breakdown if valid.
     */
    public CouponValidationResponse validateCoupon(String code, BigDecimal orderSubtotal, Long courseId) {
        if (code == null || code.trim().isEmpty()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .message("No coupon code provided.")
                    .build();
        }

        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCase(code.trim());
        if (couponOpt.isEmpty()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Invalid coupon code. Please check and try again.")
                    .build();
        }

        Coupon coupon = couponOpt.get();

        // Check expiration
        if (coupon.isExpired()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("This coupon has expired.")
                    .build();
        }

        // Check usage limits
        if (coupon.isExhausted()) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("This coupon has reached its maximum usage limit.")
                    .build();
        }

        // Check course applicability
        if (courseId != null && !coupon.isApplicableToCourse(courseId)) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("This coupon is not applicable to the selected course.")
                    .build();
        }

        // Check minimum order amount
        if (coupon.getMinOrderAmount() != null && orderSubtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return CouponValidationResponse.builder()
                    .valid(false)
                    .code(code)
                    .message("Minimum order amount of ₹" + coupon.getMinOrderAmount().setScale(2) + " required for this coupon.")
                    .build();
        }

        // Calculate discount
        BigDecimal discountAmount;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = orderSubtotal.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = coupon.getValue();
        }

        // Ensure discount doesn't exceed the order subtotal
        if (discountAmount.compareTo(orderSubtotal) > 0) {
            discountAmount = orderSubtotal;
        }

        BigDecimal newTotal = orderSubtotal.subtract(discountAmount).max(BigDecimal.ZERO);

        log.info("Coupon {} validated: {} {} discount = ₹{} off ₹{} => ₹{}",
                code, coupon.getValue(), coupon.getDiscountType(), discountAmount, orderSubtotal, newTotal);

        return CouponValidationResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getValue())
                .discountAmount(discountAmount)
                .newTotal(newTotal)
                .message("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())
                        ? coupon.getValue().stripTrailingZeros().toPlainString() + "% discount applied!"
                        : "₹" + coupon.getValue().setScale(2) + " flat discount applied!")
                .build();
    }

    /**
     * Apply the coupon: increment used_count after a successful order payment.
     */
    @Transactional
    public BigDecimal applyCouponAndGetDiscount(String code, BigDecimal orderSubtotal, Long courseId) {
        if (code == null || code.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        CouponValidationResponse validation = validateCoupon(code, orderSubtotal, courseId);
        if (!validation.isValid()) {
            log.warn("Coupon {} not applied: {}", code, validation.getMessage());
            return BigDecimal.ZERO;
        }

        // Increment usage counter
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim()).orElse(null);
        if (coupon != null) {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
            log.info("Coupon {} usage incremented to {}/{}", code, coupon.getUsedCount(), coupon.getMaxUses());
        }

        return validation.getDiscountAmount();
    }
}
