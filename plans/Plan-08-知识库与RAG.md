# 知识库与 RAG 实施计划

> **目标：** 实现知识库管理和 RAG 检索增强生成功能，为 AI 回答提供专业知识支撑，使大学生智能体能基于领域知识给出准确回答。
> **依赖：** Plan-01（数据库表结构对齐）、Plan-02（真实 AI 对话流式接口）、Plan-03（对话持久化）
> **技术栈：** MySQL 8.0 FULLTEXT INDEX + ngram parser、Express.js、TypeScript、React 19、Ant Design 6、智谱 GLM-4

---

## 前置说明

本计划在已有的 `db.js`（MySQL 连接池）、`server.js`（Express 服务器）、`aiService.ts`（智谱流式调用）基础上扩展。所有后端文件使用 ESM（`"type": "module"`），前端文件使用 TypeScript。

知识库采用轻量级方案：MySQL 全文索引（ngram 分词器）进行召回，结合 BM25 排序，不引入向量数据库，零额外依赖。

---

### 任务 1：创建后端知识库服务 knowledgeService.js

**文件：** Create `ai-mate/react-ai-chat/src/services/knowledgeService.js`

- [ ] 步骤 1：在 `db.js` 的 `createTables()` 中新增知识库表和全文索引

在 `ai-mate/react-ai-chat/db.js` 的 `createTables()` 函数末尾（`INSERT IGNORE INTO user_settings` 之前）添加：

```javascript
// 知识库分类表
await pool.execute(`
  CREATE TABLE IF NOT EXISTS kb_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description VARCHAR(500) COMMENT '描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库分类表'
`);

// 知识库文档表（使用 ngram 全文索引支持中文分词）
await pool.execute(`
  CREATE TABLE IF NOT EXISTS kb_documents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED COMMENT '分类ID',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容',
    source VARCHAR(255) COMMENT '来源',
    tags JSON COMMENT '标签',
    status ENUM('draft', 'published', 'archived') DEFAULT 'published' COMMENT '状态',
    view_count INT UNSIGNED DEFAULT 0 COMMENT '查看次数',
    created_by INT UNSIGNED DEFAULT 1 COMMENT '创建者',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库文档表'
`);

// 添加 ngram 全文索引（分词粒度 2，适合中文）
await pool.execute(`
  CREATE FULLTEXT INDEX ft_title_content
    ON kb_documents (title, content) WITH PARSER ngram
`);
```

- [ ] 步骤 2：创建 `ai-mate/react-ai-chat/src/services/knowledgeService.js`，实现知识库 CRUD

```javascript
// ai-mate/react-ai-chat/src/services/knowledgeService.js
import { getPool } from '../../db.js';

/**
 * 知识库服务 - 提供文档 CRUD 和全文检索能力
 */

// ========== 分类管理 ==========

/**
 * 获取所有分类
 */
export async function listCategories() {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM kb_categories ORDER BY sort_order ASC, id ASC'
  );
  return rows;
}

/**
 * 创建分类
 */
export async function createCategory(name, description = '') {
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO kb_categories (name, description) VALUES (?, ?)',
    [name, description]
  );
  return { id: result.insertId, name, description };
}

// ========== 文档管理 ==========

/**
 * 获取文档列表（分页）
 */
export async function listDocuments({ page = 1, pageSize = 20, categoryId, status, keyword } = {}) {
  const pool = getPool();
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (categoryId) {
    conditions.push('d.category_id = ?');
    params.push(categoryId);
  }
  if (status) {
    conditions.push('d.status = ?');
    params.push(status);
  } else {
    conditions.push("d.status = 'published'");
  }
  if (keyword) {
    conditions.push('d.title LIKE ?');
    params.push(`%${keyword}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查询总数
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM kb_documents d ${where}`,
    params
  );
  const total = countRows[0].total;

  // 查询列表（关联分类名称）
  const [rows] = await pool.execute(
    `SELECT d.*, c.name as category_name
     FROM kb_documents d
     LEFT JOIN kb_categories c ON d.category_id = c.id
     ${where}
     ORDER BY d.created_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  return {
    list: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取单个文档详情
 */
export async function getDocument(id) {
  const pool = getPool();
  // 增加查看次数
  await pool.execute('UPDATE kb_documents SET view_count = view_count + 1 WHERE id = ?', [id]);
  const [rows] = await pool.execute(
    `SELECT d.*, c.name as category_name
     FROM kb_documents d
     LEFT JOIN kb_categories c ON d.category_id = c.id
     WHERE d.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * 创建文档
 */
export async function createDocument(data) {
  const pool = getPool();
  const { title, content, categoryId, source, tags, status = 'published' } = data;
  const [result] = await pool.execute(
    `INSERT INTO kb_documents (title, content, category_id, source, tags, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, content, categoryId || null, source || null, JSON.stringify(tags || []), status]
  );
  return { id: result.insertId, ...data };
}

/**
 * 更新文档
 */
export async function updateDocument(id, data) {
  const pool = getPool();
  const { title, content, categoryId, source, tags, status } = data;
  await pool.execute(
    `UPDATE kb_documents
     SET title = ?, content = ?, category_id = ?, source = ?, tags = ?, status = ?
     WHERE id = ?`,
    [
      title, content, categoryId || null, source || null,
      JSON.stringify(tags || []), status || 'published', id
    ]
  );
  return { id, ...data };
}

/**
 * 删除文档
 */
export async function deleteDocument(id) {
  const pool = getPool();
  const [result] = await pool.execute('DELETE FROM kb_documents WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// ========== 全文检索 ==========

/**
 * 全文检索知识库（使用 MySQL FULLTEXT + ngram parser）
 * @param {string} query - 搜索关键词
 * @param {number} limit - 返回条数，默认 5
 * @returns {Promise<Array>} 匹配的文档片段
 */
export async function searchKnowledge(query, limit = 5) {
  const pool = getPool();

  // 使用 MATCH AGAINST 进行全文检索，配合 BM25 排序
  const [rows] = await pool.execute(
    `SELECT id, title,
       SUBSTRING(content, 1, 500) as snippet,
       MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
     FROM kb_documents
     WHERE status = 'published'
       AND MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
     ORDER BY relevance DESC
     LIMIT ${limit}`,
    [query, query]
  );

  return rows;
}

/**
 * 关键词模糊检索（全文索引不可用时的降级方案）
 */
export async function searchByKeyword(query, limit = 5) {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, title, SUBSTRING(content, 1, 500) as snippet
     FROM kb_documents
     WHERE status = 'published'
       AND (title LIKE ? OR content LIKE ?)
     ORDER BY view_count DESC
     LIMIT ${limit}`,
    [`%${query}%`, `%${query}%`]
  );
  return rows;
}
```

- [ ] 步骤 3：验证知识库表创建成功

```bash
# 启动后端服务，观察控制台输出
cd ai-mate/react-ai-chat
node server.js

# 另开终端，连接 MySQL 验证
mysql -u root -p ai_mate -e "SHOW TABLES LIKE 'kb_%';"
# 预期输出：
# +----------------------------+
# | Tables_in_ai_mate (kb_%)    |
# +----------------------------+
# | kb_categories               |
# | kb_documents                |
# +----------------------------+

# 验证全文索引
mysql -u root -p ai_mate -e "SHOW INDEX FROM kb_documents WHERE Index_type = 'FULLTEXT';"
# 预期输出包含 ft_title_content，Index_type 为 FULLTEXT
```

- [ ] 步骤 4：验证 CRUD 功能

```bash
# 在 server.js 中临时添加测试路由（后续任务会正式集成）
# 或直接用 curl 测试 knowledgeService 函数

# 创建测试分类
curl -X POST http://localhost:8080/api/kb/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"创业基础","description":"大学生创业基础知识"}'

# 预期输出：{"code":200,"data":{"id":1,"name":"创业基础","description":"大学生创业基础知识"},"message":"success"}
```

---

### 任务 2：创建前端 RAG 服务 ragService.ts

**文件：** Create `ai-mate/react-ai-chat/src/services/ragService.ts`

- [ ] 步骤 1：创建 RAG 服务，实现检索 → 拼接 prompt → 调用 AI 的完整流程

```typescript
// ai-mate/react-ai-chat/src/services/ragService.ts
/**
 * RAG（检索增强生成）服务
 * 流程：用户提问 → 检索知识库 → 拼接上下文 prompt → 调用 AI 流式生成
 */

import { chatWithZhipuStream, type ZhipuMessage } from './aiService';
import type { AIRole } from '../store/aiStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ========== 类型定义 ==========

export interface KnowledgeSnippet {
  id: number;
  title: string;
  snippet: string;
  relevance?: number;
}

export interface RagResult {
  answer: string;
  sources: KnowledgeSnippet[];
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ========== 知识库检索 ==========

/**
 * 调用后端检索知识库
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 5
): Promise<KnowledgeSnippet[]> {
  try {
    const res = await fetch(`${API_BASE}/kb/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.code === 200 ? data.data : [];
  } catch (error) {
    console.error('[RAG] 知识库检索失败:', error);
    return [];
  }
}

// ========== Prompt 构建 ==========

/**
 * 构建 RAG 增强后的系统提示词
 * 将检索到的知识片段注入到系统提示词中
 */
export function buildRagPrompt(
  basePrompt: string,
  snippets: KnowledgeSnippet[],
  userQuestion: string
): string {
  if (snippets.length === 0) {
    return basePrompt;
  }

  // 拼接知识上下文
  const knowledgeContext = snippets
    .map((s, i) => `【参考知识 ${i + 1}】（来源：${s.title}）\n${s.snippet}`)
    .join('\n\n---\n\n');

  return `${basePrompt}

【知识库参考信息】
以下是从知识库中检索到的相关资料，请优先参考这些信息回答用户问题。如果资料与问题不完全相关，请结合自身能力补充回答。

${knowledgeContext}

【注意事项】
- 引用知识库内容时请注明来源
- 如果知识库信息不足，请基于自身能力回答并说明
- 保持回答的专业性和准确性`;
}

// ========== RAG 主流程 ==========

/**
 * RAG 流式问答
 * 1. 检索知识库  2. 构建 prompt  3. 调用 AI 流式生成
 *
 * @param messages - 历史消息
 * @param onChunk - 流式回调
 * @param options - 角色和系统提示词
 */
export async function ragChatStream(
  messages: ZhipuMessage[],
  onChunk: (content: string) => void,
  options: {
    role: AIRole;
    systemPrompt: string;
    token?: string;
    enableRag?: boolean; // 是否启用 RAG，默认 true
  }
): Promise<{ sources: KnowledgeSnippet[] }> {
  const { systemPrompt, token, enableRag = true } = options;
  let snippets: KnowledgeSnippet[] = [];

  // 步骤1：检索知识库（取最后一条用户消息作为查询）
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (enableRag && lastUserMessage) {
    snippets = await searchKnowledgeBase(lastUserMessage.content, 5);
  }

  // 步骤2：构建增强 prompt
  const enhancedPrompt = buildRagPrompt(systemPrompt, snippets, lastUserMessage?.content || '');

  // 步骤3：调用 AI 流式生成
  await chatWithZhipuStream(messages, onChunk, {
    system_prompt: enhancedPrompt,
    token,
  });

  return { sources: snippets };
}

// ========== 知识库管理 API（供后台组件调用） ==========

export interface KbDocument {
  id: number;
  title: string;
  content: string;
  categoryId?: number;
  categoryName?: string;
  source?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KbCategory {
  id: number;
  name: string;
  description: string;
}

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token');
}

async function kbRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/kb${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

/** 获取文档列表 */
export async function fetchDocuments(params?: {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
}): Promise<{ list: KbDocument[]; total: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  if (params?.categoryId) query.set('categoryId', String(params.categoryId));
  if (params?.keyword) query.set('keyword', params.keyword);
  return kbRequest('GET', `/documents?${query.toString()}`);
}

/** 创建文档 */
export async function createKbDocument(data: Partial<KbDocument>): Promise<KbDocument> {
  return kbRequest('POST', '/documents', data);
}

/** 更新文档 */
export async function updateKbDocument(id: number, data: Partial<KbDocument>): Promise<void> {
  return kbRequest('PUT', `/documents/${id}`, data);
}

/** 删除文档 */
export async function deleteKbDocument(id: number): Promise<void> {
  return kbRequest('DELETE', `/documents/${id}`);
}

/** 获取分类列表 */
export async function fetchCategories(): Promise<KbCategory[]> {
  return kbRequest('GET', '/categories');
}

/** 创建分类 */
export async function createKbCategory(name: string, description?: string): Promise<KbCategory> {
  return kbRequest('POST', '/categories', { name, description });
}

/** 批量导入文档 */
export async function batchImportDocuments(documents: Partial<KbDocument>[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  return kbRequest('POST', '/documents/batch', { documents });
}
```

- [ ] 步骤 2：验证类型编译通过

```bash
cd ai-mate/react-ai-chat
npx tsc --noEmit
# 预期：无错误输出（EXIT CODE 0）
```

- [ ] 步骤 3：编写单元测试验证 RAG prompt 构建

```typescript
// ai-mate/react-ai-chat/src/services/__tests__/ragService.test.ts
import { buildRagPrompt } from '../ragService';

describe('buildRagPrompt', () => {
  it('无知识片段时返回原始 prompt', () => {
    const result = buildRagPrompt('你是助手', [], '你好');
    expect(result).toBe('你是助手');
  });

  it('有知识片段时拼接上下文', () => {
    const snippets = [{ id: 1, title: '创业指南', snippet: '创业第一步是市场调研' }];
    const result = buildRagPrompt('你是助手', snippets, '如何创业');
    expect(result).toContain('【参考知识 1】');
    expect(result).toContain('创业指南');
    expect(result).toContain('创业第一步是市场调研');
  });
});
```

---

### 任务 3：创建知识库管理后台组件 KnowledgeBaseManager.tsx

**文件：** Create `ai-mate/react-ai-chat/src/components/admin/KnowledgeBaseManager.tsx`

- [ ] 步骤 1：创建管理组件，包含列表、新增、编辑、搜索功能

```tsx
// ai-mate/react-ai-chat/src/components/admin/KnowledgeBaseManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, message, Space,
  Card, Tag, Popconfirm, Row, Col, Statistic, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  FileTextOutlined, FolderOutlined, ImportOutlined,
} from '@ant-design/icons';
import {
  fetchDocuments, createKbDocument, updateKbDocument, deleteKbDocument,
  fetchCategories, createKbCategory, batchImportDocuments,
  type KbDocument, type KbCategory,
} from '../../services/ragService';

const { TextArea } = Input;
const { Title } = Typography;

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  published: { text: '已发布', color: 'green' },
  archived: { text: '已归档', color: 'orange' },
};

const KnowledgeBaseManager: React.FC = () => {
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KbDocument | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDocuments({ page, pageSize: 10, categoryId, keyword });
      setDocuments(result.list);
      setTotal(result.total);
    } catch (err) {
      message.error('加载文档列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, keyword]);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      message.error('加载分类失败');
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 新增/编辑文档
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingDoc) {
        await updateKbDocument(editingDoc.id, values);
        message.success('更新成功');
      } else {
        await createKbDocument(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingDoc(null);
      loadDocuments();
    } catch (err) {
      if ((err as Error).message !== 'Validation failed') {
        message.error('操作失败');
      }
    }
  };

  // 删除文档
  const handleDelete = async (id: number) => {
    try {
      await deleteKbDocument(id);
      message.success('删除成功');
      loadDocuments();
    } catch {
      message.error('删除失败');
    }
  };

  // 打开编辑弹窗
  const openEdit = (doc: KbDocument) => {
    setEditingDoc(doc);
    form.setFieldsValue({
      title: doc.title,
      content: doc.content,
      categoryId: doc.categoryId,
      source: doc.source,
      tags: doc.tags,
      status: doc.status,
    });
    setModalOpen(true);
  };

  // 打开新增弹窗
  const openCreate = () => {
    setEditingDoc(null);
    form.resetFields();
    form.setFieldsValue({ status: 'published' });
    setModalOpen(true);
  };

  // 创建分类
  const handleCreateCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      await createKbCategory(values.name, values.description);
      message.success('分类创建成功');
      setCategoryModalOpen(false);
      categoryForm.resetFields();
      loadCategories();
    } catch {
      message.error('创建分类失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: KbDocument) => (
        <a onClick={() => openEdit(record)}>{text}</a>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (name: string) => name ? <Tag color="blue">{name}</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const conf = STATUS_MAP[status] || STATUS_MAP.published;
        return <Tag color={conf.color}>{conf.text}</Tag>;
      },
    },
    {
      title: '查看',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: KbDocument) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此文档？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <FileTextOutlined /> 知识库管理
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="文档总数" value={total} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="分类数" value={categories.length} prefix={<FolderOutlined />} /></Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索文档标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => { setPage(1); loadDocuments(); }}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择分类"
              style={{ width: '100%' }}
              allowClear
              value={categoryId}
              onChange={(v) => { setCategoryId(v); setPage(1); }}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<FolderOutlined />} onClick={() => setCategoryModalOpen(true)}>
                管理分类
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
                批量导入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新增文档
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 文档列表 */}
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: (p) => setPage(p),
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingDoc ? '编辑文档' : '新增文档'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingDoc(null); }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入文档标题" maxLength={255} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="分类">
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: '草稿', value: 'draft' },
                    { label: '已发布', value: 'published' },
                    { label: '已归档', value: 'archived' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="source" label="来源">
            <Input placeholder="如：教育部、知乎专栏等" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={8} placeholder="支持 Markdown 格式" showCount maxLength={10000} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分类管理弹窗 */}
      <Modal
        title="创建分类"
        open={categoryModalOpen}
        onOk={handleCreateCategory}
        onCancel={() => { setCategoryModalOpen(false); categoryForm.resetFields(); }}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="如：创业基础、融资技巧" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="分类描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <BatchImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => loadDocuments()}
      />
    </div>
  );
};

// 批量导入子组件
const BatchImportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const [importText, setImportText] = useState('');
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      let documents: Partial<KbDocument>[] = [];

      if (format === 'json') {
        documents = JSON.parse(importText);
      } else {
        // CSV 解析：每行一条，格式：title,content,category_id,source
        const lines = importText.trim().split('\n');
        const headers = lines[0].split(',');
        documents = lines.slice(1).map((line) => {
          const values = line.split(',');
          return {
            title: values[0],
            content: values[1],
            categoryId: values[2] ? Number(values[2]) : undefined,
            source: values[3],
          };
        });
      }

      const result = await batchImportDocuments(documents);
      message.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
      if (result.errors.length > 0) {
        message.warning(`错误详情：${result.errors.slice(0, 3).join('; ')}...`);
      }
      onClose();
      setImportText('');
      onSuccess();
    } catch (err) {
      message.error('导入失败，请检查格式');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title="批量导入文档"
      open={open}
      onOk={handleImport}
      onCancel={onClose}
      width={700}
      confirmLoading={importing}
      okText="导入"
    >
      <Space style={{ marginBottom: 16 }}>
        <Select
          value={format}
          onChange={setFormat}
          options={[
            { label: 'JSON 格式', value: 'json' },
            { label: 'CSV 格式', value: 'csv' },
          ]}
          style={{ width: 150 }}
        />
      </Space>
      <Input.TextArea
        rows={10}
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder={
          format === 'json'
            ? '[\n  {"title":"文档标题","content":"文档内容","categoryId":1,"source":"来源"}\n]'
            : 'title,content,category_id,source\n创业第一步,市场调研很重要,1,教育部'
        }
      />
      <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
        JSON 格式：数组，每个元素含 title、content 字段；CSV 格式：首行为表头
      </div>
    </Modal>
  );
};

export default KnowledgeBaseManager;
```

- [ ] 步骤 2：在管理页面中引入组件

修改 `ai-mate/react-ai-chat/src/pages/admin/AdminPage.tsx`，引入 `KnowledgeBaseManager`：

```tsx
// 在 AdminPage.tsx 中添加 Tab
import KnowledgeBaseManager from '../../components/admin/KnowledgeBaseManager';

// 在 Tabs 配置中新增
const items = [
  // ... 已有 Tab
  {
    key: 'knowledge',
    label: '知识库管理',
    children: <KnowledgeBaseManager />,
  },
];
```

- [ ] 步骤 3：验证组件渲染

```bash
cd ai-mate/react-ai-chat
npm run dev
# 访问 http://localhost:5173，进入管理后台，切换到"知识库管理"Tab
# 预期：看到统计卡片、搜索栏、文档列表表格
```

---

### 任务 4：实现知识库批量导入功能

**文件：** Modify `ai-mate/react-ai-chat/server.js`、Create `ai-mate/react-ai-chat/src/services/knowledgeService.js`（追加批量导入函数）

- [ ] 步骤 1：在 `knowledgeService.js` 中追加批量导入函数

```javascript
// 在 knowledgeService.js 末尾追加

/**
 * 批量导入文档
 * @param {Array} documents - 文档数组
 * @returns {Object} 导入结果统计
 */
export async function batchImport(documents) {
  const pool = getPool();
  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < documents.length; i++) {
    try {
      const doc = documents[i];
      if (!doc.title || !doc.content) {
        errors.push(`第 ${i + 1} 条：缺少 title 或 content`);
        failed++;
        continue;
      }

      await pool.execute(
        `INSERT INTO kb_documents (title, content, category_id, source, tags, status)
         VALUES (?, ?, ?, ?, ?, 'published')`,
        [
          doc.title,
          doc.content,
          doc.categoryId || null,
          doc.source || null,
          JSON.stringify(doc.tags || []),
        ]
      );
      success++;
    } catch (err) {
      errors.push(`第 ${i + 1} 条：${err.message}`);
      failed++;
    }
  }

  return { success, failed, errors };
}
```

- [ ] 步骤 2：在 `server.js` 中添加知识库 API 路由

在 `ai-mate/react-ai-chat/server.js` 中（在 `// AI 聊天接口` 之前）添加：

```javascript
import {
  listCategories, createCategory,
  listDocuments, getDocument, createDocument, updateDocument, deleteDocument,
  searchKnowledge, searchByKeyword, batchImport,
} from './src/services/knowledgeService.js';

// ========== 知识库 API ==========

// 获取分类列表
app.get('/api/kb/categories', async (req, res) => {
  try {
    const rows = await listCategories();
    res.json(success(rows));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 创建分类
app.post('/api/kb/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await createCategory(name, description);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 获取文档列表
app.get('/api/kb/documents', async (req, res) => {
  try {
    const result = await listDocuments({
      page: Number(req.query.page) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      keyword: req.query.keyword,
    });
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 获取文档详情
app.get('/api/kb/documents/:id', async (req, res) => {
  try {
    const doc = await getDocument(Number(req.params.id));
    if (!doc) return res.status(404).json(error('文档不存在', 404));
    res.json(success(doc));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 创建文档
app.post('/api/kb/documents', async (req, res) => {
  try {
    const result = await createDocument(req.body);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 更新文档
app.put('/api/kb/documents/:id', async (req, res) => {
  try {
    await updateDocument(Number(req.params.id), req.body);
    res.json(success({ message: '更新成功' }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 删除文档
app.delete('/api/kb/documents/:id', async (req, res) => {
  try {
    const deleted = await deleteDocument(Number(req.params.id));
    if (!deleted) return res.status(404).json(error('文档不存在', 404));
    res.json(success({ message: '删除成功' }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 全文检索
app.get('/api/kb/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q) return res.json(success([]));

    let results;
    try {
      results = await searchKnowledge(q, Number(limit) || 5);
    } catch {
      // 全文索引不可用时降级为 LIKE 查询
      results = await searchByKeyword(q, Number(limit) || 5);
    }
    res.json(success(results));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 批量导入
app.post('/api/kb/documents/batch', async (req, res) => {
  try {
    const { documents } = req.body;
    if (!Array.isArray(documents)) {
      return res.status(400).json(error('documents 必须是数组', 400));
    }
    const result = await batchImport(documents);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});
```

- [ ] 步骤 3：测试批量导入功能

```bash
# 准备测试 JSON 数据
# 保存为 test-kb.json
[
  {"title":"大学生创业政策汇总","content":"国家对大学生创业有税收优惠、创业补贴等支持政策...","categoryId":1,"source":"教育部"},
  {"title":"创业计划书写作指南","content":"一份完整的创业计划书应包含执行摘要、市场分析、运营计划...","source":"知乎"},
  {"title":"融资渠道对比","content":"天使轮、种子轮、A轮融资的特点和适用阶段对比分析...","source":"36氪"}
]

# 执行批量导入
curl -X POST http://localhost:8080/api/kb/documents/batch \
  -H "Content-Type: application/json" \
  -d @test-kb.json

# 预期输出：
# {"code":200,"data":{"success":3,"failed":0,"errors":[]},"message":"success"}

# 验证全文检索
curl "http://localhost:8080/api/kb/search?q=创业&limit=3"
# 预期输出包含 3 条匹配结果，每条含 id、title、snippet、relevance
```

- [ ] 步骤 4：测试 CSV 格式导入

```bash
# 在前端管理后台点击"批量导入"按钮
# 选择 CSV 格式，粘贴以下内容：
# title,content,category_id,source
# 市场调研方法,SWOT分析法和五力模型是常用的市场调研方法,1,教材
# 品牌定位策略,品牌定位需要明确目标受众和差异化价值,1,知乎

# 点击"导入"按钮
# 预期：弹出成功提示，列表自动刷新显示新文档
```

---

### 任务 5：在 AI 对话流程中集成 RAG

**文件：** Modify `ai-mate/react-ai-chat/server.js`（新增 `/api/ai/chat/stream` 接口）、Modify `ai-mate/react-ai-chat/src/services/aiService.ts`（前端调用新接口）

- [ ] 步骤 1：在 `server.js` 中创建集成 RAG 的流式对话接口

在 `server.js` 中（在 `/api/ai/zhipu` 路由之后）添加：

```javascript
import { searchKnowledge } from './src/services/knowledgeService.js';

/**
 * 构建 RAG 增强后的系统提示词
 */
function buildRagSystemPrompt(basePrompt, snippets) {
  if (!snippets || snippets.length === 0) {
    return basePrompt;
  }

  const knowledgeContext = snippets
    .map((s, i) => `【参考知识 ${i + 1}】（来源：${s.title}）\n${s.snippet}`)
    .join('\n\n---\n\n');

  return `${basePrompt}

【知识库参考信息】
以下是从知识库中检索到的相关资料，请优先参考这些信息回答用户问题。

${knowledgeContext}

【注意事项】
- 引用知识库内容时请注明来源
- 如果知识库信息不足，请基于自身能力回答并说明`;
}

// RAG 增强的 AI 流式对话接口
app.post('/api/ai/chat/stream', async (req, res) => {
  try {
    const { messages, role = 'scout', enableRag = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json(error('messages 参数缺失', 400));
    }

    // 角色系统提示词
    const SYSTEM_PROMPTS = {
      scout: '你是"探路者AI"，一位专业的资源对接专家。帮助用户发现和对接外部资源。',
      sage: '你是"军师AI"，一位资深的运营策略顾问。为用户提供运营策略规划和决策支持。',
      maker: '你是"工匠AI"，一位创意无限的内容创作专家。创作高质量的营销文案和品牌故事。',
      butler: '你是"管家AI"，一位贴心专业的客户服务管家。解答用户问题、处理售后反馈。',
    };

    let systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.scout;

    // 步骤1：RAG 检索（取最后一条用户消息作为查询）
    let sources = [];
    if (enableRag) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg) {
        try {
          sources = await searchKnowledge(lastUserMsg.content, 5);
        } catch (err) {
          console.error('[RAG] 检索失败，降级为无 RAG 模式:', err.message);
        }
      }
    }

    // 步骤2：构建增强 prompt
    systemPrompt = buildRagSystemPrompt(systemPrompt, sources);

    // 步骤3：设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 先发送知识来源信息（让前端知道引用了哪些资料）
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    // 步骤4：调用智谱 API 流式生成
    const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
    const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`智谱 API 请求失败: ${response.status}`);
    }

    // 步骤5：转发流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
          // 透传智谱的流式数据
          res.write(`data: ${data}\n\n`);
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('[AI Chat Stream] 错误:', err.message);
    // 如果还未开始流式输出，返回 JSON 错误
    if (!res.headersSent) {
      res.status(500).json(error(err.message));
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
});
```

- [ ] 步骤 2：在前端 `aiService.ts` 中添加调用新接口的函数

```typescript
// 在 ai-mate/react-ai-chat/src/services/aiService.ts 末尾追加

/**
 * RAG 增强流式对话（调用后端 /api/ai/chat/stream 接口）
 * 后端会先检索知识库，再调用 AI
 *
 * @param messages - 历史消息
 * @param onChunk - 流式文本回调
 * @param onSources - 知识来源回调（在流式开始前触发）
 * @param options - 角色和配置
 */
export async function chatWithRagStream(
  messages: ZhipuMessage[],
  onChunk: (content: string) => void,
  onSources: (sources: Array<{ id: number; title: string; snippet: string }>) => void,
  options: {
    role: AIRole;
    enableRag?: boolean;
    token?: string;
  }
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      role: options.role,
      enableRag: options.enableRag ?? true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`流式请求失败: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          // 知识来源信息
          if (parsed.type === 'sources') {
            onSources(parsed.sources || []);
            continue;
          }
          // 错误信息
          if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
          // AI 流式文本
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          if (e instanceof Error && e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }
  }
}
```

- [ ] 步骤 3：在对话页面中调用 RAG 流式接口

修改 `ai-mate/react-ai-chat/src/pages/ScoutAI.tsx`（其他 AI 页面同理）的发送消息逻辑：

```tsx
// 在 ScoutAI.tsx 中的发送消息函数中替换 chatWithZhipuStream 调用
import { chatWithRagStream, getSystemPrompt } from '../services/aiService';

const handleSend = async () => {
  // ... 已有的消息添加逻辑

  try {
    await chatWithRagStream(
      zhipuMessages,
      (content) => {
        // 流式追加内容
        updateMessage('scout', conversationId, assistantMsgId, currentContent + content);
      },
      (sources) => {
        // 可选：在 UI 中展示引用的知识来源
        console.log('引用知识:', sources);
        // 可以将 sources 存入 message 的 metadata 字段
      },
      { role: 'scout' }
    );
  } catch (err) {
    // 错误处理
  }
};
```

- [ ] 步骤 4：端到端测试 RAG 流程

```bash
# 1. 确保知识库中有数据（任务4已导入测试数据）

# 2. 测试后端 /api/ai/chat/stream 接口
curl -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"大学生创业有哪些政策支持？"}],"role":"sage","enableRag":true}'

# 预期输出（SSE 流式）：
# data: {"type":"sources","sources":[{"id":1,"title":"大学生创业政策汇总","snippet":"国家对大学生创业有税收优惠..."}]}
# data: {"choices":[{"delta":{"content":"根据"}}]}
# data: {"choices":[{"delta":{"content":"知识库"}}]}
# data: {"choices":[{"delta":{"content":"资料..."}}]}
# ...
# data: [DONE]

# 3. 前端测试
# 启动前端 dev server，进入对话页面
# 发送消息"如何写创业计划书"
# 预期：AI 回答中引用知识库内容，回答更专业准确

# 4. 对比测试（关闭 RAG）
curl -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"大学生创业有哪些政策支持？"}],"role":"sage","enableRag":false}'

# 预期：无 sources 事件，回答基于 AI 自身知识
```

- [ ] 步骤 5：验证 RAG 效果

```bash
# 测试用例验证清单：
# [ ] 知识库有匹配文档时，AI 回答引用知识库内容
# [ ] 知识库无匹配文档时，AI 正常回答（降级为无 RAG）
# [ ] sources 事件在流式文本之前发送
# [ ] enableRag=false 时跳过检索，直接调用 AI
# [ ] 智谱 API Key 未配置时返回友好错误提示
```

---

## 验收标准

1. 知识库表（`kb_categories`、`kb_documents`）创建成功，全文索引（ngram parser）可用
2. 后端知识库 CRUD API 全部可用（7 个接口）
3. 前端管理后台组件可进行文档的新增、编辑、删除、搜索
4. 批量导入支持 JSON 和 CSV 两种格式，返回成功/失败统计
5. `/api/ai/chat/stream` 接口先检索知识库再调用 AI，流式输出正常
6. 前端 `chatWithRagStream` 能正确解析 sources 事件和流式文本
7. RAG 关闭时（enableRag=false）正常降级
