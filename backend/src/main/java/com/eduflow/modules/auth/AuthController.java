package com.eduflow.modules.auth;

import com.eduflow.modules.auth.dto.LoginRequest;
import com.eduflow.modules.auth.dto.RegisterRequest;
import com.eduflow.modules.auth.dto.TokenResponse;
import com.eduflow.modules.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User registeredUser = authService.register(registerRequest);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User registered successfully");
            response.put("userId", registeredUser.getId());
            response.put("email", registeredUser.getEmail());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IllegalArgumentException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("error", ex.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        TokenResponse tokenResponse = authService.login(loginRequest);
        return buildResponseWithCookie(tokenResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<TokenResponse> authenticateGoogleUser(@RequestBody Map<String, String> body) {
        String idToken = body.get("token");
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Google ID Token is missing");
        }
        TokenResponse tokenResponse = authService.loginWithGoogle(idToken);
        return buildResponseWithCookie(tokenResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refreshUserSession(
            @CookieValue(name = "eduflow_refresh_token", required = false) String refreshToken) {
            
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        TokenResponse tokenResponse = authService.rotateToken(refreshToken);
        return buildResponseWithCookie(tokenResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        // Build empty cookie with Max-Age 0 to immediately prune from browser storage
        ResponseCookie cookie = ResponseCookie.from("eduflow_refresh_token", "")
                .httpOnly(true)
                .secure(true) // require HTTPS in production
                .path("/")
                .maxAge(0) // immediately delete
                .sameSite("Strict")
                .build();
                
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    private ResponseEntity<TokenResponse> buildResponseWithCookie(TokenResponse tokenResponse) {
        // Save refresh token as an httpOnly, SameSite cookie
        ResponseCookie cookie = ResponseCookie.from("eduflow_refresh_token", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(604800) // 7 days in seconds
                .sameSite("Strict")
                .build();
                
        // Prune refresh token from JSON payload to minimize XSS exposure
        tokenResponse.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(tokenResponse);
    }
}
