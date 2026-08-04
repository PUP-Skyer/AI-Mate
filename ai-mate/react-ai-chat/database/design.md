# 青宸智汇 平台数据库设计文档

## 一、概述

- **数据库名称**: `ai_mate`
- **字符集**: `utf8mb4` (支持emoji和中文)
- **存储引擎**: `InnoDB` (支持事务和外键)
- **设计原则**: 规范化设计，适度反规范化以提升查询性能

## 二、表结构总览

| 模块 | 表名 | 说明 |
|------|------|------|
| 用户系统 | `users` | 用户基础信息 |
| | `user_settings` | 用户个性化设置 |
| | `user_tokens` | 用户认证令牌 |
| | `user_currencies` | 用户虚拟货币 |
| AI对话 | `conversations` | 对话记录 |
| | `messages` | 消息记录 |
| | `conversation_tags` | 对话标签 |
| | `ai_models` | AI模型配置 |
| 签到奖励 | `sign_in_records` | 签到记录 |
| | `sign_in_rewards` | 签到奖励配置 |
| | `desk_pets` | 用户桌宠 |
| | `desk_pet_templates` | 桌宠模板 |
| | `blind_box_records` | 盲盒开启记录 |
| 社区 | `posts` | 帖子 |
| | `comments` | 评论 |
| | `likes` | 点赞 |
| | `activities` | 活动 |
| | `activity_participants` | 活动参与 |
| 资源 | `resources` | 资源 |
| | `resource_downloads` | 下载记录 |
| | `resource_ratings` | 评分记录 |
| 数据看板 | `user_actions` | 用户行为日志 |
| | `system_stats` | 系统统计 |
| 通知 | `notifications` | 通知消息 |
| 成就 | `achievement_templates` | 成就模板 |
| | `user_achievements` | 用户成就 |

## 三、详细表结构

### 1. 用户系统

#### users (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键，自增 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱，唯一 |
| phone | VARCHAR(20) | 手机号，唯一 |
| password_hash | VARCHAR(255) | 密码哈希 |
| avatar | VARCHAR(255) | 头像URL |
| bio | TEXT | 个人简介 |
| level | INT UNSIGNED | 等级(默认1) |
| exp | INT UNSIGNED | 经验值 |
| status | TINYINT | 状态: 0-禁用, 1-正常 |
| last_login_at | TIMESTAMP | 最后登录时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### user_settings (用户设置表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 用户ID(外键) |
| dark_mode | TINYINT(1) | 深色模式 |
| notifications | TINYINT(1) | 消息通知 |
| auto_save | TINYINT(1) | 自动保存 |
| sound_effects | TINYINT(1) | 音效 |
| language | VARCHAR(10) | 语言(默认zh-CN) |

#### user_currencies (用户货币表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 用户ID(外键) |
| coin | INT UNSIGNED | 金币 |
| diamond | INT UNSIGNED | 钻石 |
| energy | INT UNSIGNED | 能量值 |
| max_energy | INT UNSIGNED | 最大能量 |

### 2. AI 对话系统

#### conversations (对话表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 用户ID(外键) |
| title | VARCHAR(200) | 对话标题 |
| type | ENUM | AI角色: scout/sage/maker/butler |
| status | ENUM | 状态: active/archived/deleted |
| model | VARCHAR(50) | 使用的AI模型 |
| total_tokens | INT UNSIGNED | 总Token数 |
| is_pinned | TINYINT(1) | 是否置顶 |

#### messages (消息表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| conversation_id | INT UNSIGNED | 对话ID(外键) |
| role | ENUM | 角色: user/assistant/system |
| content | TEXT | 消息内容 |
| content_type | ENUM | 类型: text/image/file/markdown |
| token_count | INT UNSIGNED | Token数 |
| parent_id | INT UNSIGNED | 父消息ID(分支对话) |
| metadata | JSON | 额外元数据 |

### 3. 签到与奖励系统

#### sign_in_records (签到记录表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 用户ID |
| sign_date | DATE | 签到日期 |
| signed | TINYINT(1) | 是否签到 |
| consecutive_days | INT UNSIGNED | 连续签到天数 |

#### desk_pets (桌宠表)
| 字段 | 类型 | 说明 |
|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 用户ID |
| pet_id | VARCHAR(50) | 宠物模板ID |
| name | VARCHAR(50) | 名称 |
| rarity | ENUM | 稀有度: common/rare/epic/legendary |
| level | INT UNSIGNED | 等级(默认1) |
| exp | INT UNSIGNED | 经验值 |
| is_active | TINYINT(1) | 是否激活展示 |
| obtained_from | ENUM | 来源: sign_in/blind_box/event/trade |

#### desk_pet_templates (桌宠模板表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| pet_id | VARCHAR(50) | 模板ID(唯一) |
| name | VARCHAR(50) | 名称 |
| rarity | ENUM | 稀有度 |
| probability | DECIMAL(5,4) | 抽取概率 |
| skill_name | VARCHAR(100) | 技能名称 |
| skill_description | TEXT | 技能描述 |

### 4. 社区系统

#### posts (帖子表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 作者ID |
| title | VARCHAR(200) | 标题 |
| content | TEXT | 内容 |
| category | ENUM | 分类: discussion/question/share/tutorial/news |
| view_count | INT UNSIGNED | 浏览数 |
| like_count | INT UNSIGNED | 点赞数 |
| is_pinned | TINYINT(1) | 是否置顶 |
| is_essential | TINYINT(1) | 是否精华 |
| status | ENUM | 状态 |

#### comments (评论表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| post_id | INT UNSIGNED | 帖子ID |
| user_id | INT UNSIGNED | 用户ID |
| parent_id | INT UNSIGNED | 父评论ID(回复) |
| content | TEXT | 内容 |
| is_accepted | TINYINT(1) | 是否被采纳 |

### 5. 资源平台

#### resources (资源表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED | 主键 |
| user_id | INT UNSIGNED | 上传者ID |
| title | VARCHAR(200) | 标题 |
| category | ENUM | 分类: template/tool/document/course/other |
| type | ENUM | 类型: file/link/code |
| file_url | VARCHAR(255) | 文件URL |
| download_count | INT UNSIGNED | 下载次数 |
| rating | DECIMAL(2,1) | 评分 |
| is_free | TINYINT(1) | 是否免费 |
| price | DECIMAL(10,2) | 价格 |
| status | ENUM | 状态: pending/approved/rejected/deleted |

## 四、ER 关系图

```
users (1) ────< (N) conversations
      │
      ├────< (N) messages (通过conversations间接)
      ├────< (1) user_settings
      ├────< (1) user_currencies
      ├────< (N) sign_in_records
      ├────< (N) desk_pets
      ├────< (N) posts
      ├────< (N) comments
      ├────< (N) resources
      ├────< (N) notifications
      ├────< (N) user_achievements
      └────< (N) user_actions

posts (1) ────< (N) comments
     │
     └────< (N) likes

resources (1) ────< (N) resource_downloads
         │
         └────< (N) resource_ratings

activities (1) ────< (N) activity_participants

achievement_templates (1) ────< (N) user_achievements
```

## 五、索引设计

### 高频查询索引
- `users`: email, phone, status
- `conversations`: user_id + type, status, updated_at
- `messages`: conversation_id, created_at
- `posts`: category, status, created_at (倒序)
- `sign_in_records`: user_id + sign_date (唯一)

### 全文索引
- `posts`: title + content (FULLTEXT)

## 六、数据初始化

系统启动时会自动创建：
1. 默认用户 (ID=1)
2. 默认设置
3. 8种桌宠模板 (含概率)
4. 签到奖励配置 (7/14/21/30天)
5. AI模型配置
6. 10个成就模板

## 七、扩展建议

1. **分表分库**: 当 `messages` 表超过千万级时，可按 `user_id` 分表
2. **读写分离**: 查询密集场景可配置主从复制
3. **缓存层**: Redis 缓存热点数据（用户设置、签到状态）
4. **归档策略**: 定期归档历史消息到冷存储
