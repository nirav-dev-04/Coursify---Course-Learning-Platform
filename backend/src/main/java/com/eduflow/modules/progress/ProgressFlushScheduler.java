package com.eduflow.modules.progress;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@Slf4j
public class ProgressFlushScheduler {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ProgressTracker progressTracker;
    private final LectureProgressRepository progressRepository;

    private static final String DIRTY_SET_KEY = "user:progress:dirty";

    public ProgressFlushScheduler(RedisTemplate<String, Object> redisTemplate,
                                  ProgressTracker progressTracker,
                                  LectureProgressRepository progressRepository) {
        this.redisTemplate = redisTemplate;
        this.progressTracker = progressTracker;
        this.progressRepository = progressRepository;
    }

    // Runs every 5 minutes (300,000 milliseconds)
    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void flushProgressToDB() {
        log.info("Starting scheduled flush of student progress from Redis to PostgreSQL...");

        try {
            // SPOP returns random elements from the set and removes them, ensuring thread safety
            // if multiple backend instances run. However, to handle scaling, we pop a batch of keys.
            Set<Object> dirtyKeys = redisTemplate.opsForSet().members(DIRTY_SET_KEY);
            
            if (dirtyKeys == null || dirtyKeys.isEmpty()) {
                log.info("No dirty progress keys found in Redis. Seeding scheduler complete.");
                return;
            }

            log.info("Found {} dirty user-course progress records to flush. Processing...", dirtyKeys.size());

            List<LectureProgress> progressBatch = new ArrayList<>();

            for (Object keyObj : dirtyKeys) {
                String dirtyKey = (String) keyObj;
                
                // Immediately remove the key from the dirty set to close the race window.
                // If it returns 0/null, another scheduler instance or thread is already processing it.
                Long removedCount = redisTemplate.opsForSet().remove(DIRTY_SET_KEY, dirtyKey);
                if (removedCount == null || removedCount == 0) {
                    continue;
                }

                String[] tokens = dirtyKey.split(":");
                if (tokens.length != 2) {
                    continue;
                }

                Long userId = Long.valueOf(tokens[0]);
                Long courseId = Long.valueOf(tokens[1]);

                // Fetch current progress hash from Redis
                Map<Long, Integer> redisProgress = progressTracker.getProgress(userId, courseId);

                for (Map.Entry<Long, Integer> entry : redisProgress.entrySet()) {
                    Long lectureId = entry.getKey();
                    Integer percent = entry.getValue();

                    // Find existing DB record or build a new one
                    LectureProgress progress = progressRepository.findByUserIdAndCourseIdAndLectureId(userId, courseId, lectureId)
                            .orElseGet(() -> LectureProgress.builder()
                                    .userId(userId)
                                    .courseId(courseId)
                                    .lectureId(lectureId)
                                    .updatedAt(LocalDateTime.now())
                                    .build());

                    progress.setPercent(percent);
                    progress.setUpdatedAt(LocalDateTime.now());
                    progressBatch.add(progress);
                }
            }

            if (!progressBatch.isEmpty()) {
                progressRepository.saveAll(progressBatch);
                log.info("Successfully flushed {} progress logs to PostgreSQL database.", progressBatch.size());
            }
        } catch (Exception e) {
            log.warn("Redis is offline. Skipping scheduled progress flush: {}", e.getMessage());
        }
    }
}
