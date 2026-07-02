package com.eduflow.modules.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreadResponse {
    private Long id;
    private String title;
    private String content;
    private Long lectureId;
    private String courseTitle;
    private String lectureTitle;
    private Integer videoTimestamp;
    private String authorName;
    private String authorAvatar;
    private LocalDateTime createdAt;
    private int replyCount;
    private List<ReplyResponse> replies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyResponse {
        private Long id;
        private String content;
        private String authorName;
        private String authorAvatar;
        private LocalDateTime createdAt;
    }
}
