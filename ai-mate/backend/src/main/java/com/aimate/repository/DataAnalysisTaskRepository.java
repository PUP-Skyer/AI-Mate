package com.aimate.repository;

import com.aimate.entity.DataAnalysisTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataAnalysisTaskRepository extends JpaRepository<DataAnalysisTask, Long> {

    List<DataAnalysisTask> findByUserId(Long userId);
}
