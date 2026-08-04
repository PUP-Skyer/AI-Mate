package com.aimate.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "usage_logs")
public class UsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @Column(length = 50, nullable = false)
    private String action;

    @Column(name = "token_input")
    private Integer tokenInput = 0;

    @Column(name = "token_output")
    private Integer tokenOutput = 0;

    @Column(length = 50)
    private String model;

    @Column(name = "duration_ms")
    private Long durationMs = 0L;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public UsageLog() {
    }

    public UsageLog(Long id, User user, Long userId, String action, Integer tokenInput, Integer tokenOutput, String model, Long durationMs, LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.userId = userId;
        this.action = action;
        this.tokenInput = tokenInput;
        this.tokenOutput = tokenOutput;
        this.model = model;
        this.durationMs = durationMs;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Integer getTokenInput() {
        return tokenInput;
    }

    public void setTokenInput(Integer tokenInput) {
        this.tokenInput = tokenInput;
    }

    public Integer getTokenOutput() {
        return tokenOutput;
    }

    public void setTokenOutput(Integer tokenOutput) {
        this.tokenOutput = tokenOutput;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
