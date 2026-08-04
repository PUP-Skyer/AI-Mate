package com.aimate.service;

import com.aimate.entity.FAQ;
import com.aimate.entity.Feedback;
import com.aimate.entity.OnboardingProgress;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.FAQRepository;
import com.aimate.repository.FeedbackRepository;
import com.aimate.repository.OnboardingProgressRepository;
import com.aimate.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ButlerService {

    private final FAQRepository faqRepository;
    private final OnboardingProgressRepository onboardingProgressRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * 分页获取FAQ列表，支持关键词和分类筛选
     */
    @Transactional(readOnly = true)
    public Page<FAQ> getFAQs(String keyword, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        if (keyword != null && !keyword.isBlank() && category != null && !category.isBlank()) {
            // 关键词搜索 + 分类筛选，使用列表查询后手动分页
            List<FAQ> all = faqRepository.findByQuestionContainingIgnoreCaseAndCategoryAndStatus(keyword, category, "ACTIVE");
            return paginateList(all, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            List<FAQ> all = faqRepository.findByQuestionContainingIgnoreCaseAndStatus(keyword, "ACTIVE");
            return paginateList(all, pageable);
        } else if (category != null && !category.isBlank()) {
            return faqRepository.findByCategoryAndStatusOrderBySortOrderAsc(category, "ACTIVE", pageable);
        } else {
            return faqRepository.findByStatusOrderBySortOrderAsc("ACTIVE", pageable);
        }
    }

    /**
     * 获取FAQ详情
     */
    @Transactional(readOnly = true)
    public FAQ getFAQ(Long id) {
        FAQ faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException("FAQ不存在", HttpStatus.NOT_FOUND));

        // 增加浏览次数
        faq.setViewCount(faq.getViewCount() + 1);
        faqRepository.save(faq);
        return faq;
    }

    /**
     * 创建FAQ
     */
    @Transactional
    public FAQ createFAQ(FAQ faq) {
        faq = faqRepository.save(faq);
        log.info("创建FAQ: id={}", faq.getId());
        return faq;
    }

    /**
     * 更新FAQ
     */
    @Transactional
    public FAQ updateFAQ(Long id, FAQ faqUpdate) {
        FAQ faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException("FAQ不存在", HttpStatus.NOT_FOUND));

        if (faqUpdate.getQuestion() != null) {
            faq.setQuestion(faqUpdate.getQuestion());
        }
        if (faqUpdate.getAnswer() != null) {
            faq.setAnswer(faqUpdate.getAnswer());
        }
        if (faqUpdate.getCategory() != null) {
            faq.setCategory(faqUpdate.getCategory());
        }
        if (faqUpdate.getKeywords() != null) {
            faq.setKeywords(faqUpdate.getKeywords());
        }
        if (faqUpdate.getSortOrder() != null) {
            faq.setSortOrder(faqUpdate.getSortOrder());
        }

        faq = faqRepository.save(faq);
        log.info("更新FAQ: id={}", id);
        return faq;
    }

    /**
     * 软删除FAQ（status=DELETED）
     */
    @Transactional
    public void deleteFAQ(Long id) {
        FAQ faq = faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException("FAQ不存在", HttpStatus.NOT_FOUND));

        faq.setStatus("DELETED");
        faqRepository.save(faq);
        log.info("删除FAQ: id={}", id);
    }

    /**
     * 获取用户引导进度
     */
    @Transactional(readOnly = true)
    public OnboardingProgress getOnboardingStatus(Long userId) {
        return onboardingProgressRepository.findByUserId(userId)
                .orElseGet(() -> OnboardingProgress.builder()
                        .userId(userId)
                        .currentStep(0)
                        .completedSteps("[]")
                        .status("IN_PROGRESS")
                        .build());
    }

    /**
     * 完成引导步骤
     */
    @Transactional
    public OnboardingProgress completeOnboardingStep(Long userId, Integer step) {
        OnboardingProgress progress = onboardingProgressRepository.findByUserId(userId)
                .orElseGet(() -> OnboardingProgress.builder()
                        .userId(userId)
                        .currentStep(0)
                        .completedSteps("[]")
                        .status("IN_PROGRESS")
                        .build());

        try {
            List<Integer> completedSteps = objectMapper.readValue(
                    progress.getCompletedSteps(), new TypeReference<List<Integer>>() {});

            if (!completedSteps.contains(step)) {
                completedSteps.add(step);
            }
            progress.setCompletedSteps(objectMapper.writeValueAsString(completedSteps));

            // 更新当前步骤为已完成步骤的最大值 + 1
            int maxStep = completedSteps.stream().max(Integer::compareTo).orElse(0);
            progress.setCurrentStep(maxStep + 1);

            // 如果所有步骤都完成了（假设总共5步），标记为完成
            if (completedSteps.size() >= 5) {
                progress.setStatus("COMPLETED");
            }

        } catch (JsonProcessingException e) {
            log.error("解析completedSteps失败: userId={}", userId, e);
            throw new BusinessException("引导进度数据异常");
        }

        progress = onboardingProgressRepository.save(progress);
        log.info("用户 {} 完成引导步骤: step={}", userId, step);
        return progress;
    }

    /**
     * 获取用户反馈列表
     */
    @Transactional(readOnly = true)
    public Page<Feedback> getFeedbackList(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * 提交用户反馈
     */
    @Transactional
    public Feedback submitFeedback(Long userId, String type, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        Feedback feedback = Feedback.builder()
                .user(user)
                .userId(user.getId())
                .type(type)
                .content(content)
                .status("PENDING")
                .build();

        feedback = feedbackRepository.save(feedback);
        log.info("用户 {} 提交反馈: type={}", userId, type);
        return feedback;
    }

    /**
     * 手动分页辅助方法
     */
    private Page<FAQ> paginateList(List<FAQ> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), list.size());

        if (start >= list.size()) {
            return org.springframework.data.domain.Page.empty(pageable);
        }

        List<FAQ> subList = list.subList(start, end);
        return new org.springframework.data.domain.PageImpl<>(subList, pageable, list.size());
    }
}
