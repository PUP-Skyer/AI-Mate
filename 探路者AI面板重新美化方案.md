# 探路者AI 三面板桌面美化 实施方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将竞品调研、趋势洞察、机会评估三个面板从"表单+图表"升级为沉浸式数据仪表盘，每个面板拥有独特的视觉身份和丰富的空状态/加载态/数据态体验。

**Architecture:** 基于 Anthropic 品牌色系（橙 #d97757 / 蓝 #6a9bcc / 绿 #788c5d），三面板各自独立设计语言：竞品调研=暗色指挥中心、趋势洞察=温暖杂志风、机会评估=极简评估终端。共享主题系统 + 动画库 + SVG 图表组件，各面板在此基础上构建独特的空状态场景、输入交互和数据可视化布局。

**Tech Stack:** React 19 + TypeScript 6 + Ant Design 6 + 原生 SVG/CSS 动画 + ECharts（仅趋势折线图）

---

## 一、现状诊断与改进方向

### 当前问题

| 问题 | 表现 | 改进方向 |
|------|------|----------|
| 空状态单调 | 无数据时只显示输入表单 | 每个面板添加独特的空状态场景（氛围动画 + 引导文案） |
| 输入区像表单 | 三个面板都是 Input + Button 排列 | 改为浮动工具栏 / 底部抽屉 / 侧边面板等差异化交互 |
| 布局同质化 | 都是 2x2 grid 排列图表 | 每个面板采用不同布局策略（不对称/杂志网格/终端列表） |
| 缺少氛围感 | 纯色背景无纹理 | 添加 SVG 纹理/渐变/扫描线/粒子等背景效果 |
| 加载态普通 | 使用 antd Spin | 自定义骨架屏 + 分步加载动画 |
| 图表交互弱 | SVG 图表缺少 hover 效果 | 增强 tooltip、hover 高亮、数据点交互 |

### 设计方向总览

```
┌─────────────────────────────────────────────────────────────────────┐
│  竞品调研 — 暗色指挥中心                                              │
│  ▸ 深色系 #0d1117 + 橙蓝对比                                          │
│  ▸ 雷达扫描背景 + 网格线纹理                                           │
│  ▸ 浮动命令栏输入（顶部单行 + 展开详情）                                  │
│  ▸ 数据态：Hero 统计条 → 雷达图+SWOT → 全宽时间线 → 对比表               │
├─────────────────────────────────────────────────────────────────────┤
│  趋势洞察 — 温暖杂志风                                                │
│  ▸ 浅色系 #faf9f5 + 橙色主调                                          │
│  ▸ 纸纹背景 + 活字印刷质感                                             │
│  ▸ 编辑部分段输入（步骤式引导）                                          │
│  ▸ 数据态：封面故事卡 → 时间轴 → 热度计+标签云 → 趋势曲线 → 深度文章     │
├─────────────────────────────────────────────────────────────────────┤
│  机会评估 — 极简评估终端                                               │
│  ▸ 纯黑 #0a0a0a + 绿色辉光                                            │
│  ▸ 扫描线纹理 + 终端光标闪烁                                           │
│  ▸ 终端命令行式输入（模拟 CLI 交互）                                     │
│  ▸ 数据态：大分数仪表 → 风险矩阵 → 市场漏斗 → 可行性雷达 → 评估报告     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、文件结构规划

### 新建文件

| 文件路径 | 职责 |
|----------|------|
| `scout/shared/ScoutEmptyState.tsx` | 三面板共享的空状态组件（各自传入不同的 SVG 场景） |
| `scout/shared/ScoutLoadingSkeleton.tsx` | 骨架屏加载组件 |
| `scout/shared/ScoutHeroStat.tsx` | Hero 统计数字卡片 |
| `scout/shared/ScoutSectionHeader.tsx` | 统一的区域标题组件（带装饰线/图标） |
| `scout/svg/BarChart.tsx` | 水平条形图（竞品对比用） |
| `scout/svg/TrendCurve.tsx` | 纯 SVG 趋势曲线（替代 ECharts 依赖） |
| `scout/svg/ProgressRing.tsx` | 进度环组件（可行性维度展示） |

### 修改文件

| 文件路径 | 改动范围 |
|----------|----------|
| `scout/scout-theme.ts` | 新增纹理常量、渐变定义、空状态配色 |
| `scout/scout-animations.css` | 新增扫描线、脉冲、打字机光标等动画 |
| `scout/CompetitorResearch.tsx` | **完全重写** — 新布局 + 空状态 + 浮动输入栏 |
| `scout/TrendInsight.tsx` | **完全重写** — 杂志风布局 + 步骤输入 + 纸纹背景 |
| `scout/OpportunityEval.tsx` | **完全重写** — 终端风布局 + CLI 输入 + 扫描线 |
| `scout/svg/RadarChart.tsx` | 增强 hover tooltip + 外环脉冲动画 |
| `scout/svg/GaugeChart.tsx` | 增强刻度线 + 颜色渐变弧 |
| `scout/svg/FunnelChart.tsx` | 增强流动粒子效果 |
| `scout/svg/TimelineChart.tsx` | 改为垂直布局 + 卡片式节点 |
| `scout/svg/HeatGauge.tsx` | 增强温度计效果 |
| `scout/svg/MatrixChart.tsx` | 增强 hover 展开效果 |

---

## 三、分任务实施

### Task 1: 主题系统增强

**Files:**
- Modify: `scout/scout-theme.ts`
- Modify: `scout/scout-animations.css`

- [ ] **Step 1: 扩展 scout-theme.ts**

在 `SCOUT_PALETTE` 后新增以下常量：

```typescript
// ─── 背景纹理 ─────────────────────────────────────────────

export const SCOUT_TEXTURES = {
  /** 指挥中心网格线 SVG data URI */
  commandGrid: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%2330363d' stroke-width='0.5'/%3E%3C/svg%3E")`,

  /** 杂志纸纹 SVG data URI */
  paperGrain: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,

  /** 终端扫描线 CSS */
  scanlines: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120,140,93,0.03) 2px, rgba(120,140,93,0.03) 4px)',
} as const;

// ─── 渐变预设 ─────────────────────────────────────────────

export const SCOUT_GRADIENTS = {
  competitorHeader: 'linear-gradient(135deg, #d97757 0%, #6a9bcc 100%)',
  trendHeader: 'linear-gradient(135deg, #d97757 0%, #e8a87c 50%, #c4a882 100%)',
  opportunityGlow: 'radial-gradient(ellipse at center, rgba(120,140,93,0.15) 0%, transparent 70%)',
  scoreHigh: 'linear-gradient(135deg, #788c5d, #a3b88c)',
  scoreMid: 'linear-gradient(135deg, #faad14, #e8c547)',
  scoreLow: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
} as const;

// ─── 阴影预设 ─────────────────────────────────────────────

export const SCOUT_SHADOWS = {
  competitorCard: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  trendCard: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  opportunityGlow: '0 0 30px rgba(120,140,93,0.12), 0 0 60px rgba(120,140,93,0.06)',
  hover: '0 8px 32px rgba(0,0,0,0.3)',
} as const;
```

- [ ] **Step 2: 扩展 scout-animations.css**

在文件末尾追加：

```css
/* ─── 扫描线效果 ─────────────────────────────────────────── */
@keyframes scoutScanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.scout-scanline::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(180deg, transparent, var(--glow-color, rgba(120,140,93,0.15)), transparent);
  animation: scoutScanline 4s linear infinite;
  pointer-events: none;
}

/* ─── 打字机光标 ─────────────────────────────────────────── */
@keyframes scoutBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.scout-cursor::after {
  content: '▌';
  animation: scoutBlink 1s step-end infinite;
  color: var(--glow-color, #788c5d);
  margin-left: 2px;
}

/* ─── 脉冲点 ─────────────────────────────────────────────── */
@keyframes scoutPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.5); opacity: 0.5; }
}

.scout-pulse {
  animation: scoutPulse 2s ease-in-out infinite;
}

/* ─── 雷达扫描 ───────────────────────────────────────────── */
@keyframes scoutRadarSweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ─── 渐入渐出浮动 ───────────────────────────────────────── */
@keyframes scoutFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

.scout-float {
  animation: scoutFloat 3s ease-in-out infinite;
}

/* ─── 骨架屏闪烁 ─────────────────────────────────────────── */
@keyframes scoutShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.scout-shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-color, #161b22) 25%,
    var(--surface-hover, #1c2128) 50%,
    var(--surface-color, #161b22) 75%
  );
  background-size: 200% 100%;
  animation: scoutShimmer 1.5s ease-in-out infinite;
}
```

---

### Task 2: 共享组件库

**Files:**
- Create: `scout/shared/ScoutEmptyState.tsx`
- Create: `scout/shared/ScoutLoadingSkeleton.tsx`
- Create: `scout/shared/ScoutHeroStat.tsx`
- Create: `scout/shared/ScoutSectionHeader.tsx`

- [ ] **Step 1: ScoutEmptyState.tsx**

```tsx
/**
 * 空状态组件 — 每个面板传入不同的 SVG 场景图
 */
import React from 'react';
import { Typography } from 'antd';
import { SCOUT_FONTS } from '../scout-theme';

const { Text } = Typography;

interface ScoutEmptyStateProps {
  scene: React.ReactNode;        // SVG 场景图
  title: string;
  subtitle: string;
  hint: string;
  textColor?: string;
  subColor?: string;
}

const ScoutEmptyState: React.FC<ScoutEmptyStateProps> = ({
  scene, title, subtitle, hint,
  textColor = '#e6edf3',
  subColor = '#8b949e',
}) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32,
  }}>
    <div className="scout-float" style={{ marginBottom: 8 }}>
      {scene}
    </div>
    <Text style={{
      color: textColor, fontSize: 18, fontWeight: 600,
      fontFamily: SCOUT_FONTS.heading,
    }}>{title}</Text>
    <Text style={{
      color: subColor, fontSize: 13,
      fontFamily: SCOUT_FONTS.body, textAlign: 'center',
      maxWidth: 320, lineHeight: 1.6,
    }}>{subtitle}</Text>
    <Text style={{
      color: subColor, fontSize: 11, opacity: 0.6,
      fontFamily: SCOUT_FONTS.mono,
    }}>{hint}</Text>
  </div>
);

export default ScoutEmptyState;
```

- [ ] **Step 2: ScoutLoadingSkeleton.tsx**

```tsx
/**
 * 骨架屏加载 — 模拟数据区域的占位动画
 */
import React from 'react';

interface ScoutLoadingSkeletonProps {
  rows?: number;
  chartType?: 'radar' | 'bar' | 'gauge' | 'grid';
  surfaceColor?: string;
  shimmerColor?: string;
}

const ScoutLoadingSkeleton: React.FC<ScoutLoadingSkeletonProps> = ({
  rows = 3,
  chartType = 'grid',
  surfaceColor = '#161b22',
  shimmerColor = '#1c2128',
}) => {
  const shimmerStyle = {
    '--surface-color': surfaceColor,
    '--surface-hover': shimmerColor,
    borderRadius: 8,
  } as React.CSSProperties;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 图表占位 */}
      <div style={{
        height: chartType === 'grid' ? 200 : 160,
        ...shimmerStyle,
        background: `linear-gradient(90deg, ${surfaceColor} 25%, ${shimmerColor} 50%, ${surfaceColor} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'scoutShimmer 1.5s ease-in-out infinite',
        borderRadius: 10,
      }} />
      {/* 文本行占位 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 14,
          width: `${60 + Math.random() * 30}%`,
          ...shimmerStyle,
          background: `linear-gradient(90deg, ${surfaceColor} 25%, ${shimmerColor} 50%, ${surfaceColor} 75%)`,
          backgroundSize: '200% 100%',
          animation: `scoutShimmer 1.5s ease-in-out infinite ${i * 0.1}s`,
          borderRadius: 4,
        }} />
      ))}
    </div>
  );
};

export default ScoutLoadingSkeleton;
```

- [ ] **Step 3: ScoutHeroStat.tsx**

```tsx
/**
 * Hero 统计卡片 — 大数字 + 标签 + 趋势箭头
 */
import React from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ScoutHeroStatProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  bgColor?: string;
}

const ScoutHeroStat: React.FC<ScoutHeroStatProps> = ({
  value, label, trend = 'neutral', color, bgColor = 'transparent',
}) => {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? '#788c5d' : trend === 'down' ? '#ff6b6b' : '#8b949e';

  return (
    <div className="scout-fade-in-up" style={{
      background: bgColor,
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 28, fontWeight: 700, color,
          fontFamily: SCOUT_FONTS.heading,
          lineHeight: 1,
        }}>{value}</span>
        <span style={{ fontSize: 14, color: trendColor, fontWeight: 600 }}>
          {trendIcon}
        </span>
      </div>
      <span style={{
        fontSize: 11, color: '#8b949e',
        fontFamily: SCOUT_FONTS.body,
        letterSpacing: 0.5,
      }}>{label}</span>
    </div>
  );
};

export default ScoutHeroStat;
```

- [ ] **Step 4: ScoutSectionHeader.tsx**

```tsx
/**
 * 区域标题 — 带装饰线和小图标
 */
import React from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ScoutSectionHeaderProps {
  title: string;
  icon?: string;
  color: string;
  subtitle?: string;
}

const ScoutSectionHeader: React.FC<ScoutSectionHeaderProps> = ({
  title, icon, color, subtitle,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{
        fontSize: 13, fontWeight: 600, color,
        fontFamily: SCOUT_FONTS.heading,
        letterSpacing: 0.5,
      }}>{title}</span>
      {subtitle && (
        <span style={{
          fontSize: 10, color: '#8b949e',
          fontFamily: SCOUT_FONTS.body,
        }}>{subtitle}</span>
      )}
    </div>
    <div style={{
      flex: 1, height: 1,
      background: `linear-gradient(90deg, ${color}44, transparent)`,
      marginLeft: 8,
    }} />
  </div>
);

export default ScoutSectionHeader;
```

---

### Task 3: SVG 图表增强

**Files:**
- Modify: `scout/svg/RadarChart.tsx` — 增加外环脉冲 + hover tooltip
- Modify: `scout/svg/GaugeChart.tsx` — 增加刻度线 + 渐变弧
- Modify: `scout/svg/TimelineChart.tsx` — 改为垂直布局 + 卡片式节点
- Modify: `scout/svg/HeatGauge.tsx` — 增强温度计效果
- Modify: `scout/svg/MatrixChart.tsx` — 增强 hover 展开
- Modify: `scout/svg/FunnelChart.tsx` — 增加流动粒子
- Create: `scout/svg/BarChart.tsx` — 水平条形图
- Create: `scout/svg/TrendCurve.tsx` — 纯 SVG 趋势曲线
- Create: `scout/svg/ProgressRing.tsx` — 进度环

- [ ] **Step 1: RadarChart.tsx 增强**

在现有雷达图外圈添加脉冲动画环，数据点 hover 显示 tooltip：

```tsx
// 在 SVG 最外层 group 前添加：
{/* 外环脉冲 */}
<circle
  cx={cx} cy={cy} r={radius + 4}
  fill="none" stroke={gridColor} strokeWidth={0.5}
  className="scout-pulse"
  style={{ '--glow-color': series[0]?.color || '#d97757' } as React.CSSProperties}
/>

// 数据点增加 tooltip：
{isHovered && (
  <g>
    <rect x={px - 30} y={py - 28} width={60} height={20}
      rx={4} fill="#161b22" stroke={s.color} strokeWidth={1} />
    <text x={px} y={py - 15} textAnchor="middle"
      fill={s.color} fontSize={11} fontWeight={600}>
      {v.toFixed(1)}
    </text>
  </g>
)}
```

- [ ] **Step 2: GaugeChart.tsx 增强**

添加刻度线和更丰富的视觉效果：

```tsx
// 在背景弧后添加刻度线
{Array.from({ length: 11 }).map((_, i) => {
  const angle = startAngle + (i / 10) * totalAngle;
  const inner = arcEnd(angle - 0); // 需要重新计算
  const outerR = r + strokeWidth;
  const isMajor = i % 5 === 0;
  return (
    <line
      key={`tick-${i}`}
      x1={cx + (r - strokeWidth * 0.5) * Math.cos(toRad(angle))}
      y1={cy + (r - strokeWidth * 0.5) * Math.sin(toRad(angle))}
      x2={cx + (r + strokeWidth * (isMajor ? 0.8 : 0.4)) * Math.cos(toRad(angle))}
      y2={cy + (r + strokeWidth * (isMajor ? 0.8 : 0.4)) * Math.sin(toRad(angle))}
      stroke={isMajor ? textColor : trackColor}
      strokeWidth={isMajor ? 1.5 : 0.8}
      opacity={isMajor ? 0.6 : 0.3}
    />
  );
})}
```

- [ ] **Step 3: TimelineChart.tsx 改为垂直布局**

将水平时间轴改为垂直卡片式布局，更适合面板窄宽场景：

```tsx
// 新的垂直布局结构
const TimelineChart = ({ events, ... }) => {
  const itemHeight = 72;
  const totalHeight = events.length * itemHeight;

  return (
    <div style={{ position: 'relative', paddingLeft: 32 }}>
      {/* 垂直时间线 */}
      <div style={{
        position: 'absolute', left: 11, top: 0, bottom: 0,
        width: 2, background: lineColor,
      }} />
      {events.map((evt, i) => (
        <div key={i} className={`scout-fade-in-up scout-stagger-${i + 1}`}
          style={{ position: 'relative', marginBottom: 16, paddingLeft: 20 }}>
          {/* 节点 */}
          <div style={{
            position: 'absolute', left: -27, top: 4,
            width: IMPACT_RADIUS[evt.impact] * 2,
            height: IMPACT_RADIUS[evt.impact] * 2,
            borderRadius: '50%',
            background: nodeColors[evt.impact],
            boxShadow: `0 0 8px ${nodeColors[evt.impact]}44`,
          }} />
          {/* 日期 */}
          <div style={{ fontSize: 10, color: textColor, opacity: 0.5, fontFamily: SCOUT_FONTS.mono }}>
            {evt.date}
          </div>
          {/* 事件 */}
          <div style={{ fontSize: 12, color: textColor, fontFamily: SCOUT_FONTS.body, lineHeight: 1.5 }}>
            {evt.event}
          </div>
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: 新建 BarChart.tsx**

```tsx
/**
 * 水平条形图 — 用于竞品能力对比
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

export interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  items: BarItem[];
  maxValue?: number;
  textColor?: string;
  trackColor?: string;
  animated?: boolean;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  items, maxValue = 10, textColor = '#e6edf3',
  trackColor = 'rgba(255,255,255,0.06)',
  animated = true, height = 200,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, items]);

  const barHeight = Math.min(24, (height - 20) / items.length - 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} className={`scout-fade-in-up scout-stagger-${i + 1}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 60, fontSize: 11, color: textColor, opacity: 0.7,
            fontFamily: SCOUT_FONTS.body, textAlign: 'right', flexShrink: 0,
          }}>{item.label}</span>
          <div style={{
            flex: 1, height: barHeight, borderRadius: barHeight / 2,
            background: trackColor, overflow: 'hidden',
          }}>
            <div style={{
              width: `${(item.value / maxValue) * 100 * progress}%`,
              height: '100%',
              borderRadius: barHeight / 2,
              background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
              boxShadow: `0 0 8px ${item.color}33`,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{
            width: 28, fontSize: 12, fontWeight: 600, color: item.color,
            fontFamily: SCOUT_FONTS.heading,
          }}>{Math.round(item.value * progress)}</span>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
```

- [ ] **Step 5: 新建 TrendCurve.tsx**

纯 SVG 实现的趋势曲线，替代 ECharts 动态 import：

```tsx
/**
 * 纯 SVG 趋势曲线 — 带渐变填充和动画
 */
import React, { useState, useEffect, useMemo } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface TrendCurveProps {
  labels: string[];
  series: { name: string; data: number[]; color: string }[];
  width?: number;
  height?: number;
  textColor?: string;
  gridColor?: string;
  animated?: boolean;
}

const TrendCurve: React.FC<TrendCurveProps> = ({
  labels, series, width = 400, height = 180,
  textColor = '#141413', gridColor = '#e8e6dc',
  animated = true,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1000, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated]);

  const pad = { top: 10, right: 20, bottom: 30, left: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allValues = series.flatMap(s => s.data);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => pad.left + (i / (labels.length - 1)) * chartW;
  const toY = (v: number) => pad.top + chartH - ((v - minVal) / range) * chartH;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 网格 */}
      {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
        const y = pad.top + chartH * (1 - v);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
              stroke={gridColor} strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={pad.left - 6} y={y + 3} textAnchor="end"
              fill={textColor} fontSize={9} opacity={0.5}>
              {Math.round(minVal + range * v)}
            </text>
          </g>
        );
      })}

      {/* X 轴标签 */}
      {labels.map((label, i) => (
        <text key={i} x={toX(i)} y={height - 6} textAnchor="middle"
          fill={textColor} fontSize={10} opacity={0.5}
          fontFamily={SCOUT_FONTS.body}>
          {label}
        </text>
      ))}

      {/* 曲线 */}
      {series.map((s, si) => {
        const points = s.data.map((v, i) => `${toX(i)},${toY(v * progress)}`);
        const linePath = `M${points.join('L')}`;
        const areaPath = `${linePath}L${toX(s.data.length - 1)},${pad.top + chartH}L${toX(0)},${pad.top + chartH}Z`;
        const gradId = `trend-grad-${si}`;

        return (
          <g key={si}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={linePath} fill="none" stroke={s.color}
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {/* 数据点 */}
            {s.data.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v * progress)}
                r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default TrendCurve;
```

- [ ] **Step 6: 新建 ProgressRing.tsx**

```tsx
/**
 * 进度环 — 用于可行性各维度展示
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ProgressRingProps {
  value: number;
  label: string;
  size?: number;
  color: string;
  trackColor?: string;
  textColor?: string;
  animated?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value, label, size = 80, color,
  trackColor = 'rgba(255,255,255,0.06)',
  textColor = '#f0f0f0',
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 800, 1);
      setDisplayValue(Math.round(value * t * t * (3 - 2 * t)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, animated]);

  const r = size * 0.38;
  const sw = size * 0.06;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (displayValue / 10) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={trackColor} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.3s',
            filter: `drop-shadow(0 0 4px ${color}44)` }}
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size * 0.22} fontWeight={700}
          fontFamily={SCOUT_FONTS.heading}>
          {displayValue}
        </text>
      </svg>
      <span style={{
        fontSize: 10, color: textColor, opacity: 0.6,
        fontFamily: SCOUT_FONTS.body, textAlign: 'center',
      }}>{label}</span>
    </div>
  );
};

export default ProgressRing;
```

---

### Task 4: 竞品调研面板重写

**Files:**
- Rewrite: `scout/CompetitorResearch.tsx`

**设计方向：** 暗色指挥中心

- [ ] **Step 1: 新布局结构**

```
┌──────────────────────────────────────────────────────┐
│ [浮动命令栏] 产品:___  竞品:___  行业:___  [调研]    │  ← 顶部浮动工具栏
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ 空状态 ──────────────────────────────────────┐   │
│  │   SVG: 雷达扫描动画 + 望远镜图标               │   │
│  │   "输入竞品信息，启动情报收集"                   │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 数据态 ──────────────────────────────────────┐   │
│  │  Hero统计: 竞品数 | 平均威胁 | 你的优势维度     │   │
│  │  ┌──────────┐  ┌──────────┐                    │   │
│  │  │ 雷达图    │  │ SWOT矩阵 │                    │   │
│  │  │ (增强版)  │  │ (发光版) │                    │   │
│  │  └──────────┘  └──────────┘                    │   │
│  │  ┌──────────────────────────────┐              │   │
│  │  │ 市场定位散点图 (全宽)         │              │   │
│  │  └──────────────────────────────┘              │   │
│  │  ┌──────────────────────────────┐              │   │
│  │  │ 功能对比表 (暗色主题)         │              │   │
│  │  └──────────────────────────────┘              │   │
│  │  ┌──────────────────────────────┐              │   │
│  │  │ 分析总结 (带导出按钮)         │              │   │
│  │  └──────────────────────────────┘              │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- [ ] **Step 2: 空状态 SVG 场景**

```tsx
const EmptyScene = () => (
  <svg width={120} height={120} viewBox="0 0 120 120">
    {/* 雷达底盘 */}
    <circle cx={60} cy={60} r={50} fill="none" stroke={T.border} strokeWidth={1} />
    <circle cx={60} cy={60} r={35} fill="none" stroke={T.border} strokeWidth={0.5} />
    <circle cx={60} cy={60} r={20} fill="none" stroke={T.border} strokeWidth={0.5} />
    {/* 十字线 */}
    <line x1={60} y1={10} x2={60} y2={110} stroke={T.border} strokeWidth={0.5} />
    <line x1={10} y1={60} x2={110} y2={60} stroke={T.border} strokeWidth={0.5} />
    {/* 扫描线 */}
    <line x1={60} y1={60} x2={60} y2={10}
      stroke={T.primary} strokeWidth={2} strokeLinecap="round"
      opacity={0.6}
      style={{
        transformOrigin: '60px 60px',
        animation: 'scoutRadarSweep 3s linear infinite',
      }}
    />
    {/* 扫描扇形 */}
    <path d={`M60,60 L60,10 A50,50 0 0,1 ${60 + 50 * Math.cos(Math.PI / 6)},${60 + 50 * Math.sin(Math.PI / 6)} Z`}
      fill={T.primary} fillOpacity={0.05}
      style={{
        transformOrigin: '60px 60px',
        animation: 'scoutRadarSweep 3s linear infinite',
      }}
    />
    {/* 中心点 */}
    <circle cx={60} cy={60} r={3} fill={T.primary} />
  </svg>
);
```

- [ ] **Step 3: 浮动命令栏**

```tsx
// 输入区改为浮动命令栏样式
<div style={{
  flexShrink: 0,
  padding: '12px 16px',
  background: `linear-gradient(180deg, ${T.surface}, ${T.bg})`,
  borderBottom: `1px solid ${T.border}`,
}}>
  <div style={{
    display: 'flex', gap: 8, alignItems: 'center',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${T.border}`,
    borderRadius: SCOUT_RADIUS.pill,
    padding: '6px 8px 6px 16px',
  }}>
    <span style={{ color: T.primary, fontSize: 13 }}>⌘</span>
    <Input placeholder="你的产品" value={product} onChange={...}
      variant="borderless" style={{ flex: 1, background: 'transparent', color: T.text }} />
    <div style={{ width: 1, height: 20, background: T.border }} />
    <Input placeholder="竞品列表" value={competitors} onChange={...}
      variant="borderless" style={{ flex: 1, background: 'transparent', color: T.text }} />
    <div style={{ width: 1, height: 20, background: T.border }} />
    <Input placeholder="行业" value={industry} onChange={...}
      variant="borderless" style={{ width: 80, background: 'transparent', color: T.text }} />
    <Button type="primary" onClick={handleGenerate}
      style={{
        borderRadius: SCOUT_RADIUS.pill,
        background: `linear-gradient(135deg, ${T.primary}, #e8a87c)`,
        border: 'none', fontSize: 12,
      }}>
      调研
    </Button>
  </div>
</div>
```

- [ ] **Step 4: Hero 统计条**

```tsx
{data && (
  <div className="scout-fade-in-up scout-stagger-1" style={{
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
    padding: '0 0 4px',
  }}>
    <ScoutHeroStat
      value={data.radar.length}
      label="分析竞品数"
      color={T.primary}
      bgColor={T.surface}
    />
    <ScoutHeroStat
      value={data.swot.threats.length}
      label="识别威胁"
      trend="down"
      color={T.danger}
      bgColor={T.surface}
    />
    <ScoutHeroStat
      value={data.swot.strengths.length}
      label="核心优势"
      trend="up"
      color={T.success}
      bgColor={T.surface}
    />
  </div>
)}
```

---

### Task 5: 趋势洞察面板重写

**Files:**
- Rewrite: `scout/TrendInsight.tsx`

**设计方向：** 温暖杂志风

- [ ] **Step 1: 新布局结构**

```
┌──────────────────────────────────────────────────────┐
│  ┌─ 编辑输入区 ──────────────────────────────────┐   │
│  │  步骤式引导：① 领域 → ② 时间 → ③ 重点        │   │
│  │  [洞察] 按钮                                   │   │
│  └───────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ 空状态 ──────────────────────────────────────┐   │
│  │   SVG: 翻开的书本 + 飘出的文字                  │   │
│  │   "探索行业趋势，洞察未来方向"                   │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 数据态（杂志排版） ──────────────────────────┐   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 封面故事卡（热度仪表 + 标签）         │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │  ┌──────────┐  ┌──────────────────────┐        │   │
│  │  │ 时间轴    │  │ 趋势曲线              │        │   │
│  │  │ (垂直)    │  │ (纯SVG)               │        │   │
│  │  └──────────┘  └──────────────────────┘        │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 关键词标签云（大小不一，错落排列）     │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 深度分析（双栏排版 + 首字下沉）       │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- [ ] **Step 2: 空状态 SVG 场景**

```tsx
const EmptyScene = () => (
  <svg width={140} height={120} viewBox="0 0 140 120">
    {/* 书本 */}
    <path d="M20,90 Q70,80 70,30 Q70,80 120,90" fill="none"
      stroke={T.primary} strokeWidth={1.5} opacity={0.6} />
    <path d="M25,88 Q70,78 70,32" fill="none"
      stroke={T.border} strokeWidth={0.8} />
    <path d="M115,88 Q70,78 70,32" fill="none"
      stroke={T.border} strokeWidth={0.8} />
    {/* 飘出的文字线条 */}
    {[0, 1, 2].map(i => (
      <line key={i}
        x1={55 + i * 5} y1={25 - i * 8}
        x2={85 + i * 5} y2={20 - i * 8}
        stroke={T.primary} strokeWidth={1.5} strokeLinecap="round"
        opacity={0.3 + i * 0.15}
        className={`scout-float`}
        style={{ animationDelay: `${i * 0.3}s` } as React.CSSProperties}
      />
    ))}
    {/* 装饰点 */}
    <circle cx={45} cy={50} r={2} fill={T.secondary} opacity={0.4} className="scout-pulse" />
    <circle cx={100} cy={45} r={1.5} fill={T.accent} opacity={0.4} className="scout-pulse"
      style={{ animationDelay: '0.5s' } as React.CSSProperties} />
  </svg>
);
```

- [ ] **Step 3: 步骤式输入**

```tsx
// 步骤式引导输入
const [step, setStep] = useState(0); // 0=领域, 1=时间, 2=重点

const steps = [
  { key: 'field', label: '关注领域', placeholder: '如：AI Agent、Web3、新能源', icon: '🔭' },
  { key: 'timeRange', label: '时间范围', placeholder: '如：2024-2026', icon: '📅' },
  { key: 'focus', label: '关注重点', placeholder: '如：技术突破、政策变化', icon: '🎯' },
];

// 渲染为水平步骤条 + 当前步骤输入框
<div style={{ padding: '16px 20px', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
  {/* 步骤指示器 */}
  <div style={{ display: 'flex', gap: 0, marginBottom: 12 }}>
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div
          onClick={() => setStep(i)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            opacity: step >= i ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: step > i ? T.primary : step === i ? T.primary + '33' : T.border,
            color: step > i ? '#fff' : T.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
          }}>{step > i ? '✓' : i + 1}</span>
          <span style={{ fontSize: 12, color: step === i ? T.text : T.textSecondary,
            fontFamily: SCOUT_FONTS.heading }}>{s.label}</span>
        </div>
        {i < steps.length - 1 && (
          <div style={{
            flex: 1, height: 1, margin: '0 8px', alignSelf: 'center',
            background: step > i ? T.primary : T.border,
            transition: 'background 0.3s',
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
  {/* 当前步骤输入 */}
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    <span style={{ fontSize: 16 }}>{steps[step].icon}</span>
    <Input
      placeholder={steps[step].placeholder}
      value={(steps[step].key === 'field' ? field : steps[step].key === 'timeRange' ? timeRange : focus) as string}
      onChange={(e) => {
        if (steps[step].key === 'field') setField(e.target.value);
        else if (steps[step].key === 'timeRange') setTimeRange(e.target.value);
        else setFocus(e.target.value);
      }}
      onPressEnter={() => step < 2 ? setStep(step + 1) : handleGenerate()}
      style={{ flex: 1, borderRadius: SCOUT_RADIUS.pill, fontSize: 13 }}
    />
    {step === 2 && (
      <Button type="primary" onClick={handleGenerate} loading={loading}
        disabled={!field || !timeRange || !focus}
        style={{
          borderRadius: SCOUT_RADIUS.pill,
          background: `linear-gradient(135deg, ${T.primary}, #e8a87c)`,
          border: 'none',
        }}>
        洞察
      </Button>
    )}
  </div>
</div>
```

- [ ] **Step 4: 封面故事卡**

```tsx
{/* 封面故事卡 — 杂志封面风格 */}
<div className="scout-fade-in-up scout-stagger-1" style={{
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: SCOUT_RADIUS.lg,
  padding: 24,
  display: 'flex',
  gap: 24,
  boxShadow: SCOUT_SHADOWS.trendCard,
}}>
  {/* 左侧：热度仪表 */}
  <div style={{ flexShrink: 0 }}>
    <HeatGauge score={data.heatScore} label={data.heatLabel} size={150}
      textColor={T.text} trackColor={`${T.border}66`} />
  </div>
  {/* 右侧：标题区 */}
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div style={{
      fontSize: 10, color: T.primary, fontFamily: SCOUT_FONTS.heading,
      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
    }}>TREND INSIGHT REPORT</div>
    <div style={{
      fontSize: 22, fontWeight: 700, color: T.text,
      fontFamily: SCOUT_FONTS.heading, lineHeight: 1.3, marginBottom: 8,
    }}>
      {field} 行业趋势洞察
    </div>
    <div style={{
      fontSize: 12, color: T.textSecondary,
      fontFamily: SCOUT_FONTS.body, lineHeight: 1.6,
    }}>
      时间范围 {timeRange} · 聚焦 {focus}
    </div>
  </div>
</div>
```

- [ ] **Step 5: 深度分析双栏排版**

```tsx
{/* 深度分析 — 杂志文章风格 */}
<div className="scout-fade-in-up scout-stagger-5" style={{
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: SCOUT_RADIUS.lg,
  padding: 24,
  boxShadow: SCOUT_SHADOWS.trendCard,
}}>
  <div style={{
    fontSize: 10, color: T.primary, fontFamily: SCOUT_FONTS.heading,
    letterSpacing: 2, marginBottom: 16,
  }}>DEEP ANALYSIS</div>
  <div style={{
    columnCount: 2,
    columnGap: 24,
    columnRule: `1px solid ${T.border}`,
    fontSize: 13,
    color: T.text,
    fontFamily: SCOUT_FONTS.body,
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    // 首字下沉效果
    '&::first-letter': {
      fontSize: 32,
      fontWeight: 700,
      color: T.primary,
      float: 'left',
      lineHeight: 1,
      marginRight: 8,
    },
  }}>
    {data.analysis}
  </div>
</div>
```

---

### Task 6: 机会评估面板重写

**Files:**
- Rewrite: `scout/OpportunityEval.tsx`

**设计方向：** 极简评估终端

- [ ] **Step 1: 新布局结构**

```
┌──────────────────────────────────────────────────────┐
│  ┌─ 终端输入 ────────────────────────────────────┐   │
│  │  > 创业想法: ___                              │   │
│  │  > 目标市场: ___                              │   │
│  │  > 核心优势: ___          [评估]              │   │
│  └───────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ 空状态 ──────────────────────────────────────┐   │
│  │   SVG: 终端窗口 + 闪烁光标                     │   │
│  │   "输入创业信息，启动机会评估引擎"               │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌─ 数据态（终端仪表盘） ────────────────────────┐   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 综合评分大仪表 (居中 + 辉光)          │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │  ┌──────────┐  ┌──────────────────────┐        │   │
│  │  │ 风险矩阵  │  │ 市场漏斗              │        │   │
│  │  │ (散点图)  │  │ (TAM/SAM/SOM)         │        │   │
│  │  └──────────┘  └──────────────────────┘        │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 可行性维度 (进度环网格)               │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  │  ┌─────────────────────────────────────┐       │   │
│  │  │ 评估报告 (终端风格 + 导出)            │       │   │
│  │  └─────────────────────────────────────┘       │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

- [ ] **Step 2: 空状态 SVG 场景**

```tsx
const EmptyScene = () => (
  <svg width={140} height={120} viewBox="0 0 140 120">
    {/* 终端窗口 */}
    <rect x={15} y={15} width={110} height={90} rx={6}
      fill="none" stroke={T.border} strokeWidth={1} />
    {/* 标题栏 */}
    <rect x={15} y={15} width={110} height={18} rx={6}
      fill={T.surface} stroke={T.border} strokeWidth={1} />
    <circle cx={28} cy={24} r={3} fill="#ff6b6b" opacity={0.6} />
    <circle cx={38} cy={24} r={3} fill="#faad14" opacity={0.6} />
    <circle cx={48} cy={24} r={3} fill={T.primary} opacity={0.6} />
    {/* 终端文字 */}
    <text x={25} y={50} fill={T.primary} fontSize={10}
      fontFamily={SCOUT_FONTS.mono} opacity={0.8}>
      {'>'} analyzing...
    </text>
    <text x={25} y={65} fill={T.textSecondary} fontSize={9}
      fontFamily={SCOUT_FONTS.mono} opacity={0.4}>
      market_size: calculating
    </text>
    <text x={25} y={78} fill={T.textSecondary} fontSize={9}
      fontFamily={SCOUT_FONTS.mono} opacity={0.4}>
      risk_level: pending
    </text>
    {/* 闪烁光标 */}
    <rect x={25} y={86} width={7} height={2}
      fill={T.primary}
      className="scout-cursor"
      style={{ '--glow-color': T.primary } as React.CSSProperties}
    />
  </svg>
);
```

- [ ] **Step 3: 终端风格输入**

```tsx
// 终端命令行式输入
<div style={{
  flexShrink: 0,
  background: T.surface,
  borderBottom: `1px solid ${T.border}`,
  padding: '12px 16px',
  fontFamily: SCOUT_FONTS.mono,
}}>
  {[
    { label: '创业想法', value: idea, setter: setIdea, placeholder: '描述核心价值主张...' },
    { label: '目标市场', value: market, setter: setMarket, placeholder: '市场规模和目标用户...' },
    { label: '核心优势', value: advantage, setter: setAdvantage, placeholder: '你的竞争壁垒...' },
  ].map((field, i) => (
    <div key={i} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 0',
    }}>
      <span style={{ color: T.primary, fontSize: 12 }}>{'>'}</span>
      <span style={{ color: T.textSecondary, fontSize: 12, width: 60, flexShrink: 0 }}>
        {field.label}:
      </span>
      <Input
        variant="borderless"
        placeholder={field.placeholder}
        value={field.value}
        onChange={(e) => field.setter(e.target.value)}
        style={{
          flex: 1, background: 'transparent',
          color: T.text, fontSize: 12,
          fontFamily: SCOUT_FONTS.mono,
          padding: '2px 0',
        }}
      />
    </div>
  ))}
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
    <Button type="primary" onClick={handleGenerate}
      loading={loading}
      disabled={!idea || !market || !advantage}
      style={{
        borderRadius: SCOUT_RADIUS.sm,
        background: `linear-gradient(135deg, ${T.primary}, #a3b88c)`,
        border: 'none',
        fontFamily: SCOUT_FONTS.mono,
        fontSize: 12,
      }}>
      $ evaluate --run
    </Button>
  </div>
</div>
```

- [ ] **Step 4: 综合评分大仪表（居中辉光）*/

```tsx
{/* 综合评分 — 居中展示 + 辉光效果 */}
<div className="scout-fade-in-up scout-stagger-1" style={{
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: SCOUT_RADIUS.lg,
  padding: '24px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: SCOUT_SHADOWS.opportunityGlow,
}}>
  {/* 背景辉光 */}
  <div style={{
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 200, height: 200,
    background: SCOUT_GRADIENTS.opportunityGlow,
    borderRadius: '50%',
    pointerEvents: 'none',
  }} />
  <GaugeChart value={data.overallScore} label={data.scoreLabel}
    size={200} textColor={T.text}
    trackColor="rgba(255,255,255,0.04)"
    colorStops={[
      { threshold: 40, color: '#ff6b6b' },
      { threshold: 60, color: '#faad14' },
      { threshold: 100, color: T.primary },
    ]}
  />
</div>
```

- [ ] **Step 5: 可行性进度环网格**

```tsx
{/* 可行性维度 — 进度环网格 */}
<div className="scout-fade-in-up scout-stagger-4" style={{
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: SCOUT_RADIUS.lg,
  padding: 16,
}}>
  <ScoutSectionHeader title="可行性评估" icon="📊" color={T.primary} />
  <div style={{
    display: 'flex', justifyContent: 'space-around',
    flexWrap: 'wrap', gap: 12,
  }}>
    {feasibilityDimensions.map((dim, i) => (
      <ProgressRing
        key={dim}
        value={data.feasibility[dim]}
        label={dim}
        size={72}
        color={T.chartColors[i % T.chartColors.length]}
        textColor={T.text}
      />
    ))}
  </div>
</div>
```

---

### Task 7: 集成验证

- [ ] **Step 1: TypeScript 编译检查**

```bash
cd "f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\react-ai-chat"
npx tsc --noEmit
```

预期：0 errors

- [ ] **Step 2: 启动开发服务器**

```bash
npm run dev
```

预期：Vite 启动成功，无编译错误

- [ ] **Step 3: 浏览器验证**

访问 http://localhost:5173/ → 点击探路者AI → 依次切换三个面板

检查项：
- [ ] 空状态 SVG 场景正确渲染，动画流畅
- [ ] 输入交互正常（命令栏/步骤式/终端式）
- [ ] 加载骨架屏动画正常
- [ ] 数据态各图表正确展示
- [ ] 动画入场效果（交错延迟）正常
- [ ] 响应式布局在不同宽度下不溢出
- [ ] 下载功能正常

---

## 四、设计差异对比

| 维度 | 竞品调研 | 趋势洞察 | 机会评估 |
|------|---------|---------|---------|
| **色调** | 暗色 #0d1117 | 浅色 #faf9f5 | 纯黑 #0a0a0a |
| **主色** | 橙 #d97757 | 橙 #d97757 | 绿 #788c5d |
| **字体感** | 科技感等宽 | 衬线优雅 | 终端等宽 |
| **背景纹理** | 网格线 | 纸纹 | 扫描线 |
| **输入方式** | 浮动命令栏 | 步骤式引导 | 终端命令行 |
| **空状态** | 雷达扫描动画 | 书本飘字 | 终端窗口+光标 |
| **核心图表** | 雷达+SWOT | 时间轴+热度计 | 大仪表+漏斗 |
| **布局** | 2x2 网格 | 杂志不对称 | 垂直列表 |
| **分析展示** | 单栏+导出 | 双栏+首字下沉 | 终端日志风格 |
| **动画特色** | 脉冲辉光 | 浮动元素 | 扫描线 |

---

## 五、风险与注意事项

1. **ECharts 依赖**：趋势洞察的趋势曲线改用纯 SVG（TrendCurve.tsx），移除对 ECharts 动态 import 的依赖，减少包体积
2. **Ant Design 6 兼容**：使用 `variant="borderless"` 而非已废弃的 `borderless` 属性
3. **性能**：SVG 动画使用 CSS animation 而非 JS 定时器，减少重渲染
4. **TypeScript 严格模式**：所有新组件需通过 `verbatimModuleSyntax` 检查，使用 `import type` 语法
5. **qiankun 兼容**：不使用 `100vh`，使用 `height: 100%` 适应嵌套布局
