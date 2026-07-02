package com.eduflow.modules.discussion.dto;

import lombok.Data;

@Data
public class CreateReplyRequest {
    private Long threadId;
    private String content;
}
