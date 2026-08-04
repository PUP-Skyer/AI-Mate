package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "industry_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndustryReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 300, nullable = false)
    private String title;

    @Column(length = 100)
    private String industry;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDate publishDate;

    @Column(length = 200)
    private String source;

    @Column(name = "knowledge_base_id")
    private Long knowledgeBaseId;

    @Builder.Default
    private Integer viewCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
