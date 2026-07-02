package com.eduflow.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private UserDetailsDto user;

    @Data
    @AllArgsConstructor
    public static class UserDetailsDto {
        private Long id;
        private String name;
        private String email;
        private String role;
        private String avatarUrl;
    }
}
