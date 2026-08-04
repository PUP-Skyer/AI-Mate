package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.AiTemplate;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.AiTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class AiTemplateController {

    private final AiTemplateService aiTemplateService;

    /**
     * 获取公开模板列表（支持 ?category= 筛选）
     */
    @GetMapping
    public ApiResponse<List<AiTemplate>> getTemplates(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ApiResponse.success(aiTemplateService.getTemplatesByCategory(category));
        }
        return ApiResponse.success(aiTemplateService.getPublicTemplates());
    }

    /**
     * 获取模板详情
     */
    @GetMapping("/{id}")
    public ApiResponse<AiTemplate> getTemplate(@PathVariable Long id) {
        return ApiResponse.success(aiTemplateService.getTemplateById(id));
    }

    /**
     * 创建模板（需认证）
     */
    @PostMapping
    public ApiResponse<AiTemplate> createTemplate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String category = (String) body.get("category");
        String description = (String) body.get("description");
        String systemPrompt = (String) body.get("systemPrompt");
        String userPrompt = (String) body.get("userPrompt");
        String icon = (String) body.get("icon");
        Integer sortOrder = body.get("sortOrder") != null ? (Integer) body.get("sortOrder") : null;
        Boolean isPublic = body.get("isPublic") != null ? (Boolean) body.get("isPublic") : null;

        AiTemplate template = aiTemplateService.createTemplate(
                userDetails.getId(), name, category, description,
                systemPrompt, userPrompt, icon, sortOrder, isPublic);
        return ApiResponse.success(template);
    }

    /**
     * 更新模板（需认证）
     */
    @PutMapping("/{id}")
    public ApiResponse<AiTemplate> updateTemplate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String category = (String) body.get("category");
        String description = (String) body.get("description");
        String systemPrompt = (String) body.get("systemPrompt");
        String userPrompt = (String) body.get("userPrompt");
        String icon = (String) body.get("icon");
        Integer sortOrder = body.get("sortOrder") != null ? (Integer) body.get("sortOrder") : null;
        Boolean isPublic = body.get("isPublic") != null ? (Boolean) body.get("isPublic") : null;

        AiTemplate template = aiTemplateService.updateTemplate(
                id, userDetails.getId(), name, category, description,
                systemPrompt, userPrompt, icon, sortOrder, isPublic);
        return ApiResponse.success(template);
    }
}
