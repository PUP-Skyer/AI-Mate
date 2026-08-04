package com.aimate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_favorites",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "target_type", "target_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @Column(name = "target_type", length = 30, nullable = false)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
