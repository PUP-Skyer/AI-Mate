package com.aimate.repository;

import com.aimate.entity.OnboardingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingProgressRepository extends JpaRepository<OnboardingProgress, Long> {

    Optional<OnboardingProgress> findByUserId(Long userId);
}
