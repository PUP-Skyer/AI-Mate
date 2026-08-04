package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.Conversation;
import com.aimate.entity.Message;
import com.aimate.repository.MessageRepository;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageRepository messageRepository;

    /**
     * 获取当前用户对话列表
     */
    @GetMapping
    public ApiResponse<List<Conversation>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Conversation> conversations = conversationService.getConversations(userDetails.getId());
        return ApiResponse.success(conversations);
    }

    /**
     * 创建新对话
     */
    @PostMapping
    public ApiResponse<Conversation> createConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) Map<String, String> body) {
        String title = body != null ? body.get("title") : null;
        String type = body != null ? body.get("type") : null;
        Conversation conversation = conversationService.createConversation(userDetails.getId(), title, type);
        return ApiResponse.success(conversation);
    }

    /**
     * 获取对话详情含消息
     */
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getConversationDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        Conversation conversation = conversationService.getConversationWithMessages(userDetails.getId(), id);
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
        return ApiResponse.success(Map.of(
                "conversation", conversation,
                "messages", messages
        ));
    }

    /**
     * 删除对话（软删除）
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteConversation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        conversationService.deleteConversation(userDetails.getId(), id);
        return ApiResponse.success("对话已删除", null);
    }

    /**
     * 更新对话标题
     */
    @PutMapping("/{id}/title")
    public ApiResponse<Conversation> updateTitle(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String title = body.get("title");
        if (title == null || title.isBlank()) {
            return ApiResponse.error(400, "标题不能为空");
        }
        Conversation conversation = conversationService.updateConversationTitle(id, title);
        return ApiResponse.success(conversation);
    }

    /**
     * 向对话添加消息
     */
    @PostMapping("/{id}/messages")
    public ApiResponse<Message> addMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String role = (String) body.get("role");
        String content = (String) body.get("content");
        Integer tokenCount = body.get("tokenCount") != null ? ((Number) body.get("tokenCount")).intValue() : 0;
        if (role == null || content == null) {
            return ApiResponse.error(400, "角色和内容不能为空");
        }
        Message message = conversationService.addMessage(id, role, content, tokenCount);
        return ApiResponse.success(message);
    }
}
