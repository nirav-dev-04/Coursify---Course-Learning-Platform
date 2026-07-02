package com.eduflow.modules.progress;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ProgressTracker {

    private final RedisTemplate<String, Object> redisTemplate;
    private final LectureProgressRepository progressRepository;
    
    private static final String PROGRESS_KEY_PREFIX = "user:progress:";
    private static final String DIRTY_SET_KEY = "user:progress:dirty";

    public ProgressTracker(RedisTemplate<String, Object> redisTemplate,
                           LectureProgressRepository progressRepository) {
        this.redisTemplate = redisTemplate;
        this.progressRepository = progressRepository;
    }

    public void updateProgress(Long userId, Long courseId, Long lectureId, int percent) {
        String progressKey = PROGRESS_KEY_PREFIX + userId + ":" + courseId;
        String dirtyValue = userId + ":" + courseId;

        try {
            // Write watch percentage to course hash
            redisTemplate.opsForHash().put(progressKey, String.valueOf(lectureId), String.valueOf(percent));
            // Add user course reference to the dirty set to schedule database sync
            redisTemplate.opsForSet().add(DIRTY_SET_KEY, dirtyValue);
            
            log.debug("Updated Redis progress for User: {}, Course: {}, Lecture: {} -> {}%", 
                    userId, courseId, lectureId, percent);
        } catch (Exception e) {
            log.warn("Redis is offline. Falling back to direct PostgreSQL write for progress update: {}", e.getMessage());
            try {
                LectureProgress progress = progressRepository.findByUserIdAndCourseIdAndLectureId(userId, courseId, lectureId)
                        .orElseGet(() -> LectureProgress.builder()
                                .userId(userId)
                                .courseId(courseId)
                                .lectureId(lectureId)
                                .build());
                progress.setPercent(percent);
                progress.setUpdatedAt(LocalDateTime.now());
                progressRepository.save(progress);
                log.debug("Successfully updated PostgreSQL fallback progress.");
            } catch (Exception dbEx) {
                log.error("Database fallback progress update failed", dbEx);
            }
        }
    }

    public Map<Long, Integer> getProgress(Long userId, Long courseId) {
        String progressKey = PROGRESS_KEY_PREFIX + userId + ":" + courseId;
        
        try {
            Map<Object, Object> rawEntries = redisTemplate.opsForHash().entries(progressKey);
            if (rawEntries != null && !rawEntries.isEmpty()) {
                Map<Long, Integer> progressMap = new HashMap<>();
                for (Map.Entry<Object, Object> entry : rawEntries.entrySet()) {
                    Long lectureId = Long.valueOf((String) entry.getKey());
                    Integer percent = Integer.valueOf((String) entry.getValue());
                    progressMap.put(lectureId, percent);
                }
                return progressMap;
            }
        } catch (Exception e) {
            log.warn("Redis is offline. Falling back to direct PostgreSQL read for progress: {}", e.getMessage());
        }

        // Database read fallback
        try {
            List<LectureProgress> dbProgress = progressRepository.findByUserIdAndCourseId(userId, courseId);
            Map<Long, Integer> progressMap = new HashMap<>();
            for (LectureProgress lp : dbProgress) {
                progressMap.put(lp.getLectureId(), lp.getPercent());
            }
            return progressMap;
        } catch (Exception dbEx) {
            log.error("Database fallback progress read failed", dbEx);
            return new HashMap<>();
        }
    }
}
