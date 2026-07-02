package com.eduflow.modules.coupon;

import com.eduflow.modules.coupon.dto.CouponValidationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    /**
     * Validate a coupon code. Returns discount breakdown without applying it.
     * GET /api/coupons/validate?code=SUMMER50&subtotal=1499.00&courseId=5
     */
    @GetMapping("/validate")
    public ResponseEntity<CouponValidationResponse> validateCoupon(
            @RequestParam String code,
            @RequestParam(defaultValue = "0") BigDecimal subtotal,
            @RequestParam(required = false) Long courseId) {

        CouponValidationResponse response = couponService.validateCoupon(code, subtotal, courseId);
        return ResponseEntity.ok(response);
    }
}
