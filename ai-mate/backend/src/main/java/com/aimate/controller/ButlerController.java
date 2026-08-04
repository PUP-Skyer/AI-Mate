package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.FAQ;
import com.aimate.entity.Feedback;
import com.aimate.entity.OnboardingProgress;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.ButlerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/butler")
@RequiredArgsConstructor
public class ButlerController {

    private final ButlerService butlerService;

    /**
     * 获取FAQ列表
     */
    @GetMapping("/faq")
    public ApiResponse<Page<FAQ>> getFAQs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<FAQ> faqs = butlerService.getFAQs(keyword, category, page, size);
        return ApiResponse.success(faqs);
    }

    /**
     * 创建FAQ
     */
    @PostMapping("/faq")
    public ApiResponse<FAQ> createFAQ(@RequestBody FAQ faq) {
        faq.setStatus("ACTIVE");
        FAQ created = butlerService.createFAQ(faq);
        return ApiResponse.success(created);
    }

    /**
     * 获取FAQ详情
     */
    @GetMapping("/faq/{id}")
    public ApiResponse<FAQ> getFAQ(@PathVariable Long id) {
        FAQ faq = butlerService.getFAQ(id);
        return ApiResponse.success(faq);
    }

    /**
     * 更新FAQ
     */
    @PutMapping("/faq/{id}")
    public ApiResponse<FAQ> updateFAQ(
            @PathVariable Long id,
            @RequestBody FAQ faq) {
        FAQ updated = butlerService.updateFAQ(id, faq);
        return ApiResponse.success(updated);
    }

    /**
     * 删除FAQ（软删除）
     */
    @DeleteMapping("/faq/{id}")
    public ApiResponse<Void> deleteFAQ(@PathVariable Long id) {
        butlerService.deleteFAQ(id);
        return ApiResponse.success("FAQ已删除", null);
    }

    /**
     * 获取用户引导进度
     */
    @GetMapping("/onboarding/status")
    public ApiResponse<OnboardingProgress> getOnboardingStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        OnboardingProgress progress = butlerService.getOnboardingStatus(userDetails.getId());
        return ApiResponse.success(progress);
    }

    /**
     * 完成引导步骤
     */
    @PostMapping("/onboarding/step")
    public ApiResponse<OnboardingProgress> completeOnboardingStep(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Integer> body) {
        Integer step = body.get("step");
        if (step == null) {
            return ApiResponse.error(400, "步骤号不能为空");
        }
        OnboardingProgress progress = butlerService.completeOnboardingStep(userDetails.getId(), step);
        return ApiResponse.success(progress);
    }

    /**
     * 获取用户反馈列表
     */
    @GetMapping("/feedback")
    public ApiResponse<Page<Feedback>> getFeedbackList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Feedback> feedbacks = butlerService.getFeedbackList(userDetails.getId(), page, size);
        return ApiResponse.success(feedbacks);
    }

    /**
     * 提交用户反馈
     */
    @PostMapping("/feedback")
    public ApiResponse<Feedback> submitFeedback(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String type = body.get("type");
        String content = body.get("content");

        if (type == null || type.isBlank()) {
            return ApiResponse.error(400, "反馈类型不能为空");
        }
        if (content == null || content.isBlank()) {
            return ApiResponse.error(400, "反馈内容不能为空");
        }

        Feedback feedback = butlerService.submitFeedback(userDetails.getId(), type, content);
        return ApiResponse.success(feedback);
    }
}
