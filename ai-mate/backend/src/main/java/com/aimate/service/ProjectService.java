package com.aimate.service;

import com.aimate.entity.Project;
import com.aimate.entity.ProjectTask;
import com.aimate.entity.User;
import com.aimate.exception.BusinessException;
import com.aimate.repository.ProjectRepository;
import com.aimate.repository.ProjectTaskRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final UserRepository userRepository;

    /**
     * 获取用户项目列表
     */
    @Transactional(readOnly = true)
    public List<Project> getProjects(Long userId) {
        return projectRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, "ACTIVE");
    }

    /**
     * 获取项目详情（含任务列表）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectDetail(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));

        if (!project.getUserId().equals(userId)) {
            throw new BusinessException("无权访问此项目");
        }

        List<ProjectTask> tasks = projectTaskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        Map<String, Object> detail = new HashMap<>();
        detail.put("project", project);
        detail.put("tasks", tasks);
        return detail;
    }

    /**
     * 创建项目
     */
    @Transactional
    public Project createProject(Long userId, String name, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        Project project = Project.builder()
                .user(user)
                .userId(userId)
                .name(name)
                .description(description)
                .status(Project.ProjectStatus.ACTIVE)
                .build();

        log.info("用户 {} 创建项目: {}", userId, name);
        return projectRepository.save(project);
    }

    /**
     * 更新项目
     */
    @Transactional
    public Project updateProject(Long userId, Long projectId, String name, String description, String status) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));

        if (!project.getUserId().equals(userId)) {
            throw new BusinessException("无权修改此项目");
        }

        if (name != null && !name.isBlank()) {
            project.setName(name);
        }
        if (description != null) {
            project.setDescription(description);
        }
        if (status != null && !status.isBlank()) {
            try {
                project.setStatus(Project.ProjectStatus.valueOf(status));
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的项目状态: " + status);
            }
        }

        log.info("用户 {} 更新项目: {}", userId, projectId);
        return projectRepository.save(project);
    }

    /**
     * 软删除项目
     */
    @Transactional
    public void deleteProject(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));

        if (!project.getUserId().equals(userId)) {
            throw new BusinessException("无权删除此项目");
        }

        project.setStatus(Project.ProjectStatus.DELETED);
        projectRepository.save(project);
        log.info("用户 {} 删除项目: {}", userId, projectId);
    }

    /**
     * 创建任务
     */
    @Transactional
    public ProjectTask createTask(Long projectId, String title, String description,
                                  String priority, LocalDate dueDate) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException("项目不存在"));

        ProjectTask.TaskPriority taskPriority = ProjectTask.TaskPriority.MEDIUM;
        if (priority != null && !priority.isBlank()) {
            try {
                taskPriority = ProjectTask.TaskPriority.valueOf(priority);
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的任务优先级: " + priority);
            }
        }

        ProjectTask task = ProjectTask.builder()
                .project(project)
                .projectId(projectId)
                .title(title)
                .description(description)
                .priority(taskPriority)
                .status(ProjectTask.TaskStatus.TODO)
                .dueDate(dueDate)
                .build();

        log.info("在项目 {} 中创建任务: {}", projectId, title);
        return projectTaskRepository.save(task);
    }

    /**
     * 更新任务状态
     */
    @Transactional
    public ProjectTask updateTaskStatus(Long taskId, String status) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("任务不存在"));

        try {
            task.setStatus(ProjectTask.TaskStatus.valueOf(status));
        } catch (IllegalArgumentException e) {
            throw new BusinessException("无效的任务状态: " + status);
        }

        log.info("更新任务 {} 状态为: {}", taskId, status);
        return projectTaskRepository.save(task);
    }

    /**
     * 删除任务
     */
    @Transactional
    public void deleteTask(Long taskId) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("任务不存在"));

        projectTaskRepository.delete(task);
        log.info("删除任务: {}", taskId);
    }
}
