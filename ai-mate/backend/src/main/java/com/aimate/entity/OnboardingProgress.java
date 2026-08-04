package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "current_step", nullable = false)
    @Builder.Default
    private Integer currentStep = 0;

    @Column(name = "completed_steps", columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String completedSteps = "[]";

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "IN_PROGRESS";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
