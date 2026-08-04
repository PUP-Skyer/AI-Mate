package com.aimate.service;

import com.aimate.entity.CommunityComment;
import com.aimate.entity.CommunityPost;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.CommunityCommentRepository;
import com.aimate.repository.CommunityPostRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final UserRepository userRepository;

    /**
     * 分页获取帖子
     */
    @Transactional(readOnly = true)
    public Page<CommunityPost> getPosts(int page, int size, String category) {
        Pageable pageable = PageRequest.of(page, size);
        if (category != null && !category.isBlank()) {
            return postRepository.findByCategoryAndStatus(category, "PUBLISHED", pageable);
        }
        return postRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED", pageable);
    }

    /**
     * 获取帖子详情（含评论）
     */
    @Transactional
    public Map<String, Object> getPostDetail(Long postId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException("帖子不存在"));

        // 增加浏览量
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);

        // 获取评论列表
        List<CommunityComment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);

        Map<String, Object> result = new HashMap<>();
        result.put("post", post);
        result.put("comments", comments);
        return result;
    }

    /**
     * 发帖
     */
    @Transactional
    public CommunityPost createPost(Long userId, String title, String content, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        CommunityPost post = CommunityPost.builder()
                .user(user)
                .userId(userId)
                .title(title)
                .content(content)
                .category(category != null && !category.isBlank() ? category : "general")
                .viewCount(0)
                .likeCount(0)
                .commentCount(0)
                .status("PUBLISHED")
                .build();

        log.info("用户 {} 发布帖子: {}", userId, title);
        return postRepository.save(post);
    }

    /**
     * 评论
     */
    @Transactional
    public CommunityComment addComment(Long postId, Long userId, String content) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException("帖子不存在"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        CommunityComment comment = CommunityComment.builder()
                .post(post)
                .postId(postId)
                .user(user)
                .userId(userId)
                .content(content)
                .build();

        // 更新帖子评论数
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        log.info("用户 {} 评论帖子 {}: {}", userId, postId, content.substring(0, Math.min(content.length(), 50)));
        return commentRepository.save(comment);
    }

    /**
     * 点赞
     */
    @Transactional
    public CommunityPost likePost(Long postId) {
        CommunityPost post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException("帖子不存在"));

        post.setLikeCount(post.getLikeCount() + 1);
        log.info("帖子 {} 被点赞，当前点赞数: {}", postId, post.getLikeCount());
        return postRepository.save(post);
    }

    /**
     * 搜索帖子
     */
    @Transactional(readOnly = true)
    public Page<CommunityPost> searchPosts(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // 使用 title LIKE 查询
        return postRepository.findByTitleContainingAndStatus(keyword, "PUBLISHED", pageable);
    }
}
