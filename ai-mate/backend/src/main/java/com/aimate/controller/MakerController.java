package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.CollabSpace;
import com.aimate.entity.ContentPiece;
import com.aimate.entity.ContentVersion;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.MakerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maker")
@RequiredArgsConstructor
public class MakerController {

    private final MakerService makerService;

    /**
     * 获取内容列表
     */
    @GetMapping("/content")
    public ApiResponse<Page<ContentPiece>> getContentPieces(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ContentPiece> pieces = makerService.getContentPieces(userDetails.getId(), type, page, size);
        return ApiResponse.success(pieces);
    }

    /**
     * 创建内容
     */
    @PostMapping("/content")
    public ApiResponse<ContentPiece> createContentPiece(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ContentPiece piece) {
        piece.setUserId(userDetails.getId());
        ContentPiece content = makerService.createContentPiece(piece);
        return ApiResponse.success(content);
    }

    /**
     * 获取内容详情（含最新版本）
     */
    @GetMapping("/content/{id}")
    public ApiResponse<Map<String, Object>> getContentPiece(
            @PathVariable Long id) {
        Map<String, Object> detail = makerService.getContentPiece(id);
        return ApiResponse.success(detail);
    }

    /**
     * 更新内容
     */
    @PutMapping("/content/{id}")
    public ApiResponse<ContentPiece> updateContentPiece(
            @PathVariable Long id,
            @RequestBody ContentPiece piece) {
        ContentPiece content = makerService.updateContentPiece(id, piece);
        return ApiResponse.success(content);
    }

    /**
     * 删除内容（软删除）
     */
    @DeleteMapping("/content/{id}")
    public ApiResponse<Void> deleteContentPiece(
            @PathVariable Long id) {
        makerService.deleteContentPiece(id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 获取内容版本历史
     */
    @GetMapping("/content/{id}/versions")
    public ApiResponse<List<ContentVersion>> getContentVersions(
            @PathVariable Long id) {
        List<ContentVersion> versions = makerService.getContentVersions(id);
        return ApiResponse.success(versions);
    }

    /**
     * 创建内容新版本
     */
    @PostMapping("/content/{id}/versions")
    public ApiResponse<ContentVersion> createContentVersion(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        String style = body.get("style");
        ContentVersion version = makerService.createContentVersion(id, content, style);
        return ApiResponse.success(version);
    }

    /**
     * 获取协作空间列表
     */
    @GetMapping("/spaces")
    public ApiResponse<List<CollabSpace>> getSpaces(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<CollabSpace> spaces = makerService.getSpaces(userDetails.getId());
        return ApiResponse.success(spaces);
    }

    /**
     * 创建协作空间
     */
    @PostMapping("/spaces")
    public ApiResponse<CollabSpace> createSpace(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CollabSpace space) {
        space.setOwnerId(userDetails.getId());
        CollabSpace created = makerService.createSpace(space);
        return ApiResponse.success(created);
    }

    /**
     * 获取协作空间详情
     */
    @GetMapping("/spaces/{id}")
    public ApiResponse<CollabSpace> getSpace(
            @PathVariable Long id) {
        CollabSpace space = makerService.getSpace(id);
        return ApiResponse.success(space);
    }
}
