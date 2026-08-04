package com.aimate.repository;

import com.aimate.entity.UserFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    List<UserFavorite> findByUserIdAndTargetType(Long userId, String targetType);

    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, Long targetId);
}
