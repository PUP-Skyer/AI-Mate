package com.aimate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "collab_spaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollabSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private Integer memberCount = 1;

    @Column(name = "content_count", nullable = false)
    @Builder.Default
    private Integer contentCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private SpaceStatus status = SpaceStatus.ACTIVE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum SpaceStatus {
        ACTIVE, ARCHIVED, CLOSED
    }
}
