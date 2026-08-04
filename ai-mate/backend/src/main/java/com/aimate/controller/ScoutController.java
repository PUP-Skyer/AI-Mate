package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.IndustryReport;
import com.aimate.entity.Supplier;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.ScoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scout")
@RequiredArgsConstructor
public class ScoutController {

    private final ScoutService scoutService;

    /**
     * 获取供应商列表，支持品类和地区筛选
     */
    @GetMapping("/suppliers")
    public ApiResponse<Page<Supplier>> getSuppliers(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Supplier> suppliers = scoutService.getSuppliers(userDetails.getId(), category, region, page, size);
        return ApiResponse.success(suppliers);
    }

    /**
     * 创建供应商
     */
    @PostMapping("/suppliers")
    public ApiResponse<Supplier> createSupplier(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Supplier supplier) {
        supplier.setUserId(userDetails.getId());
        supplier.setStatus("ACTIVE");
        Supplier created = scoutService.createSupplier(supplier);
        return ApiResponse.success(created);
    }

    /**
     * 获取供应商详情
     */
    @GetMapping("/suppliers/{id}")
    public ApiResponse<Supplier> getSupplier(@PathVariable Long id) {
        Supplier supplier = scoutService.getSupplier(id);
        return ApiResponse.success(supplier);
    }

    /**
     * 更新供应商
     */
    @PutMapping("/suppliers/{id}")
    public ApiResponse<Supplier> updateSupplier(
            @PathVariable Long id,
            @RequestBody Supplier supplier) {
        Supplier updated = scoutService.updateSupplier(id, supplier);
        return ApiResponse.success(updated);
    }

    /**
     * 删除供应商（软删除）
     */
    @DeleteMapping("/suppliers/{id}")
    public ApiResponse<Void> deleteSupplier(@PathVariable Long id) {
        scoutService.deleteSupplier(id);
        return ApiResponse.success("供应商已删除", null);
    }

    /**
     * 搜索供应商
     */
    @PostMapping("/suppliers/search")
    public ApiResponse<List<Supplier>> searchSuppliers(
            @RequestBody Map<String, String> body) {
        String keyword = body.get("keyword");
        String category = body.get("category");
        String region = body.get("region");

        if (keyword == null || keyword.isBlank()) {
            return ApiResponse.error(400, "搜索关键词不能为空");
        }

        List<Supplier> suppliers = scoutService.searchSuppliers(keyword, category, region);
        return ApiResponse.success(suppliers);
    }

    /**
     * 对比供应商
     */
    @PostMapping("/compare")
    public ApiResponse<List<Supplier>> compareSuppliers(
            @RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ApiResponse.error(400, "请选择至少一个供应商进行对比");
        }

        List<Supplier> suppliers = scoutService.compareSuppliers(ids);
        return ApiResponse.success(suppliers);
    }

    /**
     * 获取行业报告列表
     */
    @GetMapping("/reports")
    public ApiResponse<Page<IndustryReport>> getReports(
            @RequestParam(required = false) String industry,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<IndustryReport> reports = scoutService.getReports(industry, page, size);
        return ApiResponse.success(reports);
    }
}
