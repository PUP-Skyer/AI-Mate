# 数据库层重构 实施计划

> **目标：** 重构 db.js，创建大学生智能体所需的四张核心业务表（conversations、messages、ai_models、knowledge_base），为真实化后端 API 与 AI 模型集成提供数据持久化基础。
> **依赖：** 无（本计划为整个优化方案的第一个前置计划，需最先执行）
> **技术栈：** MySQL 8.0+（utf8mb4 字符集、InnoDB 引擎、JSON 字段、FULLTEXT INDEX with ngram parser）、Node.js + mysql2/promise、ESM 模块系统

---

## 项目背景

当前 `db.js`（位于 `ai-mate/react-ai-chat/db.js`）仅创建了 4 张表：`users`、`sign_in_records`、`desk_pets`、`user_settings`。这些表只支持用户画像、签到和桌宠功能，无法支撑大学生智能体的对话、消息、模型配置和知识库 RAG 检索能力。

现有 `createTables()` 函数位置：
- **文件：** `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js` 第 39-104 行

数据库连接配置（第 3-11 行）：
```javascript
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'PU159789682',
  database: 'ai_mate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
```

本计划将在此函数中追加 4 张核心业务表的创建逻辑，并插入默认 AI 模型配置数据。

---

### 任务1：创建 conversations 对话表

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js`

- [ ] 步骤1：在 `createTables()` 函数中（建议在 `user_settings` 表创建之后、插入默认用户之前）追加 `conversations` 表的建表语句

**SQL 建表语句（追加到 createTables 函数内）：**

```javascript
  // 对话表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '对话ID',
      user_id INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '用户ID',
      project_id INT UNSIGNED DEFAULT NULL COMMENT '关联项目ID',
      ai_role ENUM('scout', 'sage', 'maker', 'butler') NOT NULL COMMENT 'AI角色: scout-探路者, sage-军师, maker-工匠, butler-管家',
      title VARCHAR(200) NOT NULL DEFAULT '新对话' COMMENT '对话标题',
      model_id INT UNSIGNED DEFAULT NULL COMMENT '使用的AI模型ID(关联ai_models表)',
      status ENUM('active', 'archived', 'deleted') DEFAULT 'active' COMMENT '对话状态',
      summary TEXT COMMENT '对话摘要(AI自动生成)',
      is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_user_role (user_id, ai_role),
      INDEX idx_status (status),
      INDEX idx_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话表'
  `);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | 主键 |
| user_id | INT UNSIGNED | 用户ID，默认1（当前单用户模式） |
| project_id | INT UNSIGNED | 关联项目ID，预留多项目支持 |
| ai_role | ENUM | 四大AI角色枚举，对应前端 AIRole 类型 |
| title | VARCHAR(200) | 对话标题，默认"新对话" |
| model_id | INT UNSIGNED | 关联 ai_models 表的模型ID |
| status | ENUM | 对话生命周期状态 |
| summary | TEXT | AI生成的对话摘要 |
| is_pinned | TINYINT(1) | 是否置顶 |

- [ ] 步骤2：验证 conversations 表是否创建成功

**验证命令（在项目根目录 `ai-mate/react-ai-chat` 下执行）：**

```bash
# 1. 启动服务器触发建表（如果服务器已在运行，重启它）
node server.js

# 2. 使用 MySQL 命令行验证表结构
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE conversations;"

# 3. 验证字符集和引擎
mysql -u root -pPU159789682 ai_mate -e "SHOW CREATE TABLE conversations\G"

# 4. 验证索引
mysql -u root -pPU159789682 ai_mate -e "SHOW INDEX FROM conversations;"
```

**预期输出：**
- `DESCRIBE conversations` 应显示 11 个字段
- `SHOW CREATE TABLE` 应显示 `ENGINE=InnoDB` 和 `CHARSET=utf8mb4`
- 索引应包含 `idx_user_role`、`idx_status`、`idx_updated`

- [ ] 步骤3：进入任务2，创建 messages 消息表（conversations 表是 messages 表的外键依赖）

---

### 任务2：创建 messages 消息表

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js`

- [ ] 步骤1：在 `createTables()` 函数中，紧接 conversations 表创建语句之后，追加 messages 表的建表语句

**SQL 建表语句（追加到 createTables 函数内）：**

```javascript
  // 消息表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
      conversation_id INT UNSIGNED NOT NULL COMMENT '对话ID',
      role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '消息角色',
      content TEXT NOT NULL COMMENT '消息内容',
      token_count INT UNSIGNED DEFAULT 0 COMMENT 'Token消耗数',
      metadata JSON COMMENT '额外元数据(模型名称、响应时间、工具调用等)',
      is_error TINYINT(1) DEFAULT 0 COMMENT '是否错误消息',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      INDEX idx_conversation (conversation_id),
      INDEX idx_role (role),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表'
  `);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | 主键 |
| conversation_id | INT UNSIGNED | 外键，关联 conversations.id，级联删除 |
| role | ENUM | user-用户消息, assistant-AI回复, system-系统消息 |
| content | TEXT | 消息文本内容 |
| token_count | INT UNSIGNED | 该条消息消耗的 Token 数 |
| metadata | JSON | 存储模型名称、响应耗时、工具调用结果等扩展信息 |
| is_error | TINYINT(1) | 标记 AI 回复失败的消息 |

**metadata JSON 示例结构：**
```json
{
  "model": "glm-4",
  "response_time_ms": 1523,
  "finish_reason": "stop",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  },
  "tool_calls": []
}
```

- [ ] 步骤2：验证 messages 表创建及外键关系

**验证命令：**

```bash
# 1. 重启服务器
node server.js

# 2. 验证表结构
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE messages;"

# 3. 验证外键约束
mysql -u root -pPU159789682 ai_mate -e "
  SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'ai_mate' AND TABLE_NAME = 'messages' AND REFERENCED_TABLE_NAME IS NOT NULL;
"

# 4. 测试级联删除（插入测试数据后删除对话，验证消息是否自动删除）
mysql -u root -pPU159789682 ai_mate -e "
  INSERT INTO conversations (user_id, ai_role, title) VALUES (1, 'scout', '测试对话');
  SET @conv_id = LAST_INSERT_ID();
  INSERT INTO messages (conversation_id, role, content) VALUES (@conv_id, 'user', '测试消息');
  DELETE FROM conversations WHERE id = @conv_id;
  SELECT COUNT(*) AS remaining_messages FROM messages WHERE conversation_id = @conv_id;
"
# 预期 remaining_messages = 0（级联删除生效）
```

- [ ] 步骤3：进入任务3，创建 ai_models 模型配置表

---

### 任务3：创建 ai_models 模型配置表

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js`

- [ ] 步骤1：在 `createTables()` 函数中，紧接 messages 表创建语句之后，追加 ai_models 表的建表语句

**SQL 建表语句（追加到 createTables 函数内）：**

```javascript
  // AI模型配置表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '模型配置ID',
      name VARCHAR(100) NOT NULL COMMENT '模型显示名称',
      provider ENUM('zhipu', 'coze', 'openai') NOT NULL COMMENT '模型提供商',
      api_endpoint VARCHAR(500) NOT NULL COMMENT 'API调用端点URL',
      model_id VARCHAR(100) NOT NULL COMMENT '提供商侧的模型标识(如glm-4)',
      api_key_enc TEXT NOT NULL COMMENT '加密后的API密钥',
      config JSON COMMENT '模型配置参数(temperature, max_tokens, top_p等)',
      is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
      is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认模型',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      UNIQUE KEY uk_provider_model (provider, model_id),
      INDEX idx_provider (provider),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表'
  `);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | 前端展示名称，如"智谱GLM-4" |
| provider | ENUM | zhipu-智谱, coze-Coze, openai-OpenAI兼容 |
| api_endpoint | VARCHAR(500) | API 调用地址 |
| model_id | VARCHAR(100) | 提供商侧模型标识，如 `glm-4`、`glm-4-flash` |
| api_key_enc | TEXT | 加密存储的 API Key（明文不入库） |
| config | JSON | 温度、最大Token等参数配置 |
| is_active | TINYINT(1) | 是否启用该模型 |
| is_default | TINYINT(1) | 是否为默认使用的模型 |

**config JSON 示例：**
```json
{
  "temperature": 0.7,
  "max_tokens": 4096,
  "top_p": 0.9,
  "stream": true
}
```

- [ ] 步骤2：插入默认 AI 模型配置数据（智谱 GLM-4 系列 + Coze）

在 `createTables()` 函数末尾（插入默认用户之后），追加默认模型数据：

```javascript
  // 插入默认AI模型配置（如果表为空）
  const [modelCount] = await pool.execute('SELECT COUNT(*) as count FROM ai_models');
  if (modelCount[0].count === 0) {
    // 注意：api_key_enc 此处使用占位符，实际部署时需通过环境变量注入并加密
    await pool.execute(`
      INSERT INTO ai_models (name, provider, api_endpoint, model_id, api_key_enc, config, is_active, is_default, sort_order) VALUES
      ('智谱GLM-4', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.7, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 1, 1, 1),
      ('智谱GLM-4-Flash', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4-flash', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.8, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 1, 0, 2),
      ('智谱GLM-4-Air', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4-air', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.7, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 0, 0, 3),
      ('Coze智能体', 'coze', 'https://api.coze.cn/v3/chat', 'coze-bot-default', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('bot_id', 'PLACEHOLDER_BOT_ID', 'stream', true), 1, 0, 4)
    `);
    console.log('默认AI模型配置已插入');
  }
```

- [ ] 步骤3：验证 ai_models 表及默认数据

**验证命令：**

```bash
# 1. 重启服务器
node server.js

# 2. 验证表结构
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE ai_models;"

# 3. 验证默认数据已插入
mysql -u root -pPU159789682 ai_mate -e "SELECT id, name, provider, model_id, is_active, is_default FROM ai_models;"

# 4. 验证唯一约束（重复插入应失败）
mysql -u root -pPU159789682 ai_mate -e "
  INSERT INTO ai_models (name, provider, api_endpoint, model_id, api_key_enc) VALUES ('重复测试', 'zhipu', 'https://test.com', 'glm-4', 'test');
"
# 预期：报错 Duplicate entry 'zhipu-glm-4' for key 'uk_provider_model'

# 5. 验证 config JSON 字段
mysql -u root -pPU159789682 ai_mate -e "SELECT name, config FROM ai_models WHERE provider = 'zhipu' LIMIT 1;"
```

**预期输出：**
- 表结构显示 11 个字段
- 默认数据包含 4 条记录（3条智谱 + 1条Coze）
- 唯一约束 `uk_provider_model` 生效

- [ ] 步骤4：进入任务4，创建 knowledge_base 知识库表

---

### 任务4：创建 knowledge_base 知识库表

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js`

- [ ] 步骤1：在 `createTables()` 函数中，紧接 ai_models 表创建语句之后，追加 knowledge_base 表的建表语句

**SQL 建表语句（追加到 createTables 函数内）：**

```javascript
  // 知识库表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '知识条目ID',
      title VARCHAR(255) NOT NULL COMMENT '标题',
      content TEXT NOT NULL COMMENT '正文内容',
      category ENUM('case', 'policy', 'report', 'tutorial') NOT NULL COMMENT '分类: case-案例, policy-政策, report-报告, tutorial-教程',
      source VARCHAR(255) DEFAULT NULL COMMENT '来源(网站、书籍、机构等)',
      tags JSON COMMENT '标签数组',
      view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
      is_published TINYINT(1) DEFAULT 1 COMMENT '是否发布',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram,
      INDEX idx_category (category),
      INDEX idx_published (is_published),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库表'
  `);
```

> **重要说明：** `FULLTEXT INDEX ... WITH PARSER ngram` 需要 MySQL 8.0+ 且 InnoDB 引擎。ngram 解析器支持中文分词（默认 ngram_token_size=2），是 MySQL 内置功能，无需额外安装插件。如果 MySQL 版本低于 8.0，需要先确认是否支持 ngram。

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT UNSIGNED AUTO_INCREMENT | 主键 |
| title | VARCHAR(255) | 知识条目标题 |
| content | TEXT | 知识正文 |
| category | ENUM | case-创业案例, policy-创业政策, report-行业报告, tutorial-创业教程 |
| source | VARCHAR(255) | 信息来源标注 |
| tags | JSON | 标签数组，如 `["大学生创业", "税收优惠"]` |
| view_count | INT UNSIGNED | 浏览次数 |
| is_published | TINYINT(1) | 是否已发布 |
| created_at | TIMESTAMP | 创建时间 |
| FULLTEXT INDEX | - | 基于 ngram 分词器的全文索引，覆盖 title 和 content |

- [ ] 步骤2：插入示例知识库数据用于后续 RAG 检索测试

在 `createTables()` 函数末尾追加：

```javascript
  // 插入示例知识库数据（如果表为空）
  const [kbCount] = await pool.execute('SELECT COUNT(*) as count FROM knowledge_base');
  if (kbCount[0].count === 0) {
    await pool.execute(`
      INSERT INTO knowledge_base (title, content, category, source, tags) VALUES
      ('大学生创业税收优惠政策指南', '根据国家税务总局规定，毕业年度内高校毕业生从事个体经营的，自办理个体工商户登记当月起，在3年内按每户每年14400元为限额依次扣减其当年实际应缴纳的增值税、城市维护建设税、教育费附加、地方教育附加和个人所得税。大学生创业还可享受小微企业增值税减免政策。', 'policy', '国家税务总局', JSON_ARRAY('大学生创业', '税收优惠', '个体经营')),
      ('互联网+大学生创新创业大赛参赛指南', '中国"互联网+"大学生创新创业大赛是由教育部主办的全国性赛事。参赛项目主要包括移动互联网、人工智能、物联网等方向。大赛分为创意组、初创组、成长组等。获奖项目可获得创业资金支持和孵化资源对接。', 'tutorial', '教育部', JSON_ARRAY('创新创业大赛', '互联网+', '参赛指南')),
      ('校园外卖平台创业案例分析', '某高校大学生团队通过搭建校园外卖配送平台，整合校内餐厅资源，利用学生兼职配送员模式，在3个月内覆盖全校12个食堂，日订单量突破2000单。核心成功因素包括：精准的校园场景定位、低成本众包配送模式、社交裂变获客策略。', 'case', '创业邦', JSON_ARRAY('校园创业', '外卖平台', '众包配送')),
      ('2024年大学生创业扶持政策汇总', '2024年各地政府持续加大对大学生创业的扶持力度。主要政策包括：创业补贴（一次性创业补贴5000-10000元）、创业担保贷款（最高30万元，财政贴息）、创业孵化基地入驻（免费场地+导师辅导）、社保补贴等。具体政策因地区而异，创业者可咨询当地人社部门。', 'policy', '人力资源和社会保障部', JSON_ARRAY('创业扶持', '创业补贴', '担保贷款')),
      ('大学生创业项目BP撰写教程', '商业计划书（BP）是创业者向投资人展示项目的核心文档。标准BP应包含：1.项目概述与痛点分析；2.解决方案与产品介绍；3.市场规模与竞品分析；4.商业模式与盈利方式；5.团队介绍；6.财务预测与融资计划。建议BP控制在15-20页，路演版本10-15页。', 'tutorial', '36氪', JSON_ARRAY('商业计划书', 'BP撰写', '融资'))
    `);
    console.log('示例知识库数据已插入');
  }
```

- [ ] 步骤3：验证 knowledge_base 表创建及全文索引功能

**验证命令：**

```bash
# 1. 重启服务器
node server.js

# 2. 验证表结构
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE knowledge_base;"

# 3. 验证全文索引是否存在
mysql -u root -pPU159789682 ai_mate -e "
  SELECT INDEX_NAME, INDEX_TYPE, COMMENT
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'ai_mate' AND TABLE_NAME = 'knowledge_base' AND INDEX_TYPE = 'FULLTEXT';
"

# 4. 验证 ngram 解析器是否可用
mysql -u root -pPU159789682 ai_mate -e "SHOW VARIABLES LIKE 'ngram_token_size';"
# 预期：ngram_token_size = 2

# 5. 测试全文检索（验证 RAG 检索基础功能）
mysql -u root -pPU159789682 ai_mate -e "
  SELECT id, title, category,
    MATCH(title, content) AGAINST('大学生创业' IN NATURAL LANGUAGE MODE) AS relevance
  FROM knowledge_base
  WHERE MATCH(title, content) AGAINST('大学生创业' IN NATURAL LANGUAGE MODE)
  ORDER BY relevance DESC;
"

# 6. 测试布尔模式全文检索
mysql -u root -pPU159789682 ai_mate -e "
  SELECT id, title FROM knowledge_base
  WHERE MATCH(title, content) AGAINST('+税收 +优惠' IN BOOLEAN MODE);
"

# 7. 验证示例数据
mysql -u root -pPU159789682 ai_mate -e "SELECT id, title, category FROM knowledge_base;"
```

**预期输出：**
- 表结构显示 10 个字段
- 全文索引 `ft_title_content` 存在且类型为 FULLTEXT
- ngram_token_size 值为 2
- 全文检索能正确返回相关结果并按相关性排序
- 示例数据包含 5 条记录

- [ ] 步骤4：进入任务5，修改 createTables 函数整合所有新表

---

### 任务5：修改 db.js 的 createTables 函数，加入新表创建逻辑

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\db.js`

- [ ] 步骤1：查看完整的 createTables 函数修改后的结构

本任务是将前 4 个任务的建表语句整合到 `createTables()` 函数中。以下是修改后的完整 `createTables()` 函数（替换原文件第 39-104 行）：

**完整的 createTables 函数代码：**

```javascript
async function createTables() {
  // ========== 原有基础表 ==========

  // 用户表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL DEFAULT 'AI 创业者',
      avatar VARCHAR(255) DEFAULT NULL,
      level INT DEFAULT 1,
      exp INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 签到记录表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sign_in_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL DEFAULT 1,
      sign_date DATE NOT NULL,
      signed TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_date (user_id, sign_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 桌宠表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS desk_pets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL DEFAULT 1,
      pet_id VARCHAR(50) NOT NULL,
      name VARCHAR(50) NOT NULL,
      rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL,
      image VARCHAR(10) NOT NULL,
      description TEXT,
      obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 用户设置表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL DEFAULT 1,
      dark_mode TINYINT(1) DEFAULT 0,
      notifications TINYINT(1) DEFAULT 1,
      auto_save TINYINT(1) DEFAULT 1,
      sound_effects TINYINT(1) DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ========== 新增核心业务表 ==========

  // 对话表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '对话ID',
      user_id INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '用户ID',
      project_id INT UNSIGNED DEFAULT NULL COMMENT '关联项目ID',
      ai_role ENUM('scout', 'sage', 'maker', 'butler') NOT NULL COMMENT 'AI角色',
      title VARCHAR(200) NOT NULL DEFAULT '新对话' COMMENT '对话标题',
      model_id INT UNSIGNED DEFAULT NULL COMMENT '使用的AI模型ID',
      status ENUM('active', 'archived', 'deleted') DEFAULT 'active' COMMENT '对话状态',
      summary TEXT COMMENT '对话摘要',
      is_pinned TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_user_role (user_id, ai_role),
      INDEX idx_status (status),
      INDEX idx_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话表'
  `);

  // 消息表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
      conversation_id INT UNSIGNED NOT NULL COMMENT '对话ID',
      role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '消息角色',
      content TEXT NOT NULL COMMENT '消息内容',
      token_count INT UNSIGNED DEFAULT 0 COMMENT 'Token消耗数',
      metadata JSON COMMENT '额外元数据',
      is_error TINYINT(1) DEFAULT 0 COMMENT '是否错误消息',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      INDEX idx_conversation (conversation_id),
      INDEX idx_role (role),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表'
  `);

  // AI模型配置表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '模型配置ID',
      name VARCHAR(100) NOT NULL COMMENT '模型显示名称',
      provider ENUM('zhipu', 'coze', 'openai') NOT NULL COMMENT '模型提供商',
      api_endpoint VARCHAR(500) NOT NULL COMMENT 'API调用端点URL',
      model_id VARCHAR(100) NOT NULL COMMENT '提供商侧的模型标识',
      api_key_enc TEXT NOT NULL COMMENT '加密后的API密钥',
      config JSON COMMENT '模型配置参数',
      is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
      is_default TINYINT(1) DEFAULT 0 COMMENT '是否为默认模型',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      UNIQUE KEY uk_provider_model (provider, model_id),
      INDEX idx_provider (provider),
      INDEX idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表'
  `);

  // 知识库表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '知识条目ID',
      title VARCHAR(255) NOT NULL COMMENT '标题',
      content TEXT NOT NULL COMMENT '正文内容',
      category ENUM('case', 'policy', 'report', 'tutorial') NOT NULL COMMENT '分类',
      source VARCHAR(255) DEFAULT NULL COMMENT '来源',
      tags JSON COMMENT '标签数组',
      view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
      is_published TINYINT(1) DEFAULT 1 COMMENT '是否发布',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      FULLTEXT INDEX ft_title_content (title, content) WITH PARSER ngram,
      INDEX idx_category (category),
      INDEX idx_published (is_published),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库表'
  `);

  // ========== 插入默认数据 ==========

  // 插入默认用户
  await pool.execute(`
    INSERT IGNORE INTO users (id, username) VALUES (1, 'AI 创业者')
  `);

  // 插入默认设置
  await pool.execute(`
    INSERT IGNORE INTO user_settings (user_id) VALUES (1)
  `);

  // 插入默认AI模型配置（如果表为空）
  const [modelCount] = await pool.execute('SELECT COUNT(*) as count FROM ai_models');
  if (modelCount[0].count === 0) {
    await pool.execute(`
      INSERT INTO ai_models (name, provider, api_endpoint, model_id, api_key_enc, config, is_active, is_default, sort_order) VALUES
      ('智谱GLM-4', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.7, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 1, 1, 1),
      ('智谱GLM-4-Flash', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4-flash', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.8, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 1, 0, 2),
      ('智谱GLM-4-Air', 'zhipu', 'https://open.bigmodel.cn/api/paas/v4/chat/completions', 'glm-4-air', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('temperature', 0.7, 'max_tokens', 4096, 'top_p', 0.9, 'stream', true), 0, 0, 3),
      ('Coze智能体', 'coze', 'https://api.coze.cn/v3/chat', 'coze-bot-default', 'PLACEHOLDER_ENCRYPTED_KEY', JSON_OBJECT('bot_id', 'PLACEHOLDER_BOT_ID', 'stream', true), 1, 0, 4)
    `);
    console.log('默认AI模型配置已插入');
  }

  // 插入示例知识库数据（如果表为空）
  const [kbCount] = await pool.execute('SELECT COUNT(*) as count FROM knowledge_base');
  if (kbCount[0].count === 0) {
    await pool.execute(`
      INSERT INTO knowledge_base (title, content, category, source, tags) VALUES
      ('大学生创业税收优惠政策指南', '根据国家税务总局规定，毕业年度内高校毕业生从事个体经营的，自办理个体工商户登记当月起，在3年内按每户每年14400元为限额依次扣减其当年实际应缴纳的增值税、城市维护建设税、教育费附加、地方教育附加和个人所得税。大学生创业还可享受小微企业增值税减免政策。', 'policy', '国家税务总局', JSON_ARRAY('大学生创业', '税收优惠', '个体经营')),
      ('互联网+大学生创新创业大赛参赛指南', '中国"互联网+"大学生创新创业大赛是由教育部主办的全国性赛事。参赛项目主要包括移动互联网、人工智能、物联网等方向。大赛分为创意组、初创组、成长组等。获奖项目可获得创业资金支持和孵化资源对接。', 'tutorial', '教育部', JSON_ARRAY('创新创业大赛', '互联网+', '参赛指南')),
      ('校园外卖平台创业案例分析', '某高校大学生团队通过搭建校园外卖配送平台，整合校内餐厅资源，利用学生兼职配送员模式，在3个月内覆盖全校12个食堂，日订单量突破2000单。核心成功因素包括：精准的校园场景定位、低成本众包配送模式、社交裂变获客策略。', 'case', '创业邦', JSON_ARRAY('校园创业', '外卖平台', '众包配送')),
      ('2024年大学生创业扶持政策汇总', '2024年各地政府持续加大对大学生创业的扶持力度。主要政策包括：创业补贴（一次性创业补贴5000-10000元）、创业担保贷款（最高30万元，财政贴息）、创业孵化基地入驻（免费场地+导师辅导）、社保补贴等。具体政策因地区而异，创业者可咨询当地人社部门。', 'policy', '人力资源和社会保障部', JSON_ARRAY('创业扶持', '创业补贴', '担保贷款')),
      ('大学生创业项目BP撰写教程', '商业计划书（BP）是创业者向投资人展示项目的核心文档。标准BP应包含：1.项目概述与痛点分析；2.解决方案与产品介绍；3.市场规模与竞品分析；4.商业模式与盈利方式；5.团队介绍；6.财务预测与融资计划。建议BP控制在15-20页，路演版本10-15页。', 'tutorial', '36氪', JSON_ARRAY('商业计划书', 'BP撰写', '融资'))
    `);
    console.log('示例知识库数据已插入');
  }

  console.log('数据库表创建完成！(含 conversations, messages, ai_models, knowledge_base)');
}
```

- [ ] 步骤2：重启服务器并验证所有表一次性创建成功

**验证命令：**

```bash
# 1. 进入项目目录
cd "f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat"

# 2. 重启服务器
node server.js

# 3. 验证所有表是否已创建（应显示 8 张表）
mysql -u root -pPU159789682 ai_mate -e "SHOW TABLES;"

# 预期输出：
# +-----------------------+
# | Tables_in_ai_mate     |
# +-----------------------+
# | ai_models             |
# | conversations         |
# | desk_pets             |
# | knowledge_base        |
# | messages              |
# | sign_in_records       |
# | user_settings         |
# | users                 |
# +-----------------------+

# 4. 一键验证所有新表结构
mysql -u root -pPU159789682 ai_mate -e "
  SELECT TABLE_NAME, TABLE_COMMENT, ENGINE
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = 'ai_mate'
  AND TABLE_NAME IN ('conversations', 'messages', 'ai_models', 'knowledge_base');
"

# 5. 验证所有新表的外键关系
mysql -u root -pPU159789682 ai_mate -e "
  SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'ai_mate'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
"

# 6. 验证所有全文索引
mysql -u root -pPU159789682 ai_mate -e "
  SELECT TABLE_NAME, INDEX_NAME, INDEX_TYPE
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'ai_mate' AND INDEX_TYPE = 'FULLTEXT';
"

# 7. 验证默认数据完整性
mysql -u root -pPU159789682 ai_mate -e "
  SELECT 'ai_models' AS table_name, COUNT(*) AS count FROM ai_models
  UNION ALL
  SELECT 'knowledge_base', COUNT(*) FROM knowledge_base
  UNION ALL
  SELECT 'conversations', COUNT(*) FROM conversations
  UNION ALL
  SELECT 'messages', COUNT(*) FROM messages;
"
```

- [ ] 步骤3：执行端到端集成测试，验证表之间的关联关系

**集成测试命令（验证完整的对话-消息-模型-知识库数据流）：**

```bash
# 插入测试对话
mysql -u root -pPU159789682 ai_mate -e "
  -- 创建测试对话
  INSERT INTO conversations (user_id, ai_role, title, model_id)
  VALUES (1, 'sage', '数据库层重构测试对话', 1);
  SET @conv_id = LAST_INSERT_ID();

  -- 插入测试消息
  INSERT INTO messages (conversation_id, role, content, token_count, metadata) VALUES
    (@conv_id, 'user', '什么是大学生创业税收优惠？', 15, JSON_OBJECT('source', 'test')),
    (@conv_id, 'assistant', '大学生创业可享受每年14400元的税收减免限额。', 30, JSON_OBJECT('model', 'glm-4', 'response_time_ms', 1200));

  -- 验证对话和消息关联查询
  SELECT c.title, c.ai_role, m.role, m.content
  FROM conversations c
  JOIN messages m ON c.id = m.conversation_id
  WHERE c.id = @conv_id;

  -- 验证对话关联模型信息
  SELECT c.title, m.name AS model_name, m.provider
  FROM conversations c
  LEFT JOIN ai_models m ON c.model_id = m.id
  WHERE c.id = @conv_id;

  -- 验证知识库全文检索
  SELECT kb.title, kb.category,
    MATCH(kb.title, kb.content) AGAINST('大学生创业税收' IN NATURAL LANGUAGE MODE) AS relevance
  FROM knowledge_base kb
  WHERE MATCH(kb.title, kb.content) AGAINST('大学生创业税收' IN NATURAL LANGUAGE MODE)
  ORDER BY relevance DESC LIMIT 3;

  -- 清理测试数据
  DELETE FROM conversations WHERE id = @conv_id;
"
```

**预期结果：**
- 对话和消息关联查询返回 2 条消息记录
- 对话关联模型信息显示 model_name = '智谱GLM-4', provider = 'zhipu'
- 知识库全文检索返回相关条目并按相关性排序
- 测试数据已清理（级联删除消息）

- [ ] 步骤4：Plan-01 完成，进入 Plan-02-后端API真实化.md

---

## 总结

### 新增文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `ai-mate/react-ai-chat/db.js` | 修改 | 在 createTables() 中追加 4 张表 + 默认数据 |

### 新增数据库表清单
| 表名 | 用途 | 关键特性 |
|------|------|----------|
| conversations | 对话记录 | ENUM 角色、状态管理、置顶 |
| messages | 消息记录 | 外键级联删除、JSON 元数据 |
| ai_models | 模型配置 | 唯一约束、JSON 配置、加密密钥 |
| knowledge_base | 知识库 | FULLTEXT + ngram 中文全文索引 |

### 注意事项
1. **API Key 安全：** 默认数据中的 `api_key_enc` 为占位符，实际部署时必须通过环境变量注入真实密钥并加密存储，切勿将明文密钥提交到代码仓库。
2. **MySQL 版本要求：** knowledge_base 表的 `FULLTEXT INDEX ... WITH PARSER ngram` 需要 MySQL 8.0+，请在执行前确认 MySQL 版本。
3. **字符集统一：** 所有新表使用 `utf8mb4` + `utf8mb4_unicode_ci`，确保支持 emoji 和中文。
4. **外键约束：** messages 表的 `conversation_id` 外键设置了 `ON DELETE CASCADE`，删除对话时消息会自动删除。
5. **幂等性：** 所有建表语句使用 `CREATE TABLE IF NOT EXISTS`，默认数据插入有 count 检查，可安全重复执行。
