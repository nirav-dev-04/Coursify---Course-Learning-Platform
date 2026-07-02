package com.eduflow.modules.user.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String headline;
    private String biography;
    private String language;
    private String websiteUrl;
    private String facebookUrl;
    private String instagramUrl;
    private String avatarUrl;
}
