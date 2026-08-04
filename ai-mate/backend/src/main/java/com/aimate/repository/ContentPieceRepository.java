package com.aimate.repository;

import com.aimate.entity.ContentPiece;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentPieceRepository extends JpaRepository<ContentPiece, Long> {

    Page<ContentPiece> findByUserId(Long userId, Pageable pageable);

    Page<ContentPiece> findByUserIdAndType(Long userId, String type, Pageable pageable);

    Page<ContentPiece> findByUserIdAndStatus(Long userId, String status, Pageable pageable);
}
