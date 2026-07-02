package com.eduflow.modules.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@Slf4j
public class WebhookController {

    private final OrderService orderService;

    public WebhookController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signatureHeader) {
            
        log.info("Received Razorpay Webhook notification. Validating payload...");
        
        try {
            orderService.processWebhookPayment(payload, signatureHeader);
            log.info("Webhook processed successfully. Student enrolled.");
            return ResponseEntity.ok().build(); // Return 200 OK
        } catch (Exception e) {
            log.error("Failed to process Razorpay webhook callback", e);
            // Even in failure, we return 200 OK or 400. Razorpay webhook guidelines state 
            // returning a non-2xx code triggers retries which we want to avoid for invalid/old events.
            return ResponseEntity.badRequest().body("Webhook processing error: " + e.getMessage());
        }
    }
}
