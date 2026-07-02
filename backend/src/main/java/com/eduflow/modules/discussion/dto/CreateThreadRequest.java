package com.eduflow.modules.discussion.dto;

import lombok.Data;

@Data
public class CreateThreadRequest {
    private Long courseId;
    private Long lectureId;
    private String title;
    private String content;
    private Integer videoTimestamp;
}
