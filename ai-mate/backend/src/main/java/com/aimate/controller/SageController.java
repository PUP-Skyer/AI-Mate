package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.DataAnalysisTask;
import com.aimate.entity.DocumentSection;
import com.aimate.entity.StrategyDocument;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.SageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sage")
@RequiredArgsConstructor
public class SageController {

    private final SageService sageService;

    /**
     * 获取文档列表
     */
    @GetMapping("/documents")
    public ApiResponse<Page<StrategyDocument>> getDocuments(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<StrategyDocument> documents = sageService.getDocuments(userDetails.getId(), type, page, size);
        return ApiResponse.success(documents);
    }

    /**
     * 创建文档
     */
    @PostMapping("/documents")
    public ApiResponse<StrategyDocument> createDocument(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody StrategyDocument doc) {
        StrategyDocument document = sageService.createDocument(userDetails.getId(), doc);
        return ApiResponse.success(document);
    }

    /**
     * 获取文档详情（含章节）
     */
    @GetMapping("/documents/{id}")
    public ApiResponse<Map<String, Object>> getDocument(
            @PathVariable Long id) {
        Map<String, Object> detail = sageService.getDocument(id);
        return ApiResponse.success(detail);
    }

    /**
     * 更新文档
     */
    @PutMapping("/documents/{id}")
    public ApiResponse<StrategyDocument> updateDocument(
            @PathVariable Long id,
            @RequestBody StrategyDocument doc) {
        StrategyDocument document = sageService.updateDocument(id, doc);
        return ApiResponse.success(document);
    }

    /**
     * 删除文档（软删除）
     */
    @DeleteMapping("/documents/{id}")
    public ApiResponse<Void> deleteDocument(
            @PathVariable Long id) {
        sageService.deleteDocument(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 生成章节
     */
    @PostMapping("/documents/{id}/generate")
    public ApiResponse<DocumentSection> generateSection(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String sectionKey = body.get("sectionKey");
        if (sectionKey == null || sectionKey.isBlank()) {
            return ApiResponse.error(400, "sectionKey 不能为空");
        }
        DocumentSection section = sageService.generateSection(id, sectionKey);
        return ApiResponse.success(section);
    }

    /**
     * 审阅文档
     */
    @PostMapping("/documents/{id}/review")
    public ApiResponse<Map<String, Object>> reviewDocument(
            @PathVariable Long id) {
        Map<String, Object> reviewData = sageService.reviewDocument(id);
        return ApiResponse.success(reviewData);
    }

    /**
     * 提交数据分析任务
     */
    @PostMapping("/analyze")
    public ApiResponse<DataAnalysisTask> submitAnalysis(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String title = body.get("title");
        String filePath = body.get("filePath");
        if (title == null || title.isBlank()) {
            return ApiResponse.error(400, "标题不能为空");
        }
        DataAnalysisTask task = sageService.submitAnalysis(userDetails.getId(), title, filePath);
        return ApiResponse.success(task);
    }

    /**
     * 获取数据分析结果
     */
    @GetMapping("/analyze/{taskId}")
    public ApiResponse<DataAnalysisTask> getAnalysisResult(
            @PathVariable Long taskId) {
        DataAnalysisTask task = sageService.getAnalysisResult(taskId);
        return ApiResponse.success(task);
    }

    /**
     * 获取分析任务列表
     */
    @GetMapping("/analyze")
    public ApiResponse<List<DataAnalysisTask>> getAnalysisTasks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DataAnalysisTask> tasks = sageService.getAnalysisTasks(userDetails.getId());
        return ApiResponse.success(tasks);
    }
}
