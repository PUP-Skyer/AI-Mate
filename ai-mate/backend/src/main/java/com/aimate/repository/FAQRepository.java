package com.aimate.repository;

import com.aimate.entity.FAQ;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {

    Page<FAQ> findByStatusOrderBySortOrderAsc(String status, Pageable pageable);

    Page<FAQ> findByCategoryAndStatusOrderBySortOrderAsc(String category, String status, Pageable pageable);

    List<FAQ> findByQuestionContainingIgnoreCaseAndStatus(String keyword, String status);

    List<FAQ> findByQuestionContainingIgnoreCaseAndCategoryAndStatus(String keyword, String category, String status);
}
