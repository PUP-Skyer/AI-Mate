package com.aimate.repository;

import com.aimate.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    List<CommunityComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);
}
