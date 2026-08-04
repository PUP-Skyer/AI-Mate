package com.aimate.repository;

import com.aimate.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, String status);

    long countByUserIdAndStatus(Long userId, String status);
}
