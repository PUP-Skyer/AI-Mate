import React, { useState } from 'react';
import { Avatar, Badge, Tag, Progress, Timeline, Card, Tabs } from 'antd';
import {
  TrendingUp,
  Users,
  Award,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { UserRole } from '../App';

interface Project {
  id: string;
  name: string;
  team: string;
  logo: string;
  industry: string;
  stage: string;
  funding: number;
  valuation: number;
  investorCount: number;
  expertScore: number;
  status: 'funding' | 'growing' | 'exited';
  description: string;
  highlights: string[];
  investmentDetails: {
    round: string;
    amount: number;
    investors: string[];
    date: string;
  }[];
  expertGuidance: {
    expert: string;
    field: string;
    content: string;
    date: string;
  }[];
  milestones: {
    date: string;
    title: string;
    status: 'completed' | 'current' | 'pending';
  }[];
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: '智创未来',
    team: '智创科技团队',
    logo: '智',
    industry: '人工智能',
    stage: 'A轮',
    funding: 2500,
    valuation: 12000,
    investorCount: 5,
    expertScore: 92,
    status: 'growing',
    description: '基于大语言模型的企业级智能助手平台，为企业提供定制化AI解决方案。',
    highlights: ['核心算法自研', '已服务50+企业客户', '年营收增长200%'],
    investmentDetails: [
      { round: '种子轮', amount: 300, investors: ['红杉种子基金', '真格基金'], date: '2024-03' },
      { round: '天使轮', amount: 800, investors: ['IDG资本', '高瓴创投'], date: '2024-09' },
      { round: 'A轮', amount: 1400, investors: ['红杉中国', '腾讯投资', '高瓴资本'], date: '2025-06' },
    ],
    expertGuidance: [
      { expert: '李教授', field: 'AI算法', content: '建议优化模型推理效率，降低部署成本，同时加强数据安全合规建设。', date: '2025-04-15' },
      { expert: '王总监', field: '商业模式', content: '产品矩阵清晰，建议拓展海外市场，特别是东南亚地区。', date: '2025-05-20' },
    ],
    milestones: [
      { date: '2024-01', title: '项目立项', status: 'completed' },
      { date: '2024-06', title: '产品MVP发布', status: 'completed' },
      { date: '2024-12', title: '获得种子轮融资', status: 'completed' },
      { date: '2025-03', title: '客户突破50家', status: 'completed' },
      { date: '2025-06', title: '完成A轮融资', status: 'completed' },
      { date: '2025-09', title: '海外市场拓展', status: 'current' },
      { date: '2026-03', title: 'B轮融资准备', status: 'pending' },
    ],
  },
  {
    id: '2',
    name: '绿能动力',
    team: '绿能创新实验室',
    logo: '绿',
    industry: '新能源',
    stage: 'Pre-A轮',
    funding: 1200,
    valuation: 6000,
    investorCount: 3,
    expertScore: 88,
    status: 'funding',
    description: '新一代固态电池技术研发，致力于解决电动汽车续航焦虑问题。',
    highlights: ['固态电池技术突破', '能量密度提升40%', '已通过安全认证'],
    investmentDetails: [
      { round: '天使轮', amount: 500, investors: ['宁德时代投资部'], date: '2024-08' },
      { round: 'Pre-A轮', amount: 700, investors: ['比亚迪投资', '红杉中国'], date: '2025-05' },
    ],
    expertGuidance: [
      { expert: '张院士', field: '材料科学', content: '固态电解质配方有创新性，建议加快中试线建设，验证量产可行性。', date: '2025-03-10' },
      { expert: '陈总工', field: '工程化', content: '工艺路线合理，但需关注成本控制，建议与头部电池厂建立合作。', date: '2025-06-18' },
    ],
    milestones: [
      { date: '2024-05', title: '实验室成立', status: 'completed' },
      { date: '2024-11', title: '技术验证完成', status: 'completed' },
      { date: '2025-02', title: '获得天使轮投资', status: 'completed' },
      { date: '2025-08', title: '中试线建设', status: 'current' },
      { date: '2026-02', title: '产品量产', status: 'pending' },
    ],
  },
  {
    id: '3',
    name: '医智云',
    team: '医智科技',
    logo: '医',
    industry: '智慧医疗',
    stage: 'B轮',
    funding: 5000,
    valuation: 35000,
    investorCount: 8,
    expertScore: 95,
    status: 'growing',
    description: 'AI辅助诊断平台，通过深度学习提升医学影像诊断准确率。',
    highlights: ['诊断准确率99.2%', '覆盖300+医院', '获得医疗器械认证'],
    investmentDetails: [
      { round: '种子轮', amount: 200, investors: ['天使湾创投'], date: '2023-06' },
      { round: '天使轮', amount: 600, investors: ['红杉种子基金'], date: '2023-12' },
      { round: 'A轮', amount: 1500, investors: ['IDG资本', '启明创投'], date: '2024-06' },
      { round: 'B轮', amount: 2700, investors: ['高瓴资本', '腾讯投资', '红杉中国'], date: '2025-03' },
    ],
    expertGuidance: [
      { expert: '刘主任', field: '临床医学', content: '产品临床价值显著，建议拓展更多病种，建立更完善的医生培训体系。', date: '2025-01-20' },
      { expert: '赵教授', field: '医疗AI', content: '算法性能优秀，建议加强数据隐私保护，符合医疗数据安全法规。', date: '2025-04-08' },
    ],
    milestones: [
      { date: '2023-03', title: '项目启动', status: 'completed' },
      { date: '2023-09', title: '首个产品原型', status: 'completed' },
      { date: '2024-03', title: '获得医疗器械二类证', status: 'completed' },
      { date: '2024-09', title: '覆盖100家医院', status: 'completed' },
      { date: '2025-03', title: '完成B轮融资', status: 'completed' },
      { date: '2025-12', title: '拓展海外市场', status: 'current' },
    ],
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  funding: { label: '融资中', color: '#3B82F6', icon: TrendingUp },
  growing: { label: '高速成长', color: '#10B981', icon: BarChart3 },
  exited: { label: '已退出', color: '#8B5CF6', icon: CheckCircle2 },
};

const ProjectCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: 20,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-glow)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <Avatar
          size={48}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            fontSize: 20,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {project.logo}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#E2E8F0', fontFamily: 'var(--font-heading)' }}>
              {project.name}
            </h3>
            <Tag style={{ background: `${status.color}20`, borderColor: `${status.color}40`, color: status.color, fontSize: 11 }}>
              <StatusIcon size={11} style={{ marginRight: 4, display: 'inline' }} />
              {status.label}
            </Tag>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>{project.description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>融资总额</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>¥{project.funding}万</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>估值</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>¥{project.valuation}万</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>专家评分</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>{project.expertScore}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>投资机构</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#8B5CF6' }}>{project.investorCount}家</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {project.highlights.map((h, i) => (
          <span
            key={i}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.15)',
              color: '#A78BFA',
              fontSize: 11,
            }}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
};

const ProjectDetail: React.FC<{ project: Project; userRole: UserRole; onBack: () => void }> = ({ project, userRole, onBack }) => {
  const tabItems = [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: '融资总额', value: `¥${project.funding}万`, color: '#10B981', icon: TrendingUp },
              { label: '当前估值', value: `¥${project.valuation}万`, color: '#3B82F6', icon: BarChart3 },
              { label: '专家评分', value: `${project.expertScore}分`, color: '#F59E0B', icon: Award },
              { label: '投资机构', value: `${project.investorCount}家`, color: '#8B5CF6', icon: Users },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon size={16} color={stat.color} />
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>项目亮点</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {project.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: 13, color: '#CBD5E1' }}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>发展里程碑</h4>
            <Timeline
              items={project.milestones.map((m) => ({
                color: m.status === 'completed' ? '#10B981' : m.status === 'current' ? '#3B82F6' : '#64748B',
                children: (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: m.status === 'pending' ? '#64748B' : '#E2E8F0' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{m.date}</div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'investment',
      label: '投资详情',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {project.investmentDetails.map((inv, i) => (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUp size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>{inv.round}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{inv.date}</div>
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>¥{inv.amount}万</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {inv.investors.map((investor, j) => (
                  <Tag key={j} style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}>
                    {investor}
                  </Tag>
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding: 20, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>融资进度</h4>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>累计融资</span>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>¥{project.funding}万</span>
              </div>
              <Progress
                percent={Math.min((project.funding / 5000) * 100, 100)}
                strokeColor="#10B981"
                railColor="rgba(255,255,255,0.06)"
                showInfo={false}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'guidance',
      label: '专家指导',
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {project.expertGuidance.map((guidance, i) => (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar
                  size={40}
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', fontSize: 16, fontWeight: 600 }}
                >
                  {guidance.expert[0]}
                </Avatar>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{guidance.expert}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{guidance.field} · {guidance.date}</div>
                </div>
              </div>
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(245,158,11,0.05)',
                  border: '1px solid rgba(245,158,11,0.1)',
                  fontSize: 13,
                  color: '#CBD5E1',
                  lineHeight: 1.6,
                }}
              >
                <Lightbulb size={14} color="#F59E0B" style={{ marginRight: 6, display: 'inline' }} />
                {guidance.content}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--border-light)',
          background: 'rgba(255,255,255,0.03)',
          color: '#94A3B8',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← 返回项目列表
      </button>

      <div
        style={{
          padding: 24,
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-light)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar
            size={64}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {project.logo}
          </Avatar>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-heading)' }}>
              {project.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}>
                {project.industry}
              </Tag>
              <Tag style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                {project.stage}
              </Tag>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>{project.team}</span>
            </div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#CBD5E1', lineHeight: 1.6 }}>{project.description}</p>
      </div>

      <Tabs
        items={tabItems}
        style={{ color: '#E2E8F0' }}
      />
    </div>
  );
};

const ProjectShowcase: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} userRole={userRole} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-heading)' }}>
          项目展示
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#94A3B8' }}>
          查看平台优质项目的融资详情、专家评估和发展里程碑
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
        ))}
      </div>
    </div>
  );
};

export default ProjectShowcase;
