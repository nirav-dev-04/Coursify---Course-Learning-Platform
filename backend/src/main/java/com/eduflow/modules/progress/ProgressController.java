package com.eduflow.modules.progress;

import com.eduflow.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressTracker progressTracker;

    public ProgressController(ProgressTracker progressTracker) {
        this.progressTracker = progressTracker;
    }

    @PutMapping("/{courseId}/{lectureId}")
    public ResponseEntity<?> updateProgress(
            @PathVariable("courseId") Long courseId,
            @PathVariable("lectureId") Long lectureId,
            @RequestParam("percent") int percent,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        progressTracker.updateProgress(userPrincipal.getId(), courseId, lectureId, percent);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Progress cached successfully in Redis.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<Map<Long, Integer>> getCourseProgress(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
            
        Map<Long, Integer> progress = progressTracker.getProgress(userPrincipal.getId(), courseId);
        return ResponseEntity.ok(progress);
    }
}
