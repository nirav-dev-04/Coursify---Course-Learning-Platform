package com.eduflow.modules.course.dto;

import java.math.BigDecimal;

public interface CourseListDTO {
    Long getId();
    String getTitle();
    String getSlug();
    String getCategory();
    BigDecimal getPrice();
    String getStatus();
    String getInstructorName();
    Double getAvgRating();
}
