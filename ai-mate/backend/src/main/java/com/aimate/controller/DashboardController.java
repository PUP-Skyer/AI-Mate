package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * 获取总览数据
     */
    @GetMapping("/overview")
    public ApiResponse<Map<String, Long>> getOverview() {
        return ApiResponse.success(dashboardService.getOverview());
    }

    /**
     * 获取AI使用统计
     */
    @GetMapping("/usage")
    public ApiResponse<List<Map<String, Object>>> getAIUsage(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.success(dashboardService.getAIUsageStats(days));
    }

    /**
     * 获取用户增长趋势
     */
    @GetMapping("/user-growth")
    public ApiResponse<List<Map<String, Object>>> getUserGrowth(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.success(dashboardService.getUserGrowthStats(days));
    }
}
