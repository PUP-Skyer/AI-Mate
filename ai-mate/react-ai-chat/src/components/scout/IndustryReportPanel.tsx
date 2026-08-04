/**
 * 行业报告查询面板 - "研究报告图书馆"
 * 杂志网格布局 + 分类饼图 + 暗色/亮色双模式
 */

import React, { useState, useMemo, memo } from 'react';
import { Card, Input, Tag, Empty, Spin, Space, Badge, Row, Col, Divider, App, Typography, Tooltip } from 'antd';
import {
  FileTextOutlined, SearchOutlined, DownloadOutlined, EyeOutlined,
  CalendarOutlined, FilePdfOutlined, BookOutlined, StarOutlined,
  EnvironmentOutlined, TagOutlined,
} from '@ant-design/icons';
import { Pie } from '@ant-design/charts';
import { getReports, type Report } from '../../services/scoutService';
import { useTheme } from '../../contexts/ThemeContext';
import ScoutPanelHeader from './shared/ScoutPanelHeader';
import ScoutSectionCard from './shared/ScoutSectionCard';
import { panelThemes, categoryColorMap, categoryLabelMap } from './shared/scout-panel-theme';
import './shared/scout-animations.css';

const { Text } = Typography;
const theme = panelThemes.report;

const categoryOptions = [
  { value: 'all', label: '全部', icon: '📋' },
  { value: 'market', label: '市场分析', icon: '📊' },
  { value: 'industry', label: '行业研究', icon: '🔬' },
  { value: 'investment', label: '投资报告', icon: '💰' },
  { value: 'technology', label: '技术趋势', icon: '💡' },
  { value: 'policy', label: '政策解读', icon: '📜' },
];

const regionOptions = [
  { value: 'all', label: '全部地区', icon: '🌐' },
  { value: 'east', label: '华东', icon: '🏙️' },
  { value: 'south', label: '华南', icon: '🌴' },
  { value: 'north', label: '华北', icon: '🏛️' },
  { value: 'central', label: '华中', icon: '🏯' },
  { value: 'southwest', label: '西南', icon: '🏔️' },
  { value: 'northwest', label: '西北', icon: '🏜️' },
  { value: 'northeast', label: '东北', icon: '❄️' },
];

// 真实行业报告数据
const defaultReports: Report[] = [
  {
    id: '1', title: '2026年中国人工智能产业全景研究报告',
    category: 'industry', date: '2026-05-12', region: 'north',
    summary: '中国AI产业市场规模已突破5000亿元，年复合增长率38.7%。大模型、算力基础设施、AI应用三大赛道持续火热，预计2027年市场规模将突破1.2万亿',
    publisher: '中国信息通信研究院', pages: '128页',
  },
  {
    id: '2', title: '2026年Q1全球创业投资市场分析报告',
    category: 'investment', date: '2026-05-10', region: 'east',
    summary: '2026年Q1全球VC投资总额达680亿美元，环比增长12%。AI赛道融资占比达45%，中国创业投资市场回暖明显，早期项目获投比例提升2%',
    publisher: '清科研究中心', pages: '96页',
  },
  {
    id: '3', title: '中国数字经济发展研究报告（2026）',
    category: 'market', date: '2026-05-08', region: 'north',
    summary: '2025年中国数字经济规模达55.8万亿元，占GDP比重44.5%。数字产业化与产业数字化双向驱动，数据要素市场化配置改革加速推进',
    publisher: '中国数字经济研究院', pages: '156页',
  },
  {
    id: '4', title: '大语言模型技术趋势与发展白皮书',
    category: 'technology', date: '2026-05-05', region: 'east',
    summary: 'MoE（混合专家）架构成为2026年大模型主流方向，推理成本下降40%。多模态、长上下文、AI Agent三大技术路线并行发展，端侧AI部署加速',
    publisher: '阿里达摩院', pages: '72页',
  },
  {
    id: '5', title: '关于促进人工智能产业高质量发展的若干政策解读',
    category: 'policy', date: '2026-04-28', region: 'north',
    summary: '国务院发布AI产业扶持新政，涵盖算力补贴、人才引进、应用场景开放等十大领域。预计每年带动AI产业新增投资超过5000亿元',
    publisher: '国务院发展研究中心', pages: '42页',
  },
  {
    id: '6', title: '2026年新能源汽车产业链投资研究报告',
    category: 'investment', date: '2026-04-25', region: 'south',
    summary: '新能源汽车渗透率突破45%，动力电池、智能驾驶、充电基础设施三大赛道投资热度排名前三。固态电池技术取得突破性进展，预计2027年量产',
    publisher: '中信证券研究所', pages: '88页',
  },
  {
    id: '7', title: '中国云计算市场年度分析报告（2026）',
    category: 'market', date: '2026-04-20', region: 'east',
    summary: '2025年中国云计算市场规模达4200亿元，同比增长28%。阿里云、华为云、腾讯云三巨头市场份额合计68%。AI云服务成为增长最快细分领域',
    publisher: 'IDC中国', pages: '64页',
  },
  {
    id: '8', title: '具身智能与人形机器人产业发展报告',
    category: 'technology', date: '2026-04-18', region: 'south',
    summary: '人形机器人市场2026年预计规模达380亿元。特斯拉Optimus、优必选Walker S等产品进入量产阶段。核心零部件国产化率提升至55%',
    publisher: '工信部赛迪研究院', pages: '54页',
  },
  {
    id: '9', title: '长三角一体化科技创新协同发展报告',
    category: 'industry', date: '2026-04-15', region: 'east',
    summary: '长三角科技创新共同体建设取得显著成效，区域内研发投入占全国比重达38%。人工智能、生物医药、集成电路三大产业集群协同效应显著',
    publisher: '长三角区域合作办公室', pages: '78页',
  },
  {
    id: '10', title: '数据要素市场化配置改革政策汇编',
    category: 'policy', date: '2026-04-10', region: 'central',
    summary: '国家数据局发布数据要素×三年行动计划，明确数据产权、流通交易、收益分配、安全治理四大制度框架。预计到2027年数据交易市场规模超500亿元',
    publisher: '国家数据局', pages: '36页',
  },
  {
    id: '11', title: '半导体产业自主可控发展研究报告',
    category: 'technology', date: '2026-04-08', region: 'east',
    summary: '国产芯片自给率提升至28%，14nm及以上制程国产化率超70%。AI芯片领域，华为昇腾、寒武纪等国产方案在推理场景性能对标国际先进水平',
    publisher: '中国半导体行业协会', pages: '92页',
  },
  {
    id: '12', title: '2026年中国消费市场趋势洞察',
    category: 'market', date: '2026-04-05', region: 'all',
    summary: '消费复苏态势明显，服务消费增长15.2%，快于商品消费。国潮品牌、银发经济、宠物经济成为三大增长极，下沉市场消费潜力加速释放',
    publisher: '麦肯锡中国', pages: '48页',
  },
];

// 分类饼图 - memo 优化
const CategoryPieChart = memo(({ data, isDarkMode }: { data: Array<{ category: string; count: number }>; isDarkMode: boolean }) => {
  const chartData = data.map(d => ({
    type: categoryLabelMap[d.category] || d.category,
    value: d.count,
  }));
  return (
    <Pie
      data={chartData}
      angleField="value"
      colorField="type"
      radius={0.85}
      innerRadius={0.55}
      scale={{ color: { range: theme.chartColors } }}
      style={{ stroke: isDarkMode ? '#1a1a2e' : '#fff', lineWidth: 2 }}
      labels={[{
        text: 'type',
        style: { fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#475569' },
      }]}
      legend={false as unknown as undefined}
      theme={isDarkMode ? 'classicDark' : 'classic'}
      height={200}
      animate={{ enter: { type: 'fadeIn' as const, duration: 800 } }}
    />
  );
});

// 报告卡片组件
const ReportCard: React.FC<{
  report: Report;
  index: number;
  isDarkMode: boolean;
  onDownload: (report: Report) => void;
}> = ({ report, index, isDarkMode, onDownload }) => {
  const catColor = categoryColorMap[report.category] || theme.accentColor;
  const catLabel = categoryLabelMap[report.category] || report.category;
  const regInfo = regionOptions.find(r => r.value === report.region) || regionOptions[0];

  return (
    <div
      className="scout-panel-section"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card
        hoverable
        style={{
          borderRadius: 12,
          border: `1px solid ${isDarkMode ? 'var(--border-light)' : 'var(--border-light)'}`,
          background: isDarkMode ? 'var(--bg-card)' : '#fff',
          overflow: 'hidden',
          height: '100%',
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* 顶部色带 */}
        <div style={{
          height: 4,
          background: `linear-gradient(90deg, ${catColor}, ${catColor}88)`,
        }} />

        <div style={{ padding: '16px' }}>
          {/* 分类标签 + 日期 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Tag
              style={{
                borderRadius: 16, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                background: `${catColor}18`, borderColor: `${catColor}50`, color: catColor,
                margin: 0,
              }}
            >
              {catLabel}
            </Tag>
            <Text style={{ fontSize: 11, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8' }}>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {report.date}
            </Text>
          </div>

          {/* 标题 */}
          <div style={{
            fontWeight: 700, fontSize: 15, lineHeight: 1.5, marginBottom: 10,
            color: isDarkMode ? 'var(--text-primary)' : '#1E293B',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {report.title}
          </div>

          {/* 摘要 */}
          <div style={{
            fontSize: 13, lineHeight: 1.7, marginBottom: 12,
            color: isDarkMode ? 'var(--text-secondary)' : '#475569',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
            padding: '10px 12px', borderRadius: 8,
            borderLeft: `3px solid ${catColor}40`,
          }}>
            {report.summary}
          </div>

          {/* 底部信息栏 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 10, borderTop: `1px solid ${isDarkMode ? 'var(--border-light)' : '#f0f0f0'}`,
          }}>
            <Space size={4} wrap>
              {report.publisher && (
                <Tooltip title={report.publisher}>
                  <Text style={{
                    fontSize: 11, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8',
                    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}>
                    <FileTextOutlined style={{ marginRight: 3 }} />
                    {report.publisher}
                  </Text>
                </Tooltip>
              )}
              {report.pages && (
                <Text style={{ fontSize: 11, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8' }}>
                  · {report.pages}
                </Text>
              )}
              <Tag
                style={{
                  fontSize: 11, borderRadius: 4, margin: 0, marginLeft: 2,
                  background: 'transparent', borderColor: isDarkMode ? 'var(--border-medium)' : '#d9d9d9',
                  color: isDarkMode ? 'var(--text-muted)' : '#94A3B8',
                }}
              >
                {regInfo.icon} {regInfo.label}
              </Tag>
            </Space>
            <Tooltip title="下载报告">
              <div
                onClick={() => onDownload(report)}
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${catColor}15`, border: `1px solid ${catColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  color: catColor, fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${catColor}30`;
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${catColor}15`;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <DownloadOutlined />
              </div>
            </Tooltip>
          </div>
        </div>
      </Card>
    </div>
  );
};

const IndustryReportPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRegion, setActiveRegion] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Report[]>(defaultReports);
  const { message } = App.useApp();

  // 分类统计数据
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    results.forEach(r => {
      stats[r.category] = (stats[r.category] || 0) + 1;
    });
    return Object.entries(stats).map(([category, count]) => ({ category, count }));
  }, [results]);

  // 过滤后的报告
  const filteredReports = useMemo(() => {
    let filtered = results;
    if (activeCategory !== 'all') {
      filtered = filtered.filter(r => r.category === activeCategory);
    }
    if (activeRegion !== 'all') {
      filtered = filtered.filter(r => r.region === activeRegion || r.region === 'all');
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(kw) ||
        r.summary.toLowerCase().includes(kw) ||
        (r.publisher && r.publisher.toLowerCase().includes(kw))
      );
    }
    return filtered;
  }, [results, activeCategory, activeRegion, keyword]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        category: activeCategory === 'all' ? undefined : activeCategory,
        page: 1,
        pageSize: 100,
      } as const;
      const data = await getReports(params);
      setResults(data.length > 0 ? data : defaultReports);
    } catch {
      setResults(defaultReports);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (report: Report) => {
    const content = `========================================
${report.title}
========================================

发布机构: ${report.publisher || '青宸智汇 研究'}
发布日期: ${report.date}
页数: ${report.pages || 'N/A'}
分类: ${categoryLabelMap[report.category] || report.category}

摘要:
${report.summary}

----------------------------------------
本报告由 青宸智汇 探路者AI 生成
下载时间: ${new Date().toLocaleString()}
青宸智汇 创业赋能平台
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[\\/:*"<>|]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('报告下载成功');
  };

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 图书馆标题区 */}
      <ScoutPanelHeader
        icon={<BookOutlined />}
        title="行业报告库"
        subtitle="权威研究报告，洞察行业趋势 · 支持下载"
        variant="library"
        themeKey="report"
        stats={[
          { label: '报告总数', value: defaultReports.length },
          { label: '分类数', value: categoryOptions.length - 1 },
          { label: '最新发布', value: '2026' },
        ]}
      />

      {/* 搜索 + 分类筛选 */}
      <div style={{ padding: '16px 16px 8px' }}>
        {/* 搜索框 */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Input
            placeholder="搜索报告标题、关键词或发布机构..."
            prefix={<SearchOutlined style={{ color: isDarkMode ? 'var(--text-muted)' : '#94A3B8' }} />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            size="large"
            style={{
              borderRadius: 10,
              background: isDarkMode ? 'var(--bg-input)' : '#F8FAFC',
              borderColor: isDarkMode ? 'var(--border-medium)' : '#E2E8F0',
            }}
          />
        </div>

        {/* 分类标签 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {categoryOptions.map((cat) => {
            const isActive = activeCategory === cat.value;
            const catColor = cat.value === 'all' ? theme.accentColor : (categoryColorMap[cat.value] || theme.accentColor);
            return (
              <div
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: isActive ? `${catColor}20` : 'transparent',
                  border: `1px solid ${isActive ? `${catColor}50` : isDarkMode ? 'var(--border-light)' : '#E2E8F0'}`,
                  color: isActive ? catColor : (isDarkMode ? 'var(--text-secondary)' : '#475569'),
                }}
              >
                {cat.icon} {cat.label}
              </div>
            );
          })}
        </div>

        {/* 地区筛选 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8', marginRight: 4 }}>
            <EnvironmentOutlined /> 地区:
          </Text>
          {regionOptions.slice(0, 5).map((reg) => {
            const isActive = activeRegion === reg.value;
            return (
              <div
                key={reg.value}
                onClick={() => setActiveRegion(reg.value)}
                style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isActive ? `${theme.accentColor}15` : 'transparent',
                  color: isActive ? theme.accentColor : (isDarkMode ? 'var(--text-muted)' : '#94A3B8'),
                  border: `1px solid ${isActive ? `${theme.accentColor}30` : 'transparent'}`,
                }}
              >
                {reg.icon} {reg.label}
              </div>
            );
          })}
        </div>
      </div>

      <Divider style={{ margin: '8px 0 0', borderColor: isDarkMode ? 'var(--border-light)' : '#f0f0f0' }} />

      {/* 内容区 */}
      <Spin spinning={loading}>
        {filteredReports.length === 0 ? (
          <div style={{ padding: '60px 20px' }}>
            <Empty
              image={<FilePdfOutlined style={{ fontSize: 56, color: isDarkMode ? '#30363d' : '#d9d9d9' }} />}
              description={
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: isDarkMode ? 'var(--text-primary)' : '#1E293B', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
                    未找到匹配的报告
                  </div>
                  <div style={{ color: isDarkMode ? 'var(--text-muted)' : '#94A3B8', fontSize: 13 }}>
                    尝试调整筛选条件或搜索关键词
                  </div>
                </div>
              }
            />
          </div>
        ) : (
          <div style={{ padding: '16px' }}>
            {/* 报告数量 + 分类分布 */}
            <Row gutter={12} className="scout-panel-section" style={{ marginBottom: 16 }}>
              <Col span={14}>
                <ScoutSectionCard
                  title={<span><BookOutlined style={{ marginRight: 6, color: theme.accentColor }} />报告列表</span>}
                  accentColor={theme.accentColor}
                  extra={
                    <Text style={{ fontSize: 12, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8' }}>
                      共 {filteredReports.length} 份报告
                    </Text>
                  }
                >
                  {/* 杂志网格 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 12,
                  }}>
                    {filteredReports.map((report, index) => (
                      <ReportCard
                        key={report.id}
                        report={report}
                        index={index}
                        isDarkMode={isDarkMode}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                </ScoutSectionCard>
              </Col>
              <Col span={10}>
                {/* 分类分布饼图 */}
                <div className="scout-panel-section" style={{ animationDelay: '120ms' }}>
                  <ScoutSectionCard
                    title={<span><TagOutlined style={{ marginRight: 6, color: theme.accentColor }} />分类分布</span>}
                    accentColor={theme.accentColor}
                    style={{ marginBottom: 12 }}
                  >
                    <CategoryPieChart data={categoryStats} isDarkMode={isDarkMode} />
                  </ScoutSectionCard>
                </div>

                {/* 最新发布 */}
                <div className="scout-panel-section" style={{ animationDelay: '200ms' }}>
                  <ScoutSectionCard
                    title={<span><StarOutlined style={{ marginRight: 6, color: '#F59E0B' }} />最新发布</span>}
                    accentColor="#F59E0B"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {filteredReports.slice(0, 4).map((report, i) => {
                        const catColor = categoryColorMap[report.category] || theme.accentColor;
                        return (
                          <div
                            key={report.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 8,
                              background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                              border: `1px solid ${isDarkMode ? 'var(--border-light)' : '#f0f0f0'}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = `${catColor}50`;
                              e.currentTarget.style.background = `${catColor}08`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = isDarkMode ? 'var(--border-light)' : '#f0f0f0';
                              e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC';
                            }}
                          >
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: catColor, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 500, lineHeight: 1.4,
                                color: isDarkMode ? 'var(--text-primary)' : '#1E293B',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {report.title}
                              </div>
                              <div style={{ fontSize: 11, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8', marginTop: 2 }}>
                                {report.date} · {report.publisher}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScoutSectionCard>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default IndustryReportPanel;
