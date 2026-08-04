-- ============================================================
-- AI Mate Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_mate
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_mate;

-- -----------------------------------------------------------
-- 1. users - 用户表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    phone           VARCHAR(20)     DEFAULT NULL COMMENT '手机号',
    email           VARCHAR(100)    DEFAULT NULL COMMENT '邮箱',
    password        VARCHAR(255)    NOT NULL COMMENT '密码(BCrypt加密)',
    nickname        VARCHAR(50)     DEFAULT NULL COMMENT '昵称',
    avatar          VARCHAR(500)    DEFAULT NULL COMMENT '头像URL',
    role            VARCHAR(20)     NOT NULL DEFAULT 'USER' COMMENT '角色: USER, ADMIN, VIP',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, INACTIVE, BANNED',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_phone (phone),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_status (status),
    KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -----------------------------------------------------------
-- 2. user_profiles - 用户画像表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '画像ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    stage           VARCHAR(50)     DEFAULT NULL COMMENT '创业阶段: idea, mvp, growth, mature',
    industry        VARCHAR(100)    DEFAULT NULL COMMENT '行业领域',
    product_type    VARCHAR(100)    DEFAULT NULL COMMENT '产品类型',
    team_size       VARCHAR(50)     DEFAULT NULL COMMENT '团队规模',
    preferences     TEXT            DEFAULT NULL COMMENT '偏好设置(JSON格式)',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_profiles_user_id (user_id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户画像表';

-- -----------------------------------------------------------
-- 3. memberships - 会员表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS memberships (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '会员ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    type            VARCHAR(20)     NOT NULL COMMENT '会员类型: FREE, BASIC, PRO, ENTERPRISE',
    start_date      DATE            NOT NULL COMMENT '开始日期',
    end_date        DATE            NOT NULL COMMENT '结束日期',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, EXPIRED, CANCELLED',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_memberships_user_id (user_id),
    KEY idx_memberships_status (status),
    CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- -----------------------------------------------------------
-- 4. conversations - 对话表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '对话ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    title           VARCHAR(200)    NOT NULL DEFAULT '新对话' COMMENT '对话标题',
    type            VARCHAR(30)     NOT NULL DEFAULT 'general' COMMENT '对话类型: general, brainstorm, analysis, review',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, ARCHIVED, DELETED',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_conversations_user_id (user_id),
    KEY idx_conversations_type (type),
    KEY idx_conversations_status (status),
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话表';

-- -----------------------------------------------------------
-- 5. messages - 消息表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '消息ID',
    conversation_id BIGINT          NOT NULL COMMENT '对话ID',
    role            VARCHAR(20)     NOT NULL COMMENT '角色: user, assistant, system',
    content         TEXT            NOT NULL COMMENT '消息内容',
    token_count     INT             DEFAULT 0 COMMENT 'Token消耗数',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_messages_conversation_id (conversation_id),
    KEY idx_messages_created_at (created_at),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- -----------------------------------------------------------
-- 6. knowledge_bases - 知识库表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '知识库ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    name            VARCHAR(100)    NOT NULL COMMENT '知识库名称',
    description     VARCHAR(500)    DEFAULT NULL COMMENT '描述',
    file_count      INT             NOT NULL DEFAULT 0 COMMENT '文件数量',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, PROCESSING, ERROR, DELETED',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_knowledge_bases_user_id (user_id),
    CONSTRAINT fk_knowledge_bases_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库表';

-- -----------------------------------------------------------
-- 7. knowledge_documents - 知识库文档表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id                  BIGINT          NOT NULL AUTO_INCREMENT COMMENT '文档ID',
    knowledge_base_id   BIGINT          NOT NULL COMMENT '知识库ID',
    file_name           VARCHAR(255)    NOT NULL COMMENT '文件名',
    file_path           VARCHAR(500)    NOT NULL COMMENT '文件存储路径',
    file_size           BIGINT          DEFAULT 0 COMMENT '文件大小(字节)',
    file_type           VARCHAR(50)     DEFAULT NULL COMMENT '文件类型: pdf, docx, txt, md',
    chunk_count         INT             DEFAULT 0 COMMENT '分块数量',
    status              VARCHAR(20)     NOT NULL DEFAULT 'PROCESSING' COMMENT '状态: PROCESSING, READY, ERROR, DELETED',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_knowledge_documents_kb_id (knowledge_base_id),
    CONSTRAINT fk_knowledge_documents_kb FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档表';

-- -----------------------------------------------------------
-- 8. projects - 项目表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '项目ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    name            VARCHAR(100)    NOT NULL COMMENT '项目名称',
    description     TEXT            DEFAULT NULL COMMENT '项目描述',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, COMPLETED, ARCHIVED, DELETED',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_projects_user_id (user_id),
    KEY idx_projects_status (status),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- -----------------------------------------------------------
-- 9. project_tasks - 项目任务表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_tasks (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '任务ID',
    project_id      BIGINT          NOT NULL COMMENT '项目ID',
    title           VARCHAR(200)    NOT NULL COMMENT '任务标题',
    description     TEXT            DEFAULT NULL COMMENT '任务描述',
    priority        VARCHAR(10)     NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级: LOW, MEDIUM, HIGH, URGENT',
    status          VARCHAR(20)     NOT NULL DEFAULT 'TODO' COMMENT '状态: TODO, IN_PROGRESS, DONE, CANCELLED',
    due_date        DATE            DEFAULT NULL COMMENT '截止日期',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_tasks_project_id (project_id),
    KEY idx_project_tasks_status (status),
    CONSTRAINT fk_project_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目任务表';

-- -----------------------------------------------------------
-- 10. ai_templates - AI模板表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_templates (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '模板ID',
    name            VARCHAR(100)    NOT NULL COMMENT '模板名称',
    category        VARCHAR(50)     NOT NULL COMMENT '分类: business_plan, market_analysis, product_design, etc.',
    description     VARCHAR(500)    DEFAULT NULL COMMENT '模板描述',
    system_prompt   TEXT            NOT NULL COMMENT '系统提示词',
    user_prompt     TEXT            DEFAULT NULL COMMENT '用户提示词模板',
    icon            VARCHAR(200)    DEFAULT NULL COMMENT '图标URL',
    sort_order      INT             NOT NULL DEFAULT 0 COMMENT '排序序号',
    is_public       TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '是否公开',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, INACTIVE',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_ai_templates_category (category),
    KEY idx_ai_templates_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模板表';

-- -----------------------------------------------------------
-- 11. user_favorites - 用户收藏表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_favorites (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    target_type     VARCHAR(30)     NOT NULL COMMENT '收藏类型: conversation, template, knowledge',
    target_id       BIGINT          NOT NULL COMMENT '目标ID',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_favorites (user_id, target_type, target_id),
    KEY idx_user_favorites_user_id (user_id),
    CONSTRAINT fk_user_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- -----------------------------------------------------------
-- 12. usage_logs - 使用记录表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    action          VARCHAR(50)     NOT NULL COMMENT '操作类型: chat, template, knowledge_query, export',
    token_input     INT             DEFAULT 0 COMMENT '输入Token数',
    token_output    INT             DEFAULT 0 COMMENT '输出Token数',
    model           VARCHAR(50)     DEFAULT NULL COMMENT '使用的模型',
    duration_ms     BIGINT          DEFAULT NULL COMMENT '耗时(毫秒)',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_usage_logs_user_id (user_id),
    KEY idx_usage_logs_action (action),
    KEY idx_usage_logs_created_at (created_at),
    CONSTRAINT fk_usage_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用记录表';

-- -----------------------------------------------------------
-- 13. feedback - 用户反馈表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '反馈ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    type            VARCHAR(20)     NOT NULL COMMENT '反馈类型: bug, suggestion, complaint, praise',
    content         TEXT            NOT NULL COMMENT '反馈内容',
    contact         VARCHAR(100)    DEFAULT NULL COMMENT '联系方式',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING, PROCESSING, RESOLVED, CLOSED',
    reply           TEXT            DEFAULT NULL COMMENT '回复内容',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_feedback_user_id (user_id),
    KEY idx_feedback_type (type),
    KEY idx_feedback_status (status),
    CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

-- -----------------------------------------------------------
-- 14. notifications - 通知表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    user_id         BIGINT          NOT NULL COMMENT '用户ID',
    title           VARCHAR(200)    NOT NULL COMMENT '通知标题',
    content         TEXT            DEFAULT NULL COMMENT '通知内容',
    type            VARCHAR(30)     NOT NULL DEFAULT 'SYSTEM' COMMENT '类型: SYSTEM, MEMBERSHIP, TASK, REMINDER',
    is_read         TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否已读',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_notifications_user_id (user_id),
    KEY idx_notifications_is_read (is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- -----------------------------------------------------------
-- 15. system_configs - 系统配置表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_configs (
    id              BIGINT          NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    config_key      VARCHAR(100)    NOT NULL COMMENT '配置键',
    config_value    TEXT            DEFAULT NULL COMMENT '配置值',
    description     VARCHAR(255)    DEFAULT NULL COMMENT '配置描述',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_system_configs_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- -----------------------------------------------------------
-- 初始数据：系统配置
-- -----------------------------------------------------------
INSERT INTO system_configs (config_key, config_value, description) VALUES
('ai_model_default', 'gpt-4o-mini', '默认AI模型'),
('ai_model_pro', 'gpt-4o', 'Pro用户AI模型'),
('free_daily_limit', '50', '免费用户每日对话次数限制'),
('basic_daily_limit', '200', 'Basic会员每日对话次数限制'),
('pro_daily_limit', '1000', 'Pro会员每日对话次数限制'),
('max_file_size_mb', '10', '最大上传文件大小(MB)'),
('max_knowledge_bases', '5', '免费用户最大知识库数量'),
('site_name', 'AI Mate', '站点名称'),
('site_description', 'AI驱动的创业助手平台', '站点描述');
