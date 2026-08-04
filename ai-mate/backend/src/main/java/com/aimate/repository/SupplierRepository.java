package com.aimate.repository;

import com.aimate.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Page<Supplier> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    Page<Supplier> findByUserIdAndCategoryAndStatus(Long userId, String category, String status, Pageable pageable);

    Page<Supplier> findByUserIdAndRegionAndStatus(Long userId, String region, String status, Pageable pageable);

    Page<Supplier> findByUserIdAndCategoryAndRegionAndStatus(Long userId, String category, String region, String status, Pageable pageable);

    List<Supplier> findByNameContainingIgnoreCaseAndStatus(String keyword, String status);

    List<Supplier> findByNameContainingIgnoreCaseAndCategoryAndStatus(String keyword, String category, String status);

    List<Supplier> findByNameContainingIgnoreCaseAndRegionAndStatus(String keyword, String region, String status);

    List<Supplier> findByNameContainingIgnoreCaseAndCategoryAndRegionAndStatus(String keyword, String category, String region, String status);

    List<Supplier> findByIdInAndStatus(List<Long> ids, String status);
}
