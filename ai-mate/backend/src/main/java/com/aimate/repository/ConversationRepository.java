package com.aimate.repository;

import com.aimate.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUserIdAndStatusOrderByUpdatedAtDesc(Long userId, String status);

    List<Conversation> findByUserIdAndType(Long userId, String type);

    long countByUserId(Long userId);
}
