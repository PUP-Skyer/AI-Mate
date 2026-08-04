package com.aimate.service;

import com.aimate.entity.Notification;
import com.aimate.exception.BusinessException;
import com.aimate.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * 获取未读通知数量
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * 获取通知列表（分页）
     */
    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * 标记通知为已读
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("通知不存在"));

        if (!notification.getUserId().equals(userId)) {
            throw new BusinessException("无权操作此通知");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        log.info("用户 {} 标记通知 {} 为已读", userId, notificationId);
    }
}
