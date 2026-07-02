package com.eduflow.modules.discussion;

import com.eduflow.modules.discussion.dto.CreateReplyRequest;
import com.eduflow.modules.discussion.dto.CreateThreadRequest;
import com.eduflow.modules.discussion.dto.ThreadResponse;
import com.eduflow.modules.user.User;
import com.eduflow.modules.user.UserRepository;
import com.eduflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;
    private final UserRepository userRepository;

    /**
     * Get all discussion threads for courses owned by the authenticated instructor.
     * GET /api/discussions/instructor
     */
    @GetMapping("/instructor")
    public ResponseEntity<List<ThreadResponse>> getInstructorThreads(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<ThreadResponse> threads = discussionService.getThreadsByInstructor(userPrincipal.getId());
        return ResponseEntity.ok(threads);
    }

    /**
     * Get all discussion threads for a course, optionally filtered by lecture ID.
     * GET /api/discussions/course/{courseId}?lectureId=1001
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ThreadResponse>> getThreads(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long lectureId) {

        List<ThreadResponse> threads = discussionService.getThreadsByCourse(courseId, lectureId);
        return ResponseEntity.ok(threads);
    }

    /**
     * Create a new discussion thread.
     * POST /api/discussions/threads
     */
    @PostMapping("/threads")
    public ResponseEntity<ThreadResponse> createThread(
            @RequestBody CreateThreadRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ThreadResponse response = discussionService.createThread(request, user);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit a reply to a discussion thread.
     * POST /api/discussions/replies
     */
    @PostMapping("/replies")
    public ResponseEntity<ThreadResponse.ReplyResponse> createReply(
            @RequestBody CreateReplyRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ThreadResponse.ReplyResponse response = discussionService.createReply(request, user);
        return ResponseEntity.ok(response);
    }
}

