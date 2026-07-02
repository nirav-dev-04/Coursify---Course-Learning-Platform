package com.eduflow.modules.cart;

import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(CartService cartService, UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(cartService.getCartItems(userPrincipal.getId()));
    }

    @PostMapping
    public ResponseEntity<?> addToCart(
            @RequestParam("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));
                
        CartItem addedItem = cartService.addToCart(userPrincipal.getId(), courseId, user);
        return new ResponseEntity<>(addedItem, HttpStatus.CREATED);
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        cartService.removeFromCart(userPrincipal.getId(), courseId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Course removed from cart successfully");
        return ResponseEntity.ok(response);
    }
}
