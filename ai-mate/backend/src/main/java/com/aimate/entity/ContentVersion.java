package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "content_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private Integer version;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String style;

    @Column(name = "word_count", nullable = false)
    @Builder.Default
    private Integer wordCount = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
