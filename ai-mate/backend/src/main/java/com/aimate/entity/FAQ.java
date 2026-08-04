package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "faqs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FAQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Column(length = 100)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Builder.Default
    private Integer viewCount = 0;

    @Builder.Default
    private Integer helpfulCount = 0;

    @Builder.Default
    private Integer sortOrder = 0;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
