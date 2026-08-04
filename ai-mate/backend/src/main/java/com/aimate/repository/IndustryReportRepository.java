package com.aimate.repository;

import com.aimate.entity.IndustryReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IndustryReportRepository extends JpaRepository<IndustryReport, Long> {

    Page<IndustryReport> findByIndustry(String industry, Pageable pageable);

    Page<IndustryReport> findAllByOrderByPublishDateDesc(Pageable pageable);
}
