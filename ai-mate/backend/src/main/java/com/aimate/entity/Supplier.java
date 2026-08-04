package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 200, nullable = false)
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String region;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String priceRange;

    @Column(columnDefinition = "TEXT")
    private String qualification;

    @Column(columnDefinition = "TEXT")
    private String contactInfo;

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Integer cooperationCount = 0;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
