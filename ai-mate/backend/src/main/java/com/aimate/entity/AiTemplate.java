package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 50, nullable = false)
    private String category;

    @Column(length = 500)
    private String description;

    @Column(name = "system_prompt", columnDefinition = "TEXT", nullable = false)
    private String systemPrompt;

    @Column(name = "user_prompt", columnDefinition = "TEXT")
    private String userPrompt;

    @Column(length = 200)
    private String icon;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
