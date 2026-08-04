import React, { useState, useEffect } from 'react';
import { Card, Tabs, Row, Col, Select, Space, Button, Progress, Table, Tag, Badge, Statistic } from 'antd';
import {
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  ProjectOutlined,
  BankOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const dashboardData = {
  overview: {
    totalUsers: 12500,
    totalProjects: 3200,
    totalInvestments: 85000000,
    totalRevenue: 120000000,
    activeProjects: 1400,
    completionRate: 99.2,
  },
  trends: [
    { month: '1月', users: 8500, projects: 2100, revenue: 80000000, growth: 5.2 },
    { month: '2月', users: 9200, projects: 2300, revenue: 85000000, growth: 8.2 },
    { month: '3月', users: 10000, projects: 2600, revenue: 92000000, growth: 8.7 },
    { month: '4月', users: 11500, projects: 2900, revenue: 105000000, growth: 15.0 },
    { month: '5月', users: 12500, projects: 3200, revenue: 120000000, growth: 8.7 },
  ],
  distribution: {
    industries: [
      { name: '科技', value: 40, color: '#a855f7' },
      { name: '金融', value: 25, color: '#d946ef' },
      { name: '医疗', value: 15, color: '#f472b6' },
      { name: '教育', value: 10, color: '#c084fc' },
      { name: '其他', value: 10, color: '#8b5cf6' },
    ],
    regions: [
      { name: '华东', value: 35 },
      { name: '华北', value: 25 },
      { name: '华南', value: 20 },
      { name: '西南', value: 10 },
      { name: '其他', value: 10 },
    ],
  },
  investments: [
    { stage: '种子轮', amount: 15000000, count: 120, avgAmount: 125000, change: 12.5 },
    { stage: '天使轮', amount: 25000000, count: 80, avgAmount: 312500, change: 8.3 },
    { stage: 'A轮', amount: 30000000, count: 45, avgAmount: 666667, change: 15.2 },
    { stage: 'B轮', amount: 10000000, count: 20, avgAmount: 500000, change: -2.1 },
    { stage: 'C轮', amount: 5000000, count: 8, avgAmount: 625000, change: 5.8 },
  ],
  projects: [
    { industry: '科技', count: 1280, growth: 15.2, status: 'up' },
    { industry: '金融', count: 800, growth: 8.5, status: 'up' },
    { industry: '医疗', count: 480, growth: 12.3, status: 'up' },
    { industry: '教育', count: 320, growth: -2.1, status: 'down' },
    { industry: '制造', count: 200, growth: 5.8, status: 'up' },
    { industry: '零售', count: 120, growth: -5.2, status: 'down' },
  ],
};

// 动画计数器
const AnimatedNumber: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

// 迷你柱状图
const MiniBarChart: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((value, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: `${(value / max) * 100}%`,
            background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
            borderRadius: '2px 2px 0 0',
            opacity: 0.4 + (index / data.length) * 0.6,
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ))}
    </div>
  );
};

// 趋势折线图
const TrendLineChart: React.FC<{ data: number[]; color: string; fillColor?: string }> = ({ data, color, fillColor }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 70 - 15;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,100 ${points} 100,100`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: 80, overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-fill-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor || color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fillColor || color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-fill-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
      {data.map((_, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((data[index] - min) / range) * 70 - 15;
        return (
          <circle key={index} cx={x} cy={y} r="2.5" fill={color} stroke="#0a0a0f" strokeWidth="1.5" />
        );
      })}
    </svg>
  );
};

// 环形图
const DonutChart: React.FC<{ data: { name: string; value: number; color: string }[]; size?: number }> = ({ data, size = 140 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;
  const radius = size / 2;
  const innerRadius = radius * 0.65;
  const circumference = 2 * Math.PI * (radius - 4);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, index) => {
          const percent = item.value / total;
          const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
          const strokeDashoffset = -cumulative * circumference;
          cumulative += percent;
          return (
            <circle
              key={index}
              cx={radius}
              cy={radius}
              r={radius - 4}
              fill="none"
              stroke={item.color}
              strokeWidth={radius - innerRadius}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{total}%</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>总计</div>
      </div>
    </div>
  );
};

// 雷达图
const RadarChart: React.FC<{ data: { name: string; value: number }[]; size?: number }> = ({ data, size = 160 }) => {
  const center = size / 2;
  const maxRadius = size / 2 - 16;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = data.map((item, index) => {
    const p = getPoint(item.value, index);
    return `${p.x},${p.y}`;
  }).join(' ');

  const gridScales = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size }}>
      {gridScales.map((scale, i) => {
        const gridPoints = data.map((_, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const r = scale * maxRadius;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={i}
            points={gridPoints}
            fill="none"
            stroke="rgba(168, 85, 247, 0.1)"
            strokeWidth="0.5"
          />
        );
      })}
      {data.map((_, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const x = center + maxRadius * Math.cos(angle);
        const y = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={index}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(168, 85, 247, 0.08)"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={points}
        fill="rgba(168, 85, 247, 0.15)"
        stroke="#a855f7"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.3))' }}
      />
      {data.map((item, index) => {
        const p = getPoint(item.value, index);
        const labelAngle = angleStep * index - Math.PI / 2;
        const labelR = maxRadius + 14;
        const lx = center + labelR * Math.cos(labelAngle);
        const ly = center + labelR * Math.sin(labelAngle);
        return (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r="3" fill="#a855f7" stroke="#0a0a0f" strokeWidth="1.5" />
            <text
              x={lx}
              y={ly}
              fill="#94a3b8"
              fontSize="9"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {item.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// 统计卡片
const StatCard: React.FC<{
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  chartData: number[];
}> = ({ title, value, prefix = '', suffix = '', change, icon, color, chartData }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}15`
          : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
      }}
      styles={{ body: { padding: '20px' } }}
    >
      {/* 顶部渐变光效 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: hovered ? 1 : 0.3,
          transition: 'opacity 0.4s',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: 18,
            boxShadow: `0 0 12px ${color}20`,
          }}
        >
          {icon}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 20,
            background: change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${change >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          {change >= 0 ? (
            <ArrowUpOutlined style={{ color: '#10b981', fontSize: 10 }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#ef4444', fontSize: 10 }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: change >= 0 ? '#10b981' : '#ef4444' }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <MiniBarChart data={chartData} color={color} height={32} />
      </div>
    </Card>
  );
};

const DataDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('trends');

  const overviewStats = [
    {
      title: '总用户数',
      value: dashboardData.overview.totalUsers,
      change: 12,
      icon: <UserOutlined />,
      color: '#a855f7',
      chartData: [8500, 9200, 10000, 11500, 12500],
    },
    {
      title: '总项目数',
      value: dashboardData.overview.totalProjects,
      change: 8,
      icon: <ProjectOutlined />,
      color: '#d946ef',
      chartData: [2100, 2300, 2600, 2900, 3200],
    },
    {
      title: '总投资金额',
      value: Math.round(dashboardData.overview.totalInvestments / 10000),
      prefix: '¥',
      suffix: '万',
      change: 15,
      icon: <BankOutlined />,
      color: '#f472b6',
      chartData: [1500, 2500, 3000, 1000, 500],
    },
    {
      title: '总收入',
      value: Math.round(dashboardData.overview.totalRevenue / 10000),
      prefix: '¥',
      suffix: '万',
      change: 22,
      icon: <WalletOutlined />,
      color: '#c084fc',
      chartData: [8000, 8500, 9200, 10500, 12000],
    },
    {
      title: '活跃项目',
      value: dashboardData.overview.activeProjects,
      change: 5,
      icon: <CheckCircleOutlined />,
      color: '#8b5cf6',
      chartData: [1000, 1100, 1200, 1300, 1400],
    },
    {
      title: '完成率',
      value: Math.round(dashboardData.overview.completionRate * 10),
      prefix: '',
      suffix: '%',
      change: 2,
      icon: <RiseOutlined />,
      color: '#10b981',
      chartData: [95, 96, 97, 98, 99],
    },
  ];

  const investmentColumns = [
    {
      title: <span style={{ color: '#94a3b8' }}>投资阶段</span>,
      dataIndex: 'stage',
      key: 'stage',
      render: (v: string) => <span style={{ color: '#f8fafc', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>投资总额</span>,
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ color: '#c084fc' }}>¥{(v / 10000).toFixed(0)}万</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>项目数量</span>,
      dataIndex: 'count',
      key: 'count',
      render: (v: number) => <span style={{ color: '#f8fafc' }}>{v}</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>平均投资额</span>,
      dataIndex: 'avgAmount',
      key: 'avgAmount',
      render: (v: number) => <span style={{ color: '#f8fafc' }}>¥{(v / 10000).toFixed(1)}万</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>变化</span>,
      dataIndex: 'change',
      key: 'change',
      render: (v: number) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 4,
            background: v >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          }}
        >
          {v >= 0 ? (
            <ArrowUpOutlined style={{ color: '#10b981', fontSize: 10 }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#ef4444', fontSize: 10 }} />
          )}
          <span style={{ color: v >= 0 ? '#10b981' : '#ef4444', fontSize: 12 }}>
            {v > 0 ? '+' : ''}{v}%
          </span>
        </div>
      ),
    },
  ];

  const projectColumns = [
    {
      title: <span style={{ color: '#94a3b8' }}>行业</span>,
      dataIndex: 'industry',
      key: 'industry',
      render: (v: string) => <span style={{ color: '#f8fafc', fontWeight: 500 }}>{v}</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>项目数量</span>,
      dataIndex: 'count',
      key: 'count',
      render: (v: number) => <span style={{ color: '#f8fafc' }}>{v}</span>,
    },
    {
      title: <span style={{ color: '#94a3b8' }}>增长率</span>,
      dataIndex: 'growth',
      key: 'growth',
      render: (v: number, record: any) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 4,
            background: record.status === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          }}
        >
          {record.status === 'up' ? (
            <ArrowUpOutlined style={{ color: '#10b981', fontSize: 10 }} />
          ) : (
            <ArrowDownOutlined style={{ color: '#ef4444', fontSize: 10 }} />
          )}
          <span style={{ color: record.status === 'up' ? '#10b981' : '#ef4444', fontSize: 12 }}>
            {v > 0 ? '+' : ''}{v}%
          </span>
        </div>
      ),
    },
    {
      title: <span style={{ color: '#94a3b8' }}>占比</span>,
      key: 'percent',
      render: (_: any, record: any) => {
        const total = dashboardData.projects.reduce((sum, p) => sum + p.count, 0);
        const percent = Math.round((record.count / total) * 100);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={record.status === 'up' ? '#a855f7' : '#ef4444'}
              railColor="rgba(255,255,255,0.05)"
              showInfo={false}
              style={{ width: 80 }}
            />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{percent}%</span>
          </div>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'trends',
      label: (
        <Space>
          <LineChartOutlined />
          <span>趋势分析</span>
        </Space>
      ),
    },
    {
      key: 'distribution',
      label: (
        <Space>
          <PieChartOutlined />
          <span>分布分析</span>
        </Space>
      ),
    },
    {
      key: 'investments',
      label: (
        <Space>
          <DollarOutlined />
          <span>投资分析</span>
        </Space>
      ),
    },
    {
      key: 'projects',
      label: (
        <Space>
          <BarChartOutlined />
          <span>项目分析</span>
        </Space>
      ),
    },
  ];

  const glassCardStyle = {
    background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* 背景网格 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.5px',
              }}
            >
              数据看板
            </h2>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: 13 }}>
              实时监控业务数据，洞察发展趋势
            </p>
          </div>
          <Space>
            <Select
              placeholder="时间范围"
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 100 }}
              size="middle"
              variant="borderless"
              styles={{ popup: { root: { background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)' } } }}
            >
              <Select.Option value="week">周</Select.Option>
              <Select.Option value="month">月</Select.Option>
              <Select.Option value="quarter">季度</Select.Option>
              <Select.Option value="year">年</Select.Option>
            </Select>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="middle"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
                border: 'none',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
              }}
            >
              导出
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {overviewStats.map((stat, index) => (
            <Col span={4} key={index}>
              <StatCard {...stat} />
            </Col>
          ))}
        </Row>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{
            background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.9) 0%, rgba(20, 20, 30, 0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '4px 16px',
            marginBottom: 0,
            backdropFilter: 'blur(20px)',
          }}
          tabBarGutter={8}
          type="line"
          indicator={{ size: 0 }}
        />

        {/* 趋势分析 */}
        {activeTab === 'trends' && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>用户增长趋势</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>USER GROWTH</div>
                    </div>
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>+12.5%</span>
                    </div>
                  </div>
                  <TrendLineChart
                    data={dashboardData.trends.map((t) => t.users)}
                    color="#a855f7"
                    fillColor="#a855f7"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                    {dashboardData.trends.map((t, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#64748b' }}>
                        {t.month}
                      </span>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>收入趋势</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>REVENUE</div>
                  </div>
                  <TrendLineChart
                    data={dashboardData.trends.map((t) => t.revenue)}
                    color="#10b981"
                    fillColor="#10b981"
                  />
                  <div style={{ marginTop: 20 }}>
                    {dashboardData.trends.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.month}</span>
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>
                          ¥{(t.revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>六大核心能力评估</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>SKILL RADAR</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RadarChart
                      data={[
                        { name: '战略', value: 85 },
                        { name: '创新', value: 72 },
                        { name: '执行', value: 90 },
                        { name: '协作', value: 68 },
                        { name: '学习', value: 78 },
                        { name: '适应', value: 82 },
                      ]}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>行业趋势分布</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>DISTRIBUTION</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {dashboardData.projects.slice(0, 5).map((item, index) => (
                      <div key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.industry}</span>
                          <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 500 }}>{item.count}</span>
                        </div>
                        <Progress
                          percent={Math.round((item.count / 1280) * 100)}
                          strokeColor={['#a855f7', '#d946ef', '#f472b6', '#c084fc', '#8b5cf6'][index]}
                          railColor="rgba(255,255,255,0.05)"
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>地域分布 TOP 5</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>GEO DIST</div>
                  </div>
                  {dashboardData.distribution.regions.slice(0, 5).map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: index < 3 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          marginRight: 10,
                          color: index < 3 ? '#a855f7' : '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>{item.name}</span>
                      <Progress
                        percent={item.value}
                        strokeColor={['#a855f7', '#d946ef', '#f472b6', '#c084fc', '#8b5cf6'][index]}
                        railColor="rgba(255,255,255,0.05)"
                        showInfo={false}
                        size="small"
                        style={{ width: 100, marginBottom: 0 }}
                      />
                      <span style={{ fontSize: 12, color: '#a855f7', marginLeft: 10, minWidth: 24, textAlign: 'right', fontWeight: 500 }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* 分布分析 */}
        {activeTab === 'distribution' && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>行业构成</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>TYPOLOGY</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <DonutChart data={dashboardData.distribution.industries} size={160} />
                  </div>
                  <div>
                    {dashboardData.distribution.industries.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: item.color }} />
                          {item.name}
                        </span>
                        <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={16}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>行业分布详情</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>DISTRIBUTION DETAILS</div>
                  </div>
                  {dashboardData.distribution.industries.map((item, index) => (
                    <div key={index} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: 13, color: item.color, fontWeight: 600 }}>{item.value}%</span>
                      </div>
                      <Progress
                        percent={item.value}
                        strokeColor={item.color}
                        railColor="rgba(255,255,255,0.05)"
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* 投资分析 */}
        {activeTab === 'investments' && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>投资阶段分布</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>INVESTMENT STAGES</div>
                  </div>
                  <Table
                    dataSource={dashboardData.investments}
                    columns={investmentColumns}
                    pagination={false}
                    size="middle"
                    style={{ background: 'transparent' }}
                    rowKey="stage"
                  />
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>投资趋势分析</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                    早期投资（种子轮+天使轮）占比最高，达到55.6%，表明市场仍处于早期阶段。
                    A轮投资金额最大，平均单笔投资额达66.7万，显示成长期项目获得更多资金支持。
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>投资策略建议</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                    建议关注A轮及B轮项目，这些阶段的项目已有初步验证，风险相对较低。
                    同时可适当配置少量种子轮项目以获取更高潜在回报。
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* 项目分析 */}
        {activeTab === 'projects' && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>项目行业分布</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '1px' }}>PROJECT DISTRIBUTION</div>
                  </div>
                  <Table
                    dataSource={dashboardData.projects}
                    columns={projectColumns}
                    pagination={false}
                    size="middle"
                    style={{ background: 'transparent' }}
                    rowKey="industry"
                  />
                </Card>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>项目增长分析</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                    科技行业项目数量最多，占比40%，且增长率达15.2%，表现最为活跃。
                    教育和零售行业出现负增长，需要重点关注和扶持。
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card style={glassCardStyle} styles={{ body: { padding: 24 } }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>发展建议</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                    建议加大对科技、医疗等高增长行业的资源倾斜。
                    对于教育、零售等负增长行业，可通过政策扶持和资金支持帮助其转型升级。
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDashboard;
