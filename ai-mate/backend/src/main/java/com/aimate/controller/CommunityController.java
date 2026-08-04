package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.CommunityComment;
import com.aimate.entity.CommunityPost;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    /**
     * 帖子列表（分页 ?page=0&size=10&category=）
     */
    @GetMapping("/posts")
    public ApiResponse<Page<CommunityPost>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        return ApiResponse.success(communityService.getPosts(page, size, category));
    }

    /**
     * 帖子详情+评论
     */
    @GetMapping("/posts/{id}")
    public ApiResponse<Map<String, Object>> getPostDetail(@PathVariable Long id) {
        return ApiResponse.success(communityService.getPostDetail(id));
    }

    /**
     * 发帖（需认证）
     */
    @PostMapping("/posts")
    public ApiResponse<CommunityPost> createPost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        CommunityPost post = communityService.createPost(
                userDetails.getId(),
                body.get("title"),
                body.get("content"),
                body.get("category"));
        return ApiResponse.success(post);
    }

    /**
     * 评论（需认证）
     */
    @PostMapping("/posts/{id}/comments")
    public ApiResponse<CommunityComment> addComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        CommunityComment comment = communityService.addComment(
                id, userDetails.getId(), body.get("content"));
        return ApiResponse.success(comment);
    }

    /**
     * 点赞（需认证）
     */
    @PostMapping("/posts/{id}/like")
    public ApiResponse<CommunityPost> likePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ApiResponse.success(communityService.likePost(id));
    }

    /**
     * 搜索帖子
     */
    @GetMapping("/posts/search")
    public ApiResponse<Page<CommunityPost>> searchPosts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(communityService.searchPosts(keyword, page, size));
    }
}
