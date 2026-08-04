package com.aimate.repository;

import com.aimate.entity.AiTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiTemplateRepository extends JpaRepository<AiTemplate, Long> {

    List<AiTemplate> findByStatusAndIsPublicTrueOrderBySortOrder(String status);

    List<AiTemplate> findByCategoryAndStatus(String category, String status);
}
