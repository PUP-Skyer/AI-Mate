package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "strategy_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StrategyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 200, nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private DocumentType type = DocumentType.STRATEGY;

    @Column(name = "template_id")
    private Long templateId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.DRAFT;

    @Builder.Default
    private Integer version = 1;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum DocumentType {
        STRATEGY, MARKETING, GROWTH, BENCHMARK
    }

    public enum DocumentStatus {
        DRAFT, GENERATING, COMPLETED
    }
}
