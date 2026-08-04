package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "section_key", length = 100, nullable = false)
    private String sectionKey;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "ai_generated", nullable = false)
    @Builder.Default
    private Boolean aiGenerated = false;

    @Column(name = "order_num", nullable = false)
    @Builder.Default
    private Integer orderNum = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private SectionStatus status = SectionStatus.DRAFT;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum SectionStatus {
        DRAFT, GENERATING, EDITED
    }
}
