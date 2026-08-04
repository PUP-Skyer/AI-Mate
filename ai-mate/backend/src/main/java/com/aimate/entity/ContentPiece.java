package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "content_pieces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentPiece {

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
    private ContentType type = ContentType.COPYWRITING;

    @Column(length = 50)
    private String platform;

    @Column(name = "target_audience", length = 200)
    private String targetAudience;

    @Column(name = "product_info", columnDefinition = "TEXT")
    private String productInfo;

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private Integer currentVersion = 1;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private ContentStatus status = ContentStatus.DRAFT;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ContentType {
        COPYWRITING, SOCIAL, VIDEO, PRODUCT, BRAND
    }

    public enum ContentStatus {
        DRAFT, PUBLISHED, ARCHIVED
    }
}
