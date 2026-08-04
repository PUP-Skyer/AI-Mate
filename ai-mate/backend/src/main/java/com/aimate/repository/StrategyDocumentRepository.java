package com.aimate.repository;

import com.aimate.entity.StrategyDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StrategyDocumentRepository extends JpaRepository<StrategyDocument, Long> {

    Page<StrategyDocument> findByUserId(Long userId, Pageable pageable);

    Page<StrategyDocument> findByUserIdAndStatus(Long userId, String status, Pageable pageable);
}
