package com.eduflow.modules.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationResponse {

    private boolean valid;
    private String code;
    private String discountType;  // 'PERCENTAGE' or 'FIXED_AMOUNT'
    private BigDecimal discountValue;
    private BigDecimal discountAmount; // Calculated discount in currency
    private BigDecimal newTotal;
    private String message;
}
