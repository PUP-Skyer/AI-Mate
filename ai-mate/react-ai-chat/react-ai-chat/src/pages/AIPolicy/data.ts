/**
 * AI 创业政策 mock 数据
 * 统计值 total=386 与 3D 看板 PolicyCountCard 保持一致
 */
import type { AIPolicy, PolicyLink, PolicyStats } from './types';

export const POLICY_STATS: PolicyStats = {
  total: 386,
  weeklyNew: 12,
  activeCount: 57,
  orgCount: 68,
};

/** 扶持政策链接（列表页区块 + 政策详情关联） */
export const SUPPORT_LINKS: PolicyLink[] = [
  { id: 'SL-01', label: '工信部中小企业数字化转型试点城市申报指南', url: 'https://www.miit.gov.cn', category: 'support', source: '工业和信息化部' },
  { id: 'SL-02', label: '人社部创业担保贷款及贴息政策', url: 'https://www.mohrss.gov.cn', category: 'support', source: '人力资源社会保障部' },
  { id: 'SL-03', label: '国家发展改革委 AI 算力基础设施支持专项', url: 'https://www.ndrc.gov.cn', category: 'support', source: '国家发展改革委' },
  { id: 'SL-04', label: '大学生创新创业训练计划与创业补贴汇编', url: 'https://cy.ncss.cn', category: 'support', source: '全国大学生创业服务网' },
];

/** 单位官网（列表页区块 + 政策详情关联） */
export const OFFICIAL_SITES: PolicyLink[] = [
  { id: 'OS-01', label: '工业和信息化部官网', url: 'https://www.miit.gov.cn', category: 'official', source: '工信部' },
  { id: 'OS-02', label: '科学技术部官网', url: 'https://www.most.gov.cn', category: 'official', source: '科技部' },
  { id: 'OS-03', label: '国家发展改革委官网', url: 'https://www.ndrc.gov.cn', category: 'official', source: '发改委' },
  { id: 'OS-04', label: '中国中小企业信息网', url: 'https://www.sme.com.cn', category: 'official', source: '工信部' },
];

const mk = (
  id: string,
  title: string,
  level: AIPolicy['level'],
  department: string,
  publishedAt: string,
  deadline: string,
  supportType: string,
  amount: string,
  status: AIPolicy['status'],
  summary: string,
  keywords: string[],
  supportLinkIds: string[],
  officialLinkIds: string[],
  relatedIds: string[]
): AIPolicy => ({
  id,
  title,
  level,
  department,
  publishedAt,
  deadline,
  supportType,
  amount,
  status,
  summary,
  keywords,
  sections: [
    { id: `${id}-s1`, heading: '政策要点', type: 'points', points: [
      `适用对象为注册满 1 年、主营业务含人工智能相关技术的初创企业。`,
      `支持方式为${supportType}，单个企业最高${amount}。`,
      '申报材料需包含企业资质证明、项目方案与财务佐证，审批周期约 20 个工作日。',
    ]},
    { id: `${id}-s2`, heading: '申报条件', type: 'text',
      content: '企业需在境内注册且经营正常，近一年无重大违法违规记录；技术团队具备核心研发能力，项目具备明确的落地场景与可量化产出指标。' },
    { id: `${id}-s3`, heading: '申报建议', type: 'points', points: [
      '提前准备知识产权与研发投入台账，便于快速出具证明材料。',
      `留意${deadline}前完成线上申报，逾期系统自动关闭。`,
      '建议优先咨询属地主管部门确认细分条款适用性。',
    ]},
  ],
  supportLinks: supportLinkIds.map((sid) => SUPPORT_LINKS.find((l) => l.id === sid)!).filter(Boolean),
  officialLinks: officialLinkIds.map((oid) => OFFICIAL_SITES.find((l) => l.id === oid)!).filter(Boolean),
  relatedIds,
});

export const POLICIES: AIPolicy[] = [
  mk('PL-2026-0001', '北京市 AI 大模型算力券补贴（2026 年度）', '地市级', '北京市经济和信息化局', '2026-07-28', '2026-09-30', '算力券', '50 万元', '进行中',
    '面向在京注册的 AI 初创企业发放算力券，抵扣大模型训练与推理算力费用，降低创业早期研发成本。',
    ['算力券', '大模型', '北京', '研发补贴'], ['SL-03', 'SL-04'], ['OS-01', 'OS-03'], ['PL-2026-0002', 'PL-2026-0006']),
  mk('PL-2026-0002', '国家"人工智能+"行动专项申报指引', '国家级', '国家发展改革委', '2026-07-25', '2026-10-15', '专项资助', '500 万元', '进行中',
    '围绕"人工智能+"制造业、医疗、教育等方向遴选示范项目，对入选项目给予资金与资源配套支持。',
    ['人工智能+', '示范项目', '国家级'], ['SL-03'], ['OS-03', 'OS-01'], ['PL-2026-0001', 'PL-2026-0003']),
  mk('PL-2026-0003', '专精特新小巨人企业培育补贴（省级）', '省部级', '省工业和信息化厅', '2026-07-22', '2026-08-31', '一次性奖励', '30 万元', '进行中',
    '对首次认定的省级专精特新中小企业给予一次性奖励，并纳入省级培育库享受融资绿色通道。',
    ['专精特新', '小巨人', '培育补贴'], ['SL-01'], ['OS-01'], ['PL-2026-0002', 'PL-2026-0004']),
  mk('PL-2026-0004', '大学生创业担保贷款贴息新政', '地市级', '市人力资源和社会保障局', '2026-07-18', '2026-12-31', '贴息贷款', '30 万元', '即将截止',
    '高校毕业生创办 AI 企业可申请最高 30 万元创业担保贷款，财政按 LPR 的 50% 贴息。',
    ['创业担保贷款', '大学生创业', '贴息'], ['SL-02', 'SL-04'], ['OS-02'], ['PL-2026-0003', 'PL-2026-0001']),
  mk('PL-2026-0005', '生成式人工智能服务备案合规指引', '行业规范', '国家网信办', '2026-07-15', '长期有效', '备案指导', '—', '进行中',
    '明确生成式 AI 服务提供者备案流程与合规要点，为创业团队提供算法备案与安全评估操作手册。',
    ['生成式 AI', '备案', '合规'], ['SL-01'], ['OS-02', 'OS-01'], ['PL-2026-0001']),
  mk('PL-2026-0006', '数据中心绿色低碳发展专项行动支持', '国家级', '国家发展改革委', '2026-07-10', '2026-11-30', '项目补助', '200 万元', '进行中',
    '支持智算中心参与绿色低碳改造，对 PUE 达标项目给予一次性补助，鼓励绿电使用。',
    ['数据中心', '绿色低碳', '智算中心'], ['SL-03'], ['OS-03'], ['PL-2026-0002', 'PL-2026-0001']),
];

/**
 * API 预留：真实接口切换点
 * 接入后端时替换实现为：
 *   const resp = await authFetch('/policy/ai/list');
 *   if (!resp.ok) throw new Error('API 不可用');
 *   return (await resp.json()) as AIPolicy[];
 * 任何异常均回退 mock，保证页面可用（mock 兜底）。
 */
export async function fetchAIPolicies(): Promise<AIPolicy[]> {
  try {
    // TODO(api): 替换为真实接口调用（见计划第六节真实政策数据源调研）
    await new Promise((resolve) => setTimeout(resolve, 0));
    return [...POLICIES];
  } catch {
    return POLICIES; // 兜底
  }
}
