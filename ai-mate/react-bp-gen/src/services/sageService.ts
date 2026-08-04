/**
 * Sage（军师）AI 员工 - API 服务层
 * 对接 /api/sage 后端接口
 */

const API_BASE = '/api/sage';

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token');
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(errorData.message || `请求失败: ${res.status}`);
  }

  const data = await res.json();
  return data.data ?? data;
}

// ==================== 类型定义 ====================

export interface SageSection {
  id: string;
  title: string;
  content: string;
  order: number;
  status: 'empty' | 'draft' | 'ai_generated' | 'reviewed';
}

export interface SageDocument {
  id: string;
  title: string;
  type: string;
  description: string;
  sections: SageSection[];
  createdAt: string;
  updatedAt: string;
}

export interface SageTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  typeLabel: string;
  icon: string;
  sections: { title: string; order: number }[];
}

export interface ReviewSuggestion {
  id: string;
  sectionId: string;
  sectionTitle: string;
  type: 'improvement' | 'warning' | 'error' | 'info';
  content: string;
  suggestion: string;
  accepted?: boolean;
}

export interface ReviewResult {
  documentId: string;
  overallScore: number;
  sectionScores: { sectionId: string; sectionTitle: string; score: number }[];
  suggestions: ReviewSuggestion[];
  summary: string;
}

// ==================== 文档 CRUD ====================

/** 获取文档列表 */
export async function getDocuments(): Promise<SageDocument[]> {
  return request<SageDocument[]>('GET', '/documents');
}

/** 获取单个文档详情 */
export async function getDocument(id: string): Promise<SageDocument> {
  return request<SageDocument>('GET', `/documents/${id}`);
}

/** 创建新文档 */
export async function createDocument(params: {
  title: string;
  type: string;
  templateId?: string;
}): Promise<SageDocument> {
  return request<SageDocument>('POST', '/documents', params);
}

/** 更新文档 */
export async function updateDocument(
  id: string,
  params: Partial<Pick<SageDocument, 'title' | 'sections'>>
): Promise<SageDocument> {
  return request<SageDocument>('PUT', `/documents/${id}`, params);
}

/** 删除文档 */
export async function deleteDocument(id: string): Promise<void> {
  return request<void>('DELETE', `/documents/${id}`);
}

// ==================== AI 生成 ====================

/** AI 生成某个章节的内容（非流式） */
export async function generateSection(
  documentId: string,
  sectionId: string,
  context?: string
): Promise<{ content: string }> {
  return request<{ content: string }>('POST', `/documents/${documentId}/sections/${sectionId}/generate`, {
    context,
  });
}

/** AI 生成某个章节的内容（SSE 流式） */
export async function generateSectionStream(
  documentId: string,
  sectionId: string,
  context: string,
  onChunk: (text: string) => void
): Promise<string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(
    `${API_BASE}/documents/${documentId}/sections/${sectionId}/generate-stream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ context }),
    }
  );

  if (!res.ok) {
    throw new Error(`AI 生成失败: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content || json.content;
        if (delta) {
          fullContent += delta;
          onChunk(fullContent);
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  }

  return fullContent;
}

// ==================== AI 评审 ====================

/** 提交文档进行 AI 评审 */
export async function submitReview(documentId: string): Promise<{ taskId: string }> {
  return request<{ taskId: string }>('POST', `/documents/${documentId}/review`);
}

/** 获取 AI 评审结果 */
export async function getReviewResult(documentId: string): Promise<ReviewResult> {
  return request<ReviewResult>('GET', `/documents/${documentId}/review`);
}

/** 接受某条建议 */
export async function acceptSuggestion(
  documentId: string,
  suggestionId: string
): Promise<void> {
  return request<void>('POST', `/documents/${documentId}/review/${suggestionId}/accept`);
}

/** 忽略某条建议 */
export async function ignoreSuggestion(
  documentId: string,
  suggestionId: string
): Promise<void> {
  return request<void>('POST', `/documents/${documentId}/review/${suggestionId}/ignore`);
}

// ==================== 预设模板 ====================

/** 获取预设模板列表 */
export function getPresetTemplates(): SageTemplate[] {
  return [
    {
      id: 'tpl-business-plan',
      title: '商业计划书',
      description: '适用于创业融资、项目路演，涵盖市场分析、商业模式、财务预测等核心模块',
      type: 'business_plan',
      typeLabel: '商业计划',
      icon: '📊',
      sections: [
        { title: '执行摘要', order: 1 },
        { title: '公司概述', order: 2 },
        { title: '市场分析', order: 3 },
        { title: '产品与服务', order: 4 },
        { title: '商业模式', order: 5 },
        { title: '竞争分析', order: 6 },
        { title: '团队介绍', order: 7 },
        { title: '财务预测', order: 8 },
        { title: '融资计划', order: 9 },
        { title: '风险分析', order: 10 },
      ],
    },
    {
      id: 'tpl-operation-strategy',
      title: '运营策略方案',
      description: '适用于企业运营规划，涵盖运营目标、流程优化、资源配置等模块',
      type: 'operation_strategy',
      typeLabel: '运营策略',
      icon: '⚙️',
      sections: [
        { title: '项目背景', order: 1 },
        { title: '运营目标', order: 2 },
        { title: '现状分析', order: 3 },
        { title: '运营策略', order: 4 },
        { title: '流程优化方案', order: 5 },
        { title: '资源配置计划', order: 6 },
        { title: '执行时间表', order: 7 },
        { title: 'KPI 考核指标', order: 8 },
        { title: '风险评估与应对', order: 9 },
      ],
    },
    {
      id: 'tpl-marketing-plan',
      title: '营销策划案',
      description: '适用于品牌推广、产品营销，涵盖市场定位、渠道策略、预算规划等模块',
      type: 'marketing_plan',
      typeLabel: '营销策划',
      icon: '📢',
      sections: [
        { title: '市场调研总结', order: 1 },
        { title: '目标受众分析', order: 2 },
        { title: '品牌定位', order: 3 },
        { title: '营销目标', order: 4 },
        { title: '营销策略', order: 5 },
        { title: '渠道规划', order: 6 },
        { title: '内容策略', order: 7 },
        { title: '预算分配', order: 8 },
        { title: '效果评估方案', order: 9 },
      ],
    },
    {
      id: 'tpl-growth-report',
      title: '增长策略报告',
      description: '适用于企业增长规划，涵盖增长模型、用户获取、留存策略等模块',
      type: 'growth_report',
      typeLabel: '增长策略',
      icon: '📈',
      sections: [
        { title: '增长现状', order: 1 },
        { title: '增长目标', order: 2 },
        { title: '北极星指标', order: 3 },
        { title: '增长模型分析', order: 4 },
        { title: '用户获取策略', order: 5 },
        { title: '用户激活与留存', order: 6 },
        { title: '变现策略', order: 7 },
        { title: '推荐与裂变', order: 8 },
        { title: '实验计划', order: 9 },
        { title: '增长预算与 ROI', order: 10 },
      ],
    },
    {
      id: 'tpl-industry-analysis',
      title: '行业对标分析',
      description: '适用于行业研究、竞品对标，涵盖行业概况、竞争格局、趋势预测等模块',
      type: 'industry_analysis',
      typeLabel: '行业对标',
      icon: '🔍',
      sections: [
        { title: '行业概述', order: 1 },
        { title: '市场规模与增速', order: 2 },
        { title: '产业链分析', order: 3 },
        { title: '竞争格局', order: 4 },
        { title: '标杆企业分析', order: 5 },
        { title: '对标维度与指标', order: 6 },
        { title: '差距分析', order: 7 },
        { title: '行业趋势预测', order: 8 },
        { title: '战略建议', order: 9 },
      ],
    },
  ];
}
