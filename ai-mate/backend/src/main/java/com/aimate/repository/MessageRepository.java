package com.aimate.repository;

import com.aimate.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    long countByConversationId(Long conversationId);

    void deleteByConversationId(Long conversationId);
}
