package com.aimate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "knowledge_base_id", nullable = false)
    @JsonIgnore
    private KnowledgeBase knowledgeBase;

    @Column(name = "knowledge_base_id", insertable = false, updatable = false)
    private Long knowledgeBaseId;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "file_size")
    @Builder.Default
    private Long fileSize = 0L;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "PROCESSING";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
