package com.aimate.service;

import com.aimate.entity.KnowledgeBase;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.KnowledgeBaseRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final UserRepository userRepository;

    /**
     * 获取用户知识库列表
     */
    @Transactional(readOnly = true)
    public List<KnowledgeBase> getKnowledgeBases(Long userId) {
        return knowledgeBaseRepository.findByUserIdAndStatus(userId, "ACTIVE");
    }

    /**
     * 创建知识库
     */
    @Transactional
    public KnowledgeBase createKnowledgeBase(Long userId, String name, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        KnowledgeBase knowledgeBase = KnowledgeBase.builder()
                .user(user)
                .userId(userId)
                .name(name)
                .description(description)
                .fileCount(0)
                .status("ACTIVE")
                .build();

        log.info("用户 {} 创建知识库: {}", userId, name);
        return knowledgeBaseRepository.save(knowledgeBase);
    }
}
