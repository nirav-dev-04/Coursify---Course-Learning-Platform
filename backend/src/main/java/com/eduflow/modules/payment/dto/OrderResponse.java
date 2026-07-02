package com.eduflow.modules.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderResponse {
    private Long orderId;
    private String razorpayOrderId;
    private Long amount; // in paise
    private String currency;
    private String status;
    private String razorpayKeyId;
}
