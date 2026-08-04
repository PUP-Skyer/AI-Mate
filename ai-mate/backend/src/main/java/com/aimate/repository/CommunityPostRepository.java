package com.aimate.repository;

import com.aimate.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    Page<CommunityPost> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<CommunityPost> findByCategoryAndStatus(String category, String status, Pageable pageable);

    Page<CommunityPost> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    long countByStatus(String status);

    Page<CommunityPost> findByTitleContainingAndStatus(String keyword, String status, Pageable pageable);
}
