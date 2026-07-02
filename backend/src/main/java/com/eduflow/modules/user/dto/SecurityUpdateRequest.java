package com.eduflow.modules.user.dto;

import lombok.Data;

@Data
public class SecurityUpdateRequest {
    private String email;
    private String currentPassword;
    private String newPassword;
}
