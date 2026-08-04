import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'PU159789682',
  database: 'ai_mate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;

export async function initDB() {
  try {
    // 先创建连接（不指定数据库）来创建数据库
    const tempConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    await tempConn.execute('CREATE DATABASE IF NOT EXISTS ai_mate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await tempConn.end();

    // 创建连接池
    pool = mysql.createPool(DB_CONFIG);

    // 创建表
    await createTables();
    console.log('MySQL 数据库连接成功！');
    return pool;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error;
  }
}

async function createTables() {
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

  // 插入默认用户
  await pool.execute(`
    INSERT IGNORE INTO users (id, username) VALUES (1, 'AI 创业者')
  `);

  // ---- 认证字段迁移（幂等：查 information_schema 决定是否加列）----
  const [colRows] = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
  );
  const existingCols = new Set(colRows.map((r) => r.COLUMN_NAME));
  // 兼容 A 版旧表：可能已有 password/phone/role/status 列且 NOT NULL 无默认值
  // 为注册插入提供可空/默认值，避免 INSERT 时报错
  if (existingCols.has('password') && !existingCols.has('password_hash')) {
    await pool.execute(`ALTER TABLE users MODIFY password VARCHAR(255) NULL DEFAULT NULL`);
  }
  if (existingCols.has('role')) {
    await pool.execute(`ALTER TABLE users MODIFY role ENUM('USER','ADMIN','VIP') NULL DEFAULT 'USER'`);
  }
  if (existingCols.has('status')) {
    await pool.execute(`ALTER TABLE users MODIFY status ENUM('ACTIVE','INACTIVE','BANNED') NULL DEFAULT 'ACTIVE'`);
  }
  if (!existingCols.has('email')) {
    await pool.execute(`ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL AFTER username`);
  }
  if (!existingCols.has('password_hash')) {
    await pool.execute(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email`);
  }
  // email 唯一键（幂等：检查索引是否存在）
  const [idxRows] = await pool.execute(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_email'`
  );
  if (idxRows.length === 0) {
    await pool.execute(`ALTER TABLE users ADD UNIQUE KEY uk_email (email)`);
  }
  // 种子账号：admin@aimate.com / admin123（保证既有 user_id=1 可登录）
  const bcrypt = (await import('bcryptjs')).default;
  const seedHash = bcrypt.hashSync('admin123', 10);
  await pool.execute(
    `UPDATE users SET email = 'admin@aimate.com',
       password_hash = CASE WHEN password_hash IS NULL THEN ? ELSE password_hash END
     WHERE id = 1 AND email IS NULL`,
    [seedHash]
  );

  // 消息通知表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL DEFAULT 1,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      type VARCHAR(20) DEFAULT 'system',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_read (user_id, is_read),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // 幂等修复：旧表可能 is_read 允许 NULL，强制 NOT NULL DEFAULT 0
  try {
    await pool.execute(`ALTER TABLE notifications MODIFY is_read TINYINT(1) NOT NULL DEFAULT 0`);
  } catch { /* 已满足则忽略 */ }
  // 种子通知（首次建表时插入）
  const [notifCount] = await pool.execute('SELECT COUNT(*) as count FROM notifications');
  if (notifCount[0].count === 0) {
    await pool.execute(`
      INSERT INTO notifications (user_id, title, content, type, is_read) VALUES
      (1, '欢迎使用青宸智汇', '欢迎加入大学生创业智能体平台！你可以与探路者AI、军师AI、工匠AI、管家AI四位智能体协作，开启你的创业之旅。', 'system', 0),
      (1, '新版本发布 v1.2', '新增知识库 Obsidian 接入、用量统计面板、应用中心，快来体验吧。', 'system', 0),
      (1, '速通体验提醒', '你有 5 次速通体验机会，可在对话中使用速通功能快速生成方案。', 'system', 0),
      (1, '技能库更新', '技能库新增「市场调研」「BP 撰写」等 12 项创业技能，支持关键词自动触发。', 'system', 0)
    `);
    console.log('通知种子数据插入完成！');
  }

  // 插入默认设置
  await pool.execute(`
    INSERT IGNORE INTO user_settings (user_id) VALUES (1)
  `);

  // Demo作品表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS demo_projects (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL DEFAULT 1,
      title VARCHAR(200) NOT NULL COMMENT '项目名称',
      description TEXT COMMENT '项目简介',
      cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL',
      demo_type ENUM('web', 'desktop', 'app', 'miniapp') NOT NULL DEFAULT 'web' COMMENT '网页/桌面端/APP/小程序',
      demo_url VARCHAR(500) DEFAULT NULL COMMENT 'Demo在线访问URL',
      demo_video_url VARCHAR(500) DEFAULT NULL COMMENT '功能演示视频URL',
      preview_urls JSON DEFAULT NULL COMMENT '多张预览图URL数组',
      stage ENUM('seed', 'angel', 'series_a', 'series_b', 'series_c', 'pre_ipo') NOT NULL DEFAULT 'seed' COMMENT '项目阶段（6级融资阶段）',
      team_type ENUM('solo_opc', 'team_otc') NOT NULL DEFAULT 'solo_opc' COMMENT '个人OPC/多人OTC',
      team_size INT UNSIGNED DEFAULT 1 COMMENT '团队人数',
      team_members JSON DEFAULT NULL COMMENT '团队成员信息（OTC时填写）',
      tech_stack JSON DEFAULT NULL COMMENT '技术栈数组',
      tags JSON DEFAULT NULL COMMENT '自定义标签数组',
      links JSON DEFAULT NULL COMMENT '外部链接: github/gitee/douyin/bilibili/x/xiaohongshu/website',
      view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
      like_count INT UNSIGNED DEFAULT 0 COMMENT '点赞次数',
      status ENUM('draft', 'published', 'archived') DEFAULT 'published' COMMENT '发布状态',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user (user_id),
      INDEX idx_type (demo_type),
      INDEX idx_stage (stage),
      INDEX idx_team_type (team_type),
      INDEX idx_status (status),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 插入示例Demo数据
  const [existingDemos] = await pool.execute('SELECT COUNT(*) as count FROM demo_projects');
  if (existingDemos[0].count === 0) {
    await pool.execute(`
      INSERT INTO demo_projects
      (user_id, title, description, cover_image, demo_type, demo_url, demo_video_url, stage, team_type, team_size, team_members, tech_stack, tags, links, status)
      VALUES
      (1, '青宸智汇 大学生创业智能体平台',
       '基于AI Agent技术的一站式大学生创业服务平台，集成探路者AI、军师AI、工匠AI、管家AI四大智能体角色，提供市场分析、创业规划、技能库、项目管理等全方位创业支持。',
       'https://picsum.photos/seed/aimate/800/450', 'web', 'https://aimate.demo', 'https://www.w3schools.com/html/mov_bbb.mp4',
       'angel', 'team_otc', 4,
       '[{"name":"张三","role":"产品负责人"},{"name":"李四","role":"前端开发"},{"name":"王五","role":"后端开发"},{"name":"赵六","role":"UI设计师"}]',
       '["React 19","TypeScript","Node.js","MySQL","Zustand","Ant Design"]',
       '["AI Agent","创业服务","大学生","智能体"]',
       '{"github":"https://github.com/example/ai-mate","gitee":"https://gitee.com/example/ai-mate","bilibili":"https://space.bilibili.com/example","xiaohongshu":"https://www.xiaohongshu.com/user/example"}',
       'published'),
      (1, '校园二手交易平台',
       '专为大学生打造的校园二手物品交易平台，支持商品发布、在线沟通、线下交易，涵盖教材、数码、生活用品等品类。集成AI智能定价和信用评估系统。',
       'https://picsum.photos/seed/campus2nd/800/450', 'app', 'https://campus2nd.demo', NULL,
       'seed', 'solo_opc', 1,
       NULL,
       '["Flutter","Dart","Firebase","Stripe"]',
       '["二手交易","校园","移动应用"]',
       '{"github":"https://github.com/example/campus2nd"}',
       'published'),
      (1, '智能简历生成器',
       '基于AI的简历生成与优化工具，支持一键生成专业简历、AI智能优化建议、多模板切换、PDF导出。针对应届生和实习生场景深度优化。',
       'https://picsum.photos/seed/resumeai/800/450', 'web', 'https://resumeai.demo', NULL,
       'angel', 'team_otc', 3,
       '[{"name":"陈明","role":"全栈开发"},{"name":"林小红","role":"产品经理"},{"name":"王强","role":"算法工程师"}]',
       '["Vue 3","Python","FastAPI","OpenAI API","TailwindCSS"]',
       '["简历","AI","求职","SaaS"]',
       '{"github":"https://github.com/example/resumeai","website":"https://resumeai.demo"}',
       'published'),
      (1, '校园跑腿小程序',
       '基于微信小程序的校园跑腿服务平台，支持代取快递、代买餐食、代送文件等服务。骑手实名认证+评分系统，保障服务质量。',
       'https://picsum.photos/seed/paotui/800/450', 'miniapp', NULL, NULL,
       'series_a', 'team_otc', 5,
       '[{"name":"刘洋","role":"创始人"},{"name":"赵敏","role":"运营总监"},{"name":"孙伟","role":"技术负责人"},{"name":"周婷","role":"UI设计"},{"name":"吴磊","role":"市场推广"}]',
       '["微信小程序","云开发","Node.js","微信支付"]',
       '["跑腿","小程序","校园服务","O2O"]',
       '{"github":"https://github.com/example/paotui","douyin":"https://www.douyin.com/user/example"}',
       'published')
    `);
    console.log('示例Demo数据插入完成！');
  }

  console.log('数据库表创建完成！');
}

export function getPool() {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initDB()');
  }
  return pool;
}
