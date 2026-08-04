package com.aimate.repository;

import com.aimate.entity.UsageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {

    Page<UsageLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    List<UsageLog> findByCreatedAtAfter(LocalDateTime after);
}
