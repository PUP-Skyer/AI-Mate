package com.aimate.repository;

import com.aimate.entity.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    List<ProjectTask> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<ProjectTask> findByProjectIdAndStatus(Long projectId, String status);
}
