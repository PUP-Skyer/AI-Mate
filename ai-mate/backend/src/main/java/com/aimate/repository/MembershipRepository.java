package com.aimate.repository;

import com.aimate.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {

    List<Membership> findByUserId(Long userId);

    Optional<Membership> findFirstByUserIdOrderByCreatedAtDesc(Long userId);
}
