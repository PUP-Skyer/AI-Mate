package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.entity.Project;
import com.aimate.entity.ProjectTask;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * 获取当前用户的项目列表
     */
    @GetMapping
    public ApiResponse<List<Project>> getProjects(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Project> projects = projectService.getProjects(userDetails.getId());
        return ApiResponse.success(projects);
    }

    /**
     * 创建项目
     */
    @PostMapping
    public ApiResponse<Project> createProject(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        Project project = projectService.createProject(userDetails.getId(), name, description);
        return ApiResponse.success(project);
    }

    /**
     * 获取项目详情（含任务列表）
     */
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getProjectDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        Map<String, Object> detail = projectService.getProjectDetail(userDetails.getId(), id);
        return ApiResponse.success(detail);
    }

    /**
     * 更新项目
     */
    @PutMapping("/{id}")
    public ApiResponse<Project> updateProject(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        String status = body.get("status");
        Project project = projectService.updateProject(userDetails.getId(), id, name, description, status);
        return ApiResponse.success(project);
    }

    /**
     * 删除项目（软删除）
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProject(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        projectService.deleteProject(userDetails.getId(), id);
        return ApiResponse.success("删除成功", null);
    }

    /**
     * 创建任务
     */
    @PostMapping("/{id}/tasks")
    public ApiResponse<ProjectTask> createTask(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String priority = (String) body.get("priority");
        LocalDate dueDate = body.get("dueDate") != null
                ? LocalDate.parse(body.get("dueDate").toString())
                : null;
        ProjectTask task = projectService.createTask(id, title, description, priority, dueDate);
        return ApiResponse.success(task);
    }

    /**
     * 更新任务状态
     */
    @PutMapping("/tasks/{taskId}/status")
    public ApiResponse<ProjectTask> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        ProjectTask task = projectService.updateTaskStatus(taskId, status);
        return ApiResponse.success(task);
    }

    /**
     * 删除任务
     */
    @DeleteMapping("/tasks/{taskId}")
    public ApiResponse<Void> deleteTask(
            @PathVariable Long taskId) {
        projectService.deleteTask(taskId);
        return ApiResponse.success("删除成功", null);
    }
}
