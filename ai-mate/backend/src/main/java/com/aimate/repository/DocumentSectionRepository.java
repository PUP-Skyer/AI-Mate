package com.aimate.repository;

import com.aimate.entity.DocumentSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentSectionRepository extends JpaRepository<DocumentSection, Long> {

    List<DocumentSection> findByDocumentIdOrderByOrderNum(Long documentId);
}
