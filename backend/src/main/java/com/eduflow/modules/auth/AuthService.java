package com.eduflow.modules.auth;

import com.eduflow.modules.auth.dto.LoginRequest;
import com.eduflow.modules.auth.dto.RegisterRequest;
import com.eduflow.modules.auth.dto.TokenResponse;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.JwtTokenProvider;
import com.eduflow.security.UserPrincipal;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${google.client-id:mock-client-id}")
    private String googleClientId;

    public AuthService(AuthenticationManager authenticationManager, UserRepository userRepository,
                       PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email address is already in use.");
        }

        String role = request.getRole().toUpperCase();
        if (!role.equals("STUDENT") && !role.equals("INSTRUCTOR")) {
            throw new IllegalArgumentException("Invalid registration role. Must be STUDENT or INSTRUCTOR.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        return userRepository.save(user);
    }

    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        TokenResponse.UserDetailsDto userDetailsDto = new TokenResponse.UserDetailsDto(
                userPrincipal.getId(),
                userPrincipal.getName(),
                userPrincipal.getEmail(),
                userPrincipal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""),
                userPrincipal.getAvatarUrl()
        );

        return TokenResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken)
                .user(userDetailsDto)
                .build();
    }

    @Transactional
    public TokenResponse loginWithGoogle(String idToken) {
        log.info("Verifying Google ID token...");
        
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idTokenObj = verifier.verify(idToken);
            if (idTokenObj == null) {
                log.error("Google ID Token verification failed: Verifier returned null");
                throw new IllegalArgumentException("Google authentication failed: Invalid ID token.");
            }

            Payload payload = idTokenObj.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            log.info("Google Token verified successfully for email: {}", email);

            // Find or register user
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        log.info("Registering new Google User: {}", email);
                        User newUser = User.builder()
                                .name(name != null ? name : email.split("@")[0])
                                .email(email)
                                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Random password
                                .role("STUDENT") // Default role
                                .build();
                        return userRepository.save(newUser);
                    });

            UserPrincipal principal = UserPrincipal.create(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities()
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            TokenResponse.UserDetailsDto userDetailsDto = new TokenResponse.UserDetailsDto(
                    principal.getId(),
                    principal.getName(),
                    principal.getEmail(),
                    principal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""),
                    principal.getAvatarUrl()
            );

            return TokenResponse.builder()
                    .accessToken(jwt)
                    .refreshToken(refreshToken)
                    .user(userDetailsDto)
                    .build();

        } catch (Exception e) {
            log.error("Failed Google Login", e);
            throw new IllegalArgumentException("Google authentication verification failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public TokenResponse rotateToken(String refreshToken) {
        log.info("Rotating access token using refresh token...");
        
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Session expired. Please log in again.");
        }

        String email = tokenProvider.getUsernameFromJWT(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found matching refresh token"));

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );

        String newJwt = tokenProvider.generateToken(authentication);
        String newRefreshToken = tokenProvider.generateRefreshToken(authentication);

        TokenResponse.UserDetailsDto userDetailsDto = new TokenResponse.UserDetailsDto(
                principal.getId(),
                principal.getName(),
                principal.getEmail(),
                principal.getAuthorities().iterator().next().getAuthority().replace("ROLE_", ""),
                principal.getAvatarUrl()
        );

        return TokenResponse.builder()
                .accessToken(newJwt)
                .refreshToken(newRefreshToken)
                .user(userDetailsDto)
                .build();
    }
}
