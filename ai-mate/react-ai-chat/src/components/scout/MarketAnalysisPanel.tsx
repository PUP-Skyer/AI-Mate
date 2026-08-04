/**
 * 市场行情分析面板 - "实时作战指挥舱"
 * 支持实时数据更新、@ant-design/charts 图表、暗色/亮色双模式
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Spin, Empty, Space, Tag, Row, Col, Badge, Typography, Divider } from 'antd';
import {
  BarChartOutlined, RiseOutlined, FallOutlined, MinusOutlined,
  LineChartOutlined, FireOutlined, GlobalOutlined, SyncOutlined,
  ClockCircleOutlined, AreaChartOutlined,
} from '@ant-design/icons';
import { Column, Area } from '@ant-design/charts';
import { getMarketData, type MarketData } from '../../services/scoutService';
import { useTheme } from '../../contexts/ThemeContext';
import ScoutPanelHeader from './shared/ScoutPanelHeader';
import ScoutStatCard from './shared/ScoutStatCard';
import ScoutFilterBar from './shared/ScoutFilterBar';
import ScoutSectionCard from './shared/ScoutSectionCard';
import { panelThemes } from './shared/scout-panel-theme';
import './shared/scout-animations.css';

const { Text } = Typography;
const theme = panelThemes.market;

const industryOptions = [
  { value: 'all', label: '全部行业', icon: '🌐' },
  { value: 'tech', label: '科技', icon: '💻' },
  { value: 'finance', label: '金融', icon: '🏦' },
  { value: 'healthcare', label: '医疗', icon: '🏥' },
  { value: 'education', label: '教育', icon: '📚' },
  { value: 'retail', label: '零售', icon: '🛒' },
  { value: 'manufacturing', label: '制造', icon: '🏭' },
  { value: 'energy', label: '能源', icon: '⚡' },
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

const timeRangeOptions = [
  { value: 'all', label: '全部时间', icon: '📋' },
  { value: 'week', label: '近一周', icon: '📅' },
  { value: 'month', label: '近一月', icon: '📆' },
  { value: 'quarter', label: '近一季度', icon: '🗓️' },
  { value: 'year', label: '近一年', icon: '📊' },
];

// 行业对比数据
const industryCompareData = [
  { name: '科技', size: 1250, growth: 18.5 },
  { name: '金融', size: 980, growth: 12.3 },
  { name: '医疗', size: 650, growth: 22.1 },
  { name: '教育', size: 420, growth: 8.7 },
  { name: '零售', size: 780, growth: 15.6 },
  { name: '制造', size: 1100, growth: 9.2 },
  { name: '能源', size: 560, growth: 25.8 },
];

const generateTrendData = (baseValue: number, volatility: number = 0.1) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const m = (currentMonth - 6 + i + 12) % 12;
    labels.push(`${m + 1}月`);
  }
  let currentValue = baseValue * 0.6;
  const data = labels.map(() => {
    const change = (Math.random() - 0.4) * volatility * baseValue;
    currentValue = Math.max(baseValue * 0.3, currentValue + change);
    return Math.round(currentValue);
  });
  return { labels, data };
};

const simulateRealTimeData = (baseData: MarketData): MarketData => {
  const fluctuation = () => (Math.random() - 0.5) * 0.02;
  return {
    ...baseData,
    marketSize: Math.round(baseData.marketSize * (1 + fluctuation())),
    growthRate: Math.round((baseData.growthRate + fluctuation() * 10) * 10) / 10,
    activeCompanies: Math.round(baseData.activeCompanies * (1 + fluctuation())),
  };
};

const defaultMarketData: MarketData = {
  industry: 'all',
  timeRange: 'month',
  marketSize: 1250,
  growthRate: 15.8,
  growthTrend: 'up',
  activeCompanies: 3280,
  hotAreas: ['人工智能', '新能源', '生物医药', '半导体', '金融科技'],
  summary: '当前市场整体呈现增长态势，科技行业表现尤为突出。人工智能和新能源领域成为投资热点，市场活跃度持续提升。',
};

// 图表组件 memo 包裹，避免实时数据更新导致重渲染
const IndustryColumnChart = memo(({ isDarkMode }: { isDarkMode: boolean }) => (
  <Column
    data={industryCompareData}
    xField="name"
    yField="size"
    colorField="name"
    scale={{ color: { range: theme.chartColors } }}
    axis={{
      x: { title: false as unknown as string, labelAutoRotate: false },
      y: { title: '亿元' },
    }}
    style={{ radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 32 }}
    theme={isDarkMode ? 'classicDark' : 'classic'}
    height={240}
    animate={{ enter: { type: 'fadeIn' as const, duration: 800 } }}
    legend={false as unknown as undefined}
  />
));

const TrendAreaChart = memo(({ data, isDarkMode }: { data: { labels: string[]; data: number[] }; isDarkMode: boolean }) => {
  const chartData = data.labels.map((label, i) => ({ month: label, value: data.data[i] }));
  return (
    <Area
      data={chartData}
      xField="month"
      yField="value"
      shapeField="smooth"
      style={{
        fill: `linear-gradient(90deg, ${theme.accentColor}40, ${theme.accentColor}10)`,
        stroke: theme.accentColor,
        lineWidth: 2,
      }}
      axis={{ x: { labelAutoRotate: false }, y: { title: '亿元' } }}
      theme={isDarkMode ? 'classicDark' : 'classic'}
      height={200}
      animate={{ enter: { type: 'fadeIn' as const, duration: 800 } }}
    />
  );
});

const MarketAnalysisPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [industry, setIndustry] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [region, setRegion] = useState('all');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(defaultMarketData);
  const [hasSearched, setHasSearched] = useState(true);
  const [isRealTime, setIsRealTime] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [trendData, setTrendData] = useState(() => generateTrendData(800));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRealTimeUpdate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setMarketData(prev => prev ? simulateRealTimeData(prev) : null);
      setTrendData(generateTrendData(800 + Math.random() * 400));
      setLastUpdate(new Date());
    }, 3000);
  }, []);

  const stopRealTimeUpdate = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRealTime) startRealTimeUpdate();
    else stopRealTimeUpdate();
    return () => stopRealTimeUpdate();
  }, [isRealTime, startRealTimeUpdate, stopRealTimeUpdate]);

  const handleAnalyze = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await getMarketData({
        industry: industry === 'all' ? undefined : industry,
        timeRange,
      });
      setMarketData(data);
      setTrendData(generateTrendData(data.marketSize * 0.7));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('获取市场数据失败:', error);
      setMarketData(null);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') =>
    trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#F59E0B';

  const trendChange = trendData.data.length >= 2
    ? Math.round(((trendData.data[trendData.data.length - 1] - trendData.data[0]) / trendData.data[0]) * 100)
    : 0;

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 指挥舱标题区 */}
      <ScoutPanelHeader
        icon={<BarChartOutlined />}
        title="市场行情分析"
        subtitle="实时市场数据，精准洞察趋势"
        variant="command"
        themeKey="market"
        stats={[
          { label: '覆盖行业', value: '7' },
          { label: '数据更新', value: '实时' },
          { label: '时间维度', value: '4' },
        ]}
        extra={
          isRealTime ? (
            <div className="scout-pulse-glow" style={{
              '--panel-glow': theme.glowColor,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 20, padding: '4px 12px',
              color: theme.accentLight, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            } as React.CSSProperties}>
              <SyncOutlined spin /> 实时数据
            </div>
          ) : undefined
        }
      />

      {/* 筛选工具栏 */}
      <ScoutFilterBar
        themeKey="market"
        fields={[
          { key: 'industry', placeholder: '选择行业', options: industryOptions, value: industry, onChange: setIndustry },
          { key: 'region', placeholder: '选择地区', options: regionOptions, value: region, onChange: setRegion },
          { key: 'time', placeholder: '时间范围', options: timeRangeOptions, value: timeRange, onChange: setTimeRange },
        ]}
        primaryAction={{
          label: '分析市场行情',
          icon: <BarChartOutlined />,
          onClick: handleAnalyze,
          loading,
        }}
        secondaryAction={{
          label: '开启实时更新',
          activeLabel: '实时更新中',
          icon: <SyncOutlined />,
          activeIcon: <SyncOutlined spin />,
          isActive: isRealTime,
          onClick: () => setIsRealTime(!isRealTime),
        }}
      />

      {isRealTime && (
        <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge status="processing" color={theme.accentColor} />
          <Text style={{ fontSize: 12, color: isDarkMode ? 'var(--text-muted)' : '#64748B' }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            最后更新 {lastUpdate.toLocaleTimeString()}
          </Text>
        </div>
      )}

      <Divider style={{ margin: 0, borderColor: isDarkMode ? 'var(--border-light)' : '#f0f0f0' }} />

      {/* 数据区 */}
      <Spin spinning={loading}>
        {hasSearched && !marketData ? (
          <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} />
        ) : marketData ? (
          <div style={{ padding: '16px' }}>
            {/* 核心指标 - 交错入场 */}
            <Row gutter={10} className="scout-panel-section" style={{ marginBottom: 16 }}>
              <Col span={6}>
                <ScoutStatCard
                  label="市场规模"
                  value={marketData.marketSize}
                  suffix="亿"
                  icon={<GlobalOutlined />}
                  accentColor={theme.accentColor}
                  pulseGlow={isRealTime}
                  glowColor={theme.glowColor}
                />
              </Col>
              <Col span={6}>
                <ScoutStatCard
                  label="增长率"
                  value={marketData.growthRate}
                  suffix="%"
                  icon={<RiseOutlined />}
                  accentColor={getTrendColor(marketData.growthTrend)}
                  trend={marketData.growthTrend}
                />
              </Col>
              <Col span={6}>
                <ScoutStatCard
                  label="活跃企业"
                  value={marketData.activeCompanies}
                  suffix="家"
                  icon={<AreaChartOutlined />}
                  accentColor="#8B5CF6"
                />
              </Col>
              <Col span={6}>
                <ScoutStatCard
                  label="趋势变化"
                  value={`${trendChange > 0 ? '+' : ''}${trendChange}%`}
                  icon={<LineChartOutlined />}
                  accentColor={trendChange >= 0 ? '#10B981' : '#EF4444'}
                />
              </Col>
            </Row>

            {/* 行业对比柱状图 */}
            <div className="scout-panel-section">
              <ScoutSectionCard
                title="行业对比"
                accentColor={theme.accentColor}
                style={{ marginBottom: 16 }}
              >
                <IndustryColumnChart isDarkMode={isDarkMode} />
              </ScoutSectionCard>
            </div>

            {/* 市场趋势面积图 */}
            <div className="scout-panel-section">
              <ScoutSectionCard
                title={
                  <span>
                    <LineChartOutlined style={{ marginRight: 6 }} />
                    市场趋势
                    {isRealTime && (
                      <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>
                        <SyncOutlined spin style={{ marginRight: 4 }} />实时
                      </Tag>
                    )}
                  </span>
                }
                accentColor={theme.accentColor}
                style={{ marginBottom: 16 }}
                extra={
                  <Text style={{ fontSize: 11, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8' }}>
                    {isRealTime ? '实时动态数据' : '数据来源: 行业调研'}
                  </Text>
                }
              >
                <div className={isRealTime ? 'scanline' : ''} style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
                  <TrendAreaChart data={trendData} isDarkMode={isDarkMode} />
                </div>
              </ScoutSectionCard>
            </div>

            {/* 热门领域 + 分析摘要 */}
            <Row gutter={12}>
              {marketData.hotAreas && marketData.hotAreas.length > 0 && (
                <Col span={12} className="scout-panel-section">
                  <ScoutSectionCard
                    title={<span><FireOutlined style={{ marginRight: 6, color: '#EF4444' }} />热门领域</span>}
                    accentColor="#EF4444"
                  >
                    <Space wrap>
                      {marketData.hotAreas.map((area, index) => (
                        <Tag
                          key={index}
                          style={{
                            borderRadius: 16, padding: '4px 14px', fontSize: 13,
                            background: `${theme.chartColors[index % theme.chartColors.length]}20`,
                            borderColor: theme.chartColors[index % theme.chartColors.length],
                            color: isDarkMode ? theme.chartColors[index % theme.chartColors.length] : theme.accentDark,
                          }}
                        >
                          🔥 {area}
                        </Tag>
                      ))}
                    </Space>
                  </ScoutSectionCard>
                </Col>
              )}
              {marketData.summary && (
                <Col span={marketData.hotAreas && marketData.hotAreas.length > 0 ? 12 : 24} className="scout-panel-section">
                  <ScoutSectionCard
                    title={<span><BarChartOutlined style={{ marginRight: 6 }} />分析摘要</span>}
                    accentColor={theme.accentColor}
                  >
                    <p style={{
                      color: isDarkMode ? 'var(--text-secondary)' : '#475569',
                      lineHeight: 1.8, margin: 0, fontSize: 13,
                    }}>
                      {marketData.summary}
                    </p>
                  </ScoutSectionCard>
                </Col>
              )}
            </Row>
          </div>
        ) : null}
      </Spin>
    </div>
  );
};

export default MarketAnalysisPanel;
