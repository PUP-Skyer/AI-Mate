package com.aimate.service;

import com.aimate.entity.Conversation;
import com.aimate.entity.Message;
import com.aimate.entity.UsageLog;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.ConversationRepository;
import com.aimate.repository.MessageRepository;
import com.aimate.repository.UsageLogRepository;
import com.aimate.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UsageLogRepository usageLogRepository;
    private final UserRepository userRepository;

    public ConversationService(ConversationRepository conversationRepository, MessageRepository messageRepository, UsageLogRepository usageLogRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.usageLogRepository = usageLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * 创建新对话
     */
    @Transactional
    public Conversation createConversation(Long userId, String title, String type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setUserId(user.getId());
        conversation.setTitle(title != null ? title : "新对话");
        conversation.setType(type != null ? type : "general");
        conversation.setStatus("ACTIVE");

        conversation = conversationRepository.save(conversation);
        log.info("用户 {} 创建对话: id={}, type={}", userId, conversation.getId(), conversation.getType());
        return conversation;
    }

    /**
     * 获取用户所有 ACTIVE 对话列表
     */
    @Transactional(readOnly = true)
    public List<Conversation> getConversations(Long userId) {
        return conversationRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, "ACTIVE");
    }

    /**
     * 获取对话及所有消息，验证用户归属
     */
    @Transactional(readOnly = true)
    public Conversation getConversationWithMessages(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException("对话不存在", HttpStatus.NOT_FOUND));

        if (!conversation.getUserId().equals(userId)) {
            throw new BusinessException("无权访问该对话", HttpStatus.FORBIDDEN);
        }

        // 触发懒加载，获取消息列表
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        log.debug("对话 {} 共有 {} 条消息", conversationId, messages.size());

        return conversation;
    }

    /**
     * 添加消息
     */
    @Transactional
    public Message addMessage(Long conversationId, String role, String content, Integer tokenCount) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException("对话不存在", HttpStatus.NOT_FOUND));

        Message message = new Message();
        message.setConversation(conversation);
        message.setConversationId(conversationId);
        message.setRole(role);
        message.setContent(content);
        message.setTokenCount(tokenCount != null ? tokenCount : 0);

        message = messageRepository.save(message);
        log.debug("对话 {} 添加消息: role={}, tokenCount={}", conversationId, role, message.getTokenCount());
        return message;
    }

    /**
     * 更新对话标题
     */
    @Transactional
    public Conversation updateConversationTitle(Long conversationId, String title) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException("对话不存在", HttpStatus.NOT_FOUND));

        conversation.setTitle(title);
        conversation = conversationRepository.save(conversation);
        log.info("对话 {} 标题更新为: {}", conversationId, title);
        return conversation;
    }

    /**
     * 软删除对话（status=DELETED），验证用户归属
     */
    @Transactional
    public void deleteConversation(Long userId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException("对话不存在", HttpStatus.NOT_FOUND));

        if (!conversation.getUserId().equals(userId)) {
            throw new BusinessException("无权删除该对话", HttpStatus.FORBIDDEN);
        }

        conversation.setStatus("DELETED");
        conversationRepository.save(conversation);
        log.info("用户 {} 删除对话 {}", userId, conversationId);
    }

    /**
     * 记录使用日志
     */
    @Transactional
    public UsageLog logUsage(Long userId, String action, int tokenInput, int tokenOutput, String model, long durationMs) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        UsageLog usageLog = new UsageLog();
        usageLog.setUser(user);
        usageLog.setUserId(user.getId());
        usageLog.setAction(action);
        usageLog.setTokenInput(tokenInput);
        usageLog.setTokenOutput(tokenOutput);
        usageLog.setModel(model);
        usageLog.setDurationMs(durationMs);

        usageLog = usageLogRepository.save(usageLog);
        log.info("记录使用日志: userId={}, action={}, tokenIn={}, tokenOut={}, model={}, duration={}ms",
                userId, action, tokenInput, tokenOutput, model, durationMs);
        return usageLog;
    }
}
