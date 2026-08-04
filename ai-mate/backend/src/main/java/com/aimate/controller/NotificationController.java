package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.Notification;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 获取未读通知数量
     */
    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ApiResponse.success(Map.of("unreadCount", count));
    }

    /**
     * 通知列表（分页）
     */
    @GetMapping
    public ApiResponse<Page<Notification>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(notificationService.getNotifications(userDetails.getId(), page, size));
    }

    /**
     * 标记通知为已读
     */
    @PutMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        notificationService.markAsRead(id, userDetails.getId());
        return ApiResponse.success(null);
    }
}
