package com.aimate.service;

import com.aimate.entity.IndustryReport;
import com.aimate.entity.Supplier;
import com.aimate.exception.BusinessException;
import com.aimate.repository.IndustryReportRepository;
import com.aimate.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoutService {

    private final SupplierRepository supplierRepository;
    private final IndustryReportRepository industryReportRepository;

    /**
     * 分页获取供应商列表，支持按品类和地区筛选
     */
    @Transactional(readOnly = true)
    public Page<Supplier> getSuppliers(Long userId, String category, String region, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (category != null && !category.isBlank() && region != null && !region.isBlank()) {
            return supplierRepository.findByUserIdAndCategoryAndRegionAndStatus(userId, category, region, "ACTIVE", pageable);
        } else if (category != null && !category.isBlank()) {
            return supplierRepository.findByUserIdAndCategoryAndStatus(userId, category, "ACTIVE", pageable);
        } else if (region != null && !region.isBlank()) {
            return supplierRepository.findByUserIdAndRegionAndStatus(userId, region, "ACTIVE", pageable);
        } else {
            return supplierRepository.findByUserIdAndStatus(userId, "ACTIVE", pageable);
        }
    }

    /**
     * 获取供应商详情
     */
    @Transactional(readOnly = true)
    public Supplier getSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException("供应商不存在", HttpStatus.NOT_FOUND));
    }

    /**
     * 创建供应商
     */
    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        supplier = supplierRepository.save(supplier);
        log.info("创建供应商: id={}, name={}", supplier.getId(), supplier.getName());
        return supplier;
    }

    /**
     * 更新供应商
     */
    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplierUpdate) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException("供应商不存在", HttpStatus.NOT_FOUND));

        if (supplierUpdate.getName() != null) {
            supplier.setName(supplierUpdate.getName());
        }
        if (supplierUpdate.getCategory() != null) {
            supplier.setCategory(supplierUpdate.getCategory());
        }
        if (supplierUpdate.getRegion() != null) {
            supplier.setRegion(supplierUpdate.getRegion());
        }
        if (supplierUpdate.getDescription() != null) {
            supplier.setDescription(supplierUpdate.getDescription());
        }
        if (supplierUpdate.getPriceRange() != null) {
            supplier.setPriceRange(supplierUpdate.getPriceRange());
        }
        if (supplierUpdate.getQualification() != null) {
            supplier.setQualification(supplierUpdate.getQualification());
        }
        if (supplierUpdate.getContactInfo() != null) {
            supplier.setContactInfo(supplierUpdate.getContactInfo());
        }
        if (supplierUpdate.getRating() != null) {
            supplier.setRating(supplierUpdate.getRating());
        }
        if (supplierUpdate.getCooperationCount() != null) {
            supplier.setCooperationCount(supplierUpdate.getCooperationCount());
        }

        supplier = supplierRepository.save(supplier);
        log.info("更新供应商: id={}", id);
        return supplier;
    }

    /**
     * 软删除供应商（status=DELETED）
     */
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException("供应商不存在", HttpStatus.NOT_FOUND));

        supplier.setStatus("DELETED");
        supplierRepository.save(supplier);
        log.info("删除供应商: id={}", id);
    }

    /**
     * 关键词搜索供应商
     */
    @Transactional(readOnly = true)
    public List<Supplier> searchSuppliers(String keyword, String category, String region) {
        if (category != null && !category.isBlank() && region != null && !region.isBlank()) {
            return supplierRepository.findByNameContainingIgnoreCaseAndCategoryAndRegionAndStatus(keyword, category, region, "ACTIVE");
        } else if (category != null && !category.isBlank()) {
            return supplierRepository.findByNameContainingIgnoreCaseAndCategoryAndStatus(keyword, category, "ACTIVE");
        } else if (region != null && !region.isBlank()) {
            return supplierRepository.findByNameContainingIgnoreCaseAndRegionAndStatus(keyword, region, "ACTIVE");
        } else {
            return supplierRepository.findByNameContainingIgnoreCaseAndStatus(keyword, "ACTIVE");
        }
    }

    /**
     * 根据ID列表获取供应商用于对比
     */
    @Transactional(readOnly = true)
    public List<Supplier> compareSuppliers(List<Long> ids) {
        List<Supplier> suppliers = supplierRepository.findByIdInAndStatus(ids, "ACTIVE");
        if (suppliers.size() != ids.size()) {
            log.warn("部分供应商不存在或已删除，请求ID: {}, 实际找到: {}", ids, suppliers.size());
        }
        return suppliers;
    }

    /**
     * 分页获取行业报告
     */
    @Transactional(readOnly = true)
    public Page<IndustryReport> getReports(String industry, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishDate"));

        if (industry != null && !industry.isBlank()) {
            return industryReportRepository.findByIndustry(industry, pageable);
        } else {
            return industryReportRepository.findAllByOrderByPublishDateDesc(pageable);
        }
    }
}
