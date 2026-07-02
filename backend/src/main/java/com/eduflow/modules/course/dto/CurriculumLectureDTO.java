package com.eduflow.modules.course.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumLectureDTO {
    private String id;
    private String title;
    private String videoKey;
    private Integer durationSec;
    private Boolean isPreview;
    private Integer sortOrder;
}
