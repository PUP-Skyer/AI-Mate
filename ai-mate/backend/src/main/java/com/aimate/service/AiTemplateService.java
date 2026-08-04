package com.aimate.service;

import com.aimate.entity.AiTemplate;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.AiTemplateRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiTemplateService {

    private final AiTemplateRepository aiTemplateRepository;
    private final UserRepository userRepository;

    /**
     * 获取所有公开模板
     */
    @Transactional(readOnly = true)
    public List<AiTemplate> getPublicTemplates() {
        return aiTemplateRepository.findByStatusAndIsPublicTrueOrderBySortOrder("ACTIVE");
    }

    /**
     * 按分类获取模板
     */
    @Transactional(readOnly = true)
    public List<AiTemplate> getTemplatesByCategory(String category) {
        return aiTemplateRepository.findByCategoryAndStatus(category, "ACTIVE");
    }

    /**
     * 获取模板详情
     */
    @Transactional(readOnly = true)
    public AiTemplate getTemplateById(Long id) {
        return aiTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("模板不存在"));
    }

    /**
     * 创建模板
     */
    @Transactional
    public AiTemplate createTemplate(Long userId, String name, String category, String description,
                                     String systemPrompt, String userPrompt, String icon,
                                     Integer sortOrder, Boolean isPublic) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        AiTemplate template = AiTemplate.builder()
                .name(name)
                .category(category)
                .description(description)
                .systemPrompt(systemPrompt)
                .userPrompt(userPrompt)
                .icon(icon)
                .sortOrder(sortOrder != null ? sortOrder : 0)
                .isPublic(isPublic != null ? isPublic : true)
                .status("ACTIVE")
                .build();

        log.info("用户 {} 创建模板: {}", userId, name);
        return aiTemplateRepository.save(template);
    }

    /**
     * 更新模板
     */
    @Transactional
    public AiTemplate updateTemplate(Long id, Long userId, String name, String category,
                                     String description, String systemPrompt, String userPrompt,
                                     String icon, Integer sortOrder, Boolean isPublic) {
        AiTemplate template = aiTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException("模板不存在"));

        if (name != null) {
            template.setName(name);
        }
        if (category != null) {
            template.setCategory(category);
        }
        if (description != null) {
            template.setDescription(description);
        }
        if (systemPrompt != null) {
            template.setSystemPrompt(systemPrompt);
        }
        if (userPrompt != null) {
            template.setUserPrompt(userPrompt);
        }
        if (icon != null) {
            template.setIcon(icon);
        }
        if (sortOrder != null) {
            template.setSortOrder(sortOrder);
        }
        if (isPublic != null) {
            template.setIsPublic(isPublic);
        }

        log.info("用户 {} 更新模板: {}", userId, id);
        return aiTemplateRepository.save(template);
    }
}
