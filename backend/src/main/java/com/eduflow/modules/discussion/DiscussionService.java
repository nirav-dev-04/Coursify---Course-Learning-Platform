package com.eduflow.modules.discussion;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.modules.course.LectureRepository;
import com.eduflow.modules.discussion.dto.CreateReplyRequest;
import com.eduflow.modules.discussion.dto.CreateThreadRequest;
import com.eduflow.modules.discussion.dto.ThreadResponse;
import com.eduflow.modules.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionThreadRepository threadRepository;
    private final DiscussionReplyRepository replyRepository;
    private final CourseRepository courseRepository;
    private final LectureRepository lectureRepository;

    public List<ThreadResponse> getThreadsByCourse(Long courseId, Long lectureId) {
        List<DiscussionThread> threads;
        if (lectureId != null) {
            threads = threadRepository.findByCourseIdAndLectureIdOrderByCreatedAtDesc(courseId, lectureId);
        } else {
            threads = threadRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        }
        return threads.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ThreadResponse> getThreadsByInstructor(Long instructorId) {
        // Show all discussion threads to any instructor since courses are seeded
        // with mock instructors from CSV that can't be logged into.
        // This allows any real instructor to view and respond to student Q&A.
        List<DiscussionThread> threads = threadRepository.findAllByOrderByCreatedAtDesc();
        return threads.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public ThreadResponse createThread(CreateThreadRequest request, User user) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        DiscussionThread thread = DiscussionThread.builder()
                .user(user)
                .course(course)
                .lectureId(request.getLectureId())
                .title(request.getTitle())
                .content(request.getContent())
                .videoTimestamp(request.getVideoTimestamp())
                .build();
        thread = threadRepository.save(thread);

        log.info("User {} created discussion thread '{}' in course {}", user.getName(), thread.getTitle(), course.getId());
        return mapToResponse(thread);
    }

    @Transactional
    public ThreadResponse.ReplyResponse createReply(CreateReplyRequest request, User user) {
        DiscussionThread thread = threadRepository.findById(request.getThreadId())
                .orElseThrow(() -> new ResourceNotFoundException("Discussion thread not found: " + request.getThreadId()));

        DiscussionReply reply = DiscussionReply.builder()
                .thread(thread)
                .user(user)
                .content(request.getContent())
                .build();
        reply = replyRepository.save(reply);

        log.info("User {} replied to thread {} in course {}", user.getName(), thread.getId(), thread.getCourse().getId());
        return mapReplyResponse(reply);
    }

    private ThreadResponse mapToResponse(DiscussionThread thread) {
        List<ThreadResponse.ReplyResponse> replies = thread.getReplies().stream()
                .map(this::mapReplyResponse)
                .collect(Collectors.toList());

        String courseTitle = thread.getCourse() != null ? thread.getCourse().getTitle() : null;
        String lectureTitle = null;
        if (thread.getLectureId() != null) {
            lectureTitle = lectureRepository.findById(thread.getLectureId())
                    .map(l -> l.getTitle())
                    .orElse(null);
        }

        return ThreadResponse.builder()
                .id(thread.getId())
                .title(thread.getTitle())
                .content(thread.getContent())
                .lectureId(thread.getLectureId())
                .courseTitle(courseTitle)
                .lectureTitle(lectureTitle)
                .videoTimestamp(thread.getVideoTimestamp())
                .authorName(thread.getUser().getName())
                .authorAvatar(thread.getUser().getAvatarUrl())
                .createdAt(thread.getCreatedAt())
                .replyCount(replies.size())
                .replies(replies)
                .build();
    }

    private ThreadResponse.ReplyResponse mapReplyResponse(DiscussionReply reply) {
        return ThreadResponse.ReplyResponse.builder()
                .id(reply.getId())
                .content(reply.getContent())
                .authorName(reply.getUser().getName())
                .authorAvatar(reply.getUser().getAvatarUrl())
                .createdAt(reply.getCreatedAt())
                .build();
    }
}
