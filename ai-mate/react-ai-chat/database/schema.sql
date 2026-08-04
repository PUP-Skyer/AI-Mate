-- ============================================================
-- 青宸智汇 平台 - 完整数据库设计
-- 数据库: ai_mate
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_mate
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_mate;

-- ============================================================
-- 1. 用户系统 (User System)
-- ============================================================

-- 用户表
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL DEFAULT 'AI创业者' COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  password_hash VARCHAR(255) COMMENT '密码哈希',
  avatar VARCHAR(255) COMMENT '头像URL',
  bio TEXT COMMENT '个人简介',
  level INT UNSIGNED DEFAULT 1 COMMENT '等级',
  exp INT UNSIGNED DEFAULT 0 COMMENT '经验值',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户设置表
CREATE TABLE user_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  dark_mode TINYINT(1) DEFAULT 0 COMMENT '深色模式',
  notifications TINYINT(1) DEFAULT 1 COMMENT '消息通知',
  auto_save TINYINT(1) DEFAULT 1 COMMENT '自动保存',
  sound_effects TINYINT(1) DEFAULT 1 COMMENT '音效',
  language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_settings (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户设置表';

-- 用户认证令牌表
CREATE TABLE user_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  token VARCHAR(255) NOT NULL COMMENT '令牌',
  refresh_token VARCHAR(255) COMMENT '刷新令牌',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户认证令牌表';

-- ============================================================
-- 2. AI 对话系统 (AI Conversation System)
-- ============================================================

-- 对话表
CREATE TABLE conversations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '对话ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  title VARCHAR(200) NOT NULL DEFAULT '新对话' COMMENT '对话标题',
  type ENUM('scout', 'sage', 'maker', 'butler') NOT NULL COMMENT 'AI角色类型',
  status ENUM('active', 'archived', 'deleted') DEFAULT 'active' COMMENT '状态',
  model VARCHAR(50) DEFAULT 'zhipu' COMMENT '使用的AI模型',
  total_tokens INT UNSIGNED DEFAULT 0 COMMENT '总Token数',
  summary TEXT COMMENT '对话摘要',
  is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, type),
  INDEX idx_status (status),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话表';

-- 消息表
CREATE TABLE messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
  conversation_id INT UNSIGNED NOT NULL COMMENT '对话ID',
  role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '角色',
  content TEXT NOT NULL COMMENT '消息内容',
  content_type ENUM('text', 'image', 'file', 'markdown') DEFAULT 'text' COMMENT '内容类型',
  token_count INT UNSIGNED DEFAULT 0 COMMENT 'Token数',
  model VARCHAR(50) COMMENT '使用的模型',
  parent_id INT UNSIGNED COMMENT '父消息ID(用于分支对话)',
  is_error TINYINT(1) DEFAULT 0 COMMENT '是否错误消息',
  error_message VARCHAR(500) COMMENT '错误信息',
  metadata JSON COMMENT '额外元数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id),
  INDEX idx_role (role),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 对话标签表
CREATE TABLE conversation_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL COMMENT '对话ID',
  tag VARCHAR(50) NOT NULL COMMENT '标签',
  color VARCHAR(20) DEFAULT '#1890ff' COMMENT '标签颜色',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  UNIQUE KEY uk_conv_tag (conversation_id, tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话标签表';

-- AI 模型配置表
CREATE TABLE ai_models (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '模型名称',
  provider VARCHAR(50) NOT NULL COMMENT '提供商',
  model_id VARCHAR(100) NOT NULL COMMENT '模型ID',
  api_endpoint VARCHAR(255) COMMENT 'API端点',
  api_key_encrypted TEXT COMMENT '加密API密钥',
  max_tokens INT UNSIGNED DEFAULT 4096 COMMENT '最大Token数',
  temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT '温度参数',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  is_default TINYINT(1) DEFAULT 0 COMMENT '是否默认',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_provider_model (provider, model_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型配置表';

-- ============================================================
-- 3. 签到与奖励系统 (Sign-in & Reward System)
-- ============================================================

-- 签到记录表
CREATE TABLE sign_in_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  sign_date DATE NOT NULL COMMENT '签到日期',
  signed TINYINT(1) DEFAULT 1 COMMENT '是否签到',
  reward_type ENUM('none', 'exp', 'coin', 'pet', 'item') DEFAULT 'exp' COMMENT '奖励类型',
  reward_value INT UNSIGNED DEFAULT 10 COMMENT '奖励数值',
  consecutive_days INT UNSIGNED DEFAULT 1 COMMENT '连续签到天数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_date (user_id, sign_date),
  INDEX idx_sign_date (sign_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到记录表';

-- 签到奖励配置表
CREATE TABLE sign_in_rewards (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  day_number INT UNSIGNED NOT NULL COMMENT '第几天',
  reward_type ENUM('exp', 'coin', 'pet', 'item', 'blind_box') NOT NULL COMMENT '奖励类型',
  reward_value INT UNSIGNED DEFAULT 0 COMMENT '奖励数值',
  pet_id VARCHAR(50) COMMENT '桌宠ID(如果是桌宠奖励)',
  description VARCHAR(200) COMMENT '奖励描述',
  is_special TINYINT(1) DEFAULT 0 COMMENT '是否是特殊奖励(7天/30天)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_day (day_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到奖励配置表';

-- 桌宠表
CREATE TABLE desk_pets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  pet_id VARCHAR(50) NOT NULL COMMENT '宠物模板ID',
  name VARCHAR(50) NOT NULL COMMENT '宠物名称',
  rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL COMMENT '稀有度',
  image VARCHAR(20) NOT NULL COMMENT '表情符号/图片',
  description TEXT COMMENT '描述',
  level INT UNSIGNED DEFAULT 1 COMMENT '等级',
  exp INT UNSIGNED DEFAULT 0 COMMENT '经验值',
  is_favorite TINYINT(1) DEFAULT 0 COMMENT '是否收藏',
  is_active TINYINT(1) DEFAULT 0 COMMENT '是否激活展示',
  obtained_from ENUM('sign_in', 'blind_box', 'event', 'trade') DEFAULT 'sign_in' COMMENT '获得来源',
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '获得时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_rarity (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='桌宠表';

-- 桌宠模板表
CREATE TABLE desk_pet_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pet_id VARCHAR(50) NOT NULL UNIQUE COMMENT '宠物模板ID',
  name VARCHAR(50) NOT NULL COMMENT '名称',
  rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL COMMENT '稀有度',
  image VARCHAR(20) NOT NULL COMMENT '表情符号',
  description TEXT COMMENT '描述',
  probability DECIMAL(5,4) NOT NULL COMMENT '抽取概率',
  max_level INT UNSIGNED DEFAULT 10 COMMENT '最大等级',
  skill_name VARCHAR(100) COMMENT '技能名称',
  skill_description TEXT COMMENT '技能描述',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='桌宠模板表';

-- 盲盒记录表
CREATE TABLE blind_box_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  pet_id VARCHAR(50) NOT NULL COMMENT '获得的宠物ID',
  pet_name VARCHAR(50) NOT NULL COMMENT '宠物名称',
  rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL COMMENT '稀有度',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开启时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盲盒记录表';

-- 用户积分/货币表
CREATE TABLE user_currencies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  coin INT UNSIGNED DEFAULT 0 COMMENT '金币',
  diamond INT UNSIGNED DEFAULT 0 COMMENT '钻石',
  energy INT UNSIGNED DEFAULT 100 COMMENT '能量值',
  max_energy INT UNSIGNED DEFAULT 100 COMMENT '最大能量',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_currency (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户货币表';

-- ============================================================
-- 4. 社区系统 (Community System)
-- ============================================================

-- 帖子表
CREATE TABLE posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '作者ID',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '内容',
  category ENUM('discussion', 'question', 'share', 'tutorial', 'news') DEFAULT 'discussion' COMMENT '分类',
  tags JSON COMMENT '标签',
  cover_image VARCHAR(255) COMMENT '封面图',
  view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览数',
  like_count INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  comment_count INT UNSIGNED DEFAULT 0 COMMENT '评论数',
  is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
  is_essential TINYINT(1) DEFAULT 0 COMMENT '是否精华',
  status ENUM('draft', 'published', 'hidden', 'deleted') DEFAULT 'published' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子表';

-- 评论表
CREATE TABLE comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NOT NULL COMMENT '帖子ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  parent_id INT UNSIGNED COMMENT '父评论ID(回复)',
  content TEXT NOT NULL COMMENT '内容',
  like_count INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  is_accepted TINYINT(1) DEFAULT 0 COMMENT '是否被采纳(问答帖)',
  status ENUM('active', 'hidden', 'deleted') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- 点赞表
CREATE TABLE likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  target_type ENUM('post', 'comment', 'resource') NOT NULL COMMENT '目标类型',
  target_id INT UNSIGNED NOT NULL COMMENT '目标ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_target (user_id, target_type, target_id),
  INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';

-- 活动表
CREATE TABLE activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '活动标题',
  description TEXT COMMENT '活动描述',
  cover_image VARCHAR(255) COMMENT '封面图',
  start_time TIMESTAMP NOT NULL COMMENT '开始时间',
  end_time TIMESTAMP NOT NULL COMMENT '结束时间',
  location VARCHAR(200) COMMENT '地点',
  max_participants INT UNSIGNED COMMENT '最大参与人数',
  current_participants INT UNSIGNED DEFAULT 0 COMMENT '当前参与人数',
  status ENUM('upcoming', 'ongoing', 'ended', 'cancelled') DEFAULT 'upcoming' COMMENT '状态',
  created_by INT UNSIGNED NOT NULL COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动表';

-- 活动参与表
CREATE TABLE activity_participants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id INT UNSIGNED NOT NULL COMMENT '活动ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  status ENUM('registered', 'attended', 'absent', 'cancelled') DEFAULT 'registered' COMMENT '参与状态',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_activity_user (activity_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='活动参与表';

-- ============================================================
-- 5. 资源平台系统 (Resource Platform)
-- ============================================================

-- 资源表
CREATE TABLE resources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '上传者ID',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  description TEXT COMMENT '描述',
  category ENUM('template', 'tool', 'document', 'course', 'other') NOT NULL COMMENT '分类',
  type ENUM('file', 'link', 'code') DEFAULT 'file' COMMENT '类型',
  file_url VARCHAR(255) COMMENT '文件URL',
  file_size BIGINT UNSIGNED COMMENT '文件大小(字节)',
  file_format VARCHAR(50) COMMENT '文件格式',
  download_count INT UNSIGNED DEFAULT 0 COMMENT '下载次数',
  view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
  rating DECIMAL(2,1) DEFAULT 5.0 COMMENT '评分',
  rating_count INT UNSIGNED DEFAULT 0 COMMENT '评分人数',
  tags JSON COMMENT '标签',
  is_free TINYINT(1) DEFAULT 1 COMMENT '是否免费',
  price DECIMAL(10,2) DEFAULT 0.00 COMMENT '价格',
  status ENUM('pending', 'approved', 'rejected', 'deleted') DEFAULT 'pending' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表';

-- 资源下载记录表
CREATE TABLE resource_downloads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_id INT UNSIGNED NOT NULL COMMENT '资源ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_resource_user (resource_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源下载记录表';

-- 资源评分表
CREATE TABLE resource_ratings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resource_id INT UNSIGNED NOT NULL COMMENT '资源ID',
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  rating TINYINT UNSIGNED NOT NULL COMMENT '评分1-5',
  comment TEXT COMMENT '评价内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_resource_user_rating (resource_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源评分表';

-- ============================================================
-- 6. 数据看板系统 (Dashboard System)
-- ============================================================

-- 用户行为日志表
CREATE TABLE user_actions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  action_type VARCHAR(50) NOT NULL COMMENT '行为类型',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT UNSIGNED COMMENT '目标ID',
  metadata JSON COMMENT '额外数据',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent VARCHAR(500) COMMENT '用户代理',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_action (user_id, action_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户行为日志表';

-- 系统统计表
CREATE TABLE system_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stat_date DATE NOT NULL COMMENT '统计日期',
  new_users INT UNSIGNED DEFAULT 0 COMMENT '新用户数',
  active_users INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
  total_conversations INT UNSIGNED DEFAULT 0 COMMENT '总对话数',
  total_messages INT UNSIGNED DEFAULT 0 COMMENT '总消息数',
  total_sign_ins INT UNSIGNED DEFAULT 0 COMMENT '总签到数',
  total_resources INT UNSIGNED DEFAULT 0 COMMENT '总资源数',
  total_posts INT UNSIGNED DEFAULT 0 COMMENT '总帖子数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统统计表';

-- ============================================================
-- 7. 通知系统 (Notification System)
-- ============================================================

-- 通知表
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '接收者ID',
  sender_id INT UNSIGNED COMMENT '发送者ID',
  type ENUM('system', 'message', 'like', 'comment', 'follow', 'mention', 'reward') NOT NULL COMMENT '类型',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT COMMENT '内容',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT UNSIGNED COMMENT '目标ID',
  is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
  read_at TIMESTAMP NULL COMMENT '阅读时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';

-- ============================================================
-- 8. 成就系统 (Achievement System)
-- ============================================================

-- 成就模板表
CREATE TABLE achievement_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '成就代码',
  name VARCHAR(100) NOT NULL COMMENT '成就名称',
  description TEXT COMMENT '成就描述',
  icon VARCHAR(50) COMMENT '图标',
  category ENUM('sign_in', 'conversation', 'community', 'resource', 'special') NOT NULL COMMENT '分类',
  requirement_type VARCHAR(50) NOT NULL COMMENT '要求类型',
  requirement_value INT UNSIGNED NOT NULL COMMENT '要求数值',
  reward_exp INT UNSIGNED DEFAULT 0 COMMENT '奖励经验值',
  reward_coin INT UNSIGNED DEFAULT 0 COMMENT '奖励金币',
  is_hidden TINYINT(1) DEFAULT 0 COMMENT '是否隐藏成就',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就模板表';

-- 用户成就表
CREATE TABLE user_achievements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
  achievement_id INT UNSIGNED NOT NULL COMMENT '成就ID',
  progress INT UNSIGNED DEFAULT 0 COMMENT '当前进度',
  is_completed TINYINT(1) DEFAULT 0 COMMENT '是否完成',
  completed_at TIMESTAMP NULL COMMENT '完成时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievement_templates(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 插入默认用户
INSERT INTO users (id, username, email, level, exp) VALUES
  (1, 'AI创业者', 'demo@aimate.com', 1, 0);

-- 插入用户设置
INSERT INTO user_settings (user_id) VALUES (1);

-- 插入用户货币
INSERT INTO user_currencies (user_id) VALUES (1);

-- 插入桌宠模板
INSERT INTO desk_pet_templates (pet_id, name, rarity, image, description, probability, skill_name, skill_description) VALUES
  ('pet-1', '小智猫', 'common', '🐱', '聪明伶俐的小猫咪，喜欢趴在键盘上', 0.35, '键盘守护', '提高代码编写效率'),
  ('pet-2', '代码狗', 'common', '🐶', '忠诚的编程伙伴，会帮你找bug', 0.30, 'Bug嗅探', '自动发现代码中的错误'),
  ('pet-3', '数据兔', 'common', '🐰', '跳来跳去的小兔子，对数据很敏感', 0.20, '数据直觉', '提高数据分析准确度'),
  ('pet-4', '云端鸟', 'rare', '🐦', '在云端翱翔的小鸟，带来好灵感', 0.08, '灵感闪现', '增加创意生成概率'),
  ('pet-5', '芯片鼠', 'rare', '🐹', '藏在电路板里的小家伙，跑得飞快', 0.05, '极速运算', '加快处理速度'),
  ('pet-6', '算法狐', 'epic', '🦊', '狡猾又聪明的狐狸，精通各种算法', 0.015, '算法精通', '优化算法效率'),
  ('pet-7', '网络龙', 'epic', '🐉', '守护网络安全的神龙，威风凛凛', 0.005, '安全防护', '提升系统安全性'),
  ('pet-8', 'AI凤凰', 'legendary', '🦅', '传说中的AI之凰，拥有无限智慧', 0.0005, '智慧之光', '大幅提升AI回答质量');

-- 插入签到奖励配置
INSERT INTO sign_in_rewards (day_number, reward_type, reward_value, description, is_special) VALUES
  (1, 'exp', 10, '第1天签到奖励', 0),
  (2, 'exp', 15, '第2天签到奖励', 0),
  (3, 'exp', 20, '第3天签到奖励', 0),
  (4, 'exp', 25, '第4天签到奖励', 0),
  (5, 'exp', 30, '第5天签到奖励', 0),
  (6, 'exp', 40, '第6天签到奖励', 0),
  (7, 'blind_box', 1, '连续7天盲盒奖励', 1),
  (14, 'blind_box', 1, '连续14天盲盒奖励', 1),
  (21, 'blind_box', 1, '连续21天盲盒奖励', 1),
  (30, 'blind_box', 2, '连续30天超级盲盒', 1);

-- 插入AI模型配置
INSERT INTO ai_models (name, provider, model_id, max_tokens, temperature, is_default) VALUES
  ('智谱GLM-4', 'zhipu', 'glm-4', 8192, 0.7, 1),
  ('智谱GLM-4-Flash', 'zhipu', 'glm-4-flash', 4096, 0.8, 0),
  ('智谱GLM-4-Air', 'zhipu', 'glm-4-air', 4096, 0.7, 0);

-- 插入成就模板
INSERT INTO achievement_templates (code, name, description, icon, category, requirement_type, requirement_value, reward_exp, reward_coin) VALUES
  ('first_sign', '初次签到', '完成第一次签到', '📅', 'sign_in', 'sign_in_count', 1, 10, 5),
  ('week_warrior', '周签到达人', '连续签到7天', '🔥', 'sign_in', 'consecutive_sign_in', 7, 50, 20),
  ('month_master', '月签到大师', '连续签到30天', '👑', 'sign_in', 'consecutive_sign_in', 30, 200, 100),
  ('first_chat', '初次对话', '发起第一次AI对话', '💬', 'conversation', 'conversation_count', 1, 10, 5),
  ('chat_master', '对话达人', '累计发起100次AI对话', '🗣️', 'conversation', 'conversation_count', 100, 100, 50),
  ('first_post', '初次发帖', '发布第一个社区帖子', '📝', 'community', 'post_count', 1, 20, 10),
  ('popular_post', '热门帖子', '帖子获得100个赞', '🔥', 'community', 'post_likes', 100, 50, 30),
  ('first_resource', '初次分享', '上传第一个资源', '📦', 'resource', 'resource_count', 1, 20, 10),
  ('collector', '收藏家', '收集5只桌宠', '🐾', 'special', 'pet_count', 5, 100, 50),
  ('legendary_hunter', '传说猎人', '获得1只传说级桌宠', '🏆', 'special', 'legendary_pet', 1, 500, 200);
