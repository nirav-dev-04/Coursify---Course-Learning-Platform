package com.eduflow.modules.course.dto;

import lombok.*;
import java.util.List;
import com.eduflow.modules.course.dto.CurriculumLectureDTO;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumSectionDTO {
    private String id;
    private String title;
    private Integer sortOrder;
    private List<CurriculumLectureDTO> lectures;
}
