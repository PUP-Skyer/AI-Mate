/**
 * 融资时间轴组件
 * SVG折线图 + 可拖拽滑块 + 当前阶段详情（无序列表）
 * 鼠标拖动时间轴到某位置即显示该阶段的融资计划
 */
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { SageStatCard } from './shared';
import type { FinancingStage } from './finance-utils';

interface FinancingTimelineProps {
  stages: FinancingStage[];
  theme: SageTheme;
  isDark: boolean;
}

// SVG布局常量（模块级，避免hooks依赖警告）
const W = 760;
const H = 280;
const PADDING = { top: 30, right: 30, bottom: 50, left: 60 };
const CHART_WIDTH = W - PADDING.left - PADDING.right;
const CHART_HEIGHT = H - PADDING.top - PADDING.bottom;

const FinancingTimeline: React.FC<FinancingTimelineProps> = ({ stages, theme, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // 按年汇总融资金额
  const yearlyTotals = useMemo(() => {
    const map: Record<number, number> = {};
    stages.forEach(s => { map[s.year] = (map[s.year] || 0) + s.targetAmount; });
    return Object.entries(map).map(([year, amount]) => ({
      year: parseInt(year, 10),
      amount,
    }));
  }, [stages]);

  // 坐标映射
  const maxAmount = Math.max(...stages.map(s => s.targetAmount), 1);
  const xScale = useCallback((i: number) => {
    if (stages.length <= 1) return PADDING.left + CHART_WIDTH / 2;
    return PADDING.left + (CHART_WIDTH / (stages.length - 1)) * i;
  }, [stages.length]);

  const yScale = useCallback((amount: number) => {
    return PADDING.top + CHART_HEIGHT - (amount / maxAmount) * CHART_HEIGHT;
  }, [maxAmount]);

  // 折线路径
  const linePath = useMemo(() => {
    return stages.map((s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(s.targetAmount)}`).join(' ');
  }, [stages, xScale, yScale]);

  // 面积路径（渐变填充）
  const areaPath = useMemo(() => {
    if (stages.length === 0) return '';
    const first = `M ${xScale(0)} ${PADDING.top + CHART_HEIGHT}`;
    const line = stages.map((s, i) => `L ${xScale(i)} ${yScale(s.targetAmount)}`).join(' ');
    const last = `L ${xScale(stages.length - 1)} ${PADDING.top + CHART_HEIGHT} Z`;
    return `${first} ${line} ${last}`;
  }, [stages, xScale, yScale]);

  // 根据鼠标位置更新激活索引
  const updateActiveFromPointer = useCallback((clientX: number) => {
    const svg = svgRef.current;
    if (!svg || stages.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const svgX = (clientX - rect.left) * scaleX;
    // 找最近的数据点
    let minDist = Infinity;
    let nearest = 0;
    stages.forEach((_, i) => {
      const dist = Math.abs(svgX - xScale(i));
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setActiveIndex(nearest);
  }, [stages, xScale]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateActiveFromPointer(e.clientX);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateActiveFromPointer(e.clientX);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex(i => Math.min(stages.length - 1, i + 1));
    }
  };

  if (stages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: theme.accentColor, fontFamily: SAGE_FONT_SERIF }}>
        暂无融资阶段数据
      </div>
    );
  }

  const activeStage = stages[activeIndex];
  const textColor = isDark ? theme.textDark : theme.textLight;
  const subTextColor = isDark ? 'rgba(245,239,227,0.6)' : 'rgba(41,37,36,0.6)';
  const borderColor = isDark ? theme.borderDark : theme.borderLight;
  const gridColor = isDark ? 'rgba(245,239,227,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 每年融资汇总卡 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {yearlyTotals.map((yt, i) => (
          <SageStatCard
            key={yt.year}
            label={`第${yt.year}年融资`}
            value={yt.amount}
            suffix="万"
            theme={theme}
            isDark={isDark}
            stagger={i + 1}
          />
        ))}
      </div>

      {/* SVG折线图 + 可拖拽滑块 */}
      <div
        style={{
          background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          padding: '12px 8px',
          cursor: 'pointer',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={stages.length}
          aria-label="融资时间轴"
        >
          <defs>
            <linearGradient id="financeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.accentColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={theme.accentColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Y轴网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = PADDING.top + CHART_HEIGHT * (1 - ratio);
            const val = Math.round(maxAmount * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={PADDING.left} y1={y}
                  x2={W - PADDING.right} y2={y}
                  stroke={gridColor} strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8} y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill={subTextColor}
                  fontFamily={SAGE_FONT_SERIF}
                >
                  {val}万
                </text>
              </g>
            );
          })}

          {/* 面积填充 */}
          {areaPath && <path d={areaPath} fill="url(#financeAreaGrad)" />}

          {/* 折线 */}
          <path
            d={linePath}
            fill="none"
            stroke={theme.accentColor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 数据点 */}
          {stages.map((s, i) => {
            const isActive = i === activeIndex;
            const cx = xScale(i);
            const cy = yScale(s.targetAmount);
            return (
              <g key={s.id}>
                {/* 数据点光晕（激活时） */}
                {isActive && (
                  <circle cx={cx} cy={cy} r={12}
                    fill={theme.accentColor} opacity={0.15}>
                    <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* 数据点圆 */}
                <circle
                  cx={cx} cy={cy}
                  r={isActive ? 7 : 4.5}
                  fill={isActive ? theme.accentColor : (isDark ? theme.surfaceDark : '#fff')}
                  stroke={theme.accentColor}
                  strokeWidth={isActive ? 0 : 2}
                  style={{ transition: 'r 0.2s, fill 0.2s' }}
                />
                {/* X轴标签 */}
                <text
                  x={cx} y={H - PADDING.bottom + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isActive ? theme.accentColor : subTextColor}
                  fontFamily={SAGE_FONT_SERIF}
                  fontWeight={isActive ? 700 : 400}
                >
                  第{s.year}年
                </text>
                <text
                  x={cx} y={H - PADDING.bottom + 36}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill={subTextColor}
                  fontFamily={SAGE_FONT_SERIF}
                >
                  {s.roundName}
                </text>
                {/* 激活点金额标签 */}
                {isActive && (
                  <g>
                    <rect
                      x={cx - 32} y={cy - 28}
                      width={64} height={20}
                      rx={4}
                      fill={theme.accentColor}
                    />
                    <text
                      x={cx} y={cy - 14}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="#fff"
                      fontFamily={SAGE_FONT_SERIF}
                    >
                      {s.targetAmount}万
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 拖拽提示线（激活点垂直线） */}
          <line
            x1={xScale(activeIndex)} y1={PADDING.top}
            x2={xScale(activeIndex)} y2={PADDING.top + CHART_HEIGHT}
            stroke={theme.accentColor}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        </svg>

        {/* 拖拽提示文字 */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <span style={{
            fontSize: 10.5,
            color: subTextColor,
            fontFamily: SAGE_FONT_SERIF,
          }}>
            ← 拖动或点击折线图查看各阶段融资计划 · 键盘 ← → 切换 →
          </span>
        </div>
      </div>

      {/* 当前激活阶段详情（无序列表） */}
      <div
        className="sage-fade-in-up"
        key={activeStage.id}
        style={{
          background: isDark ? 'rgba(0,0,0,0.15)' : `${theme.accentColor}08`,
          border: `1px solid ${theme.accentColor}33`,
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        {/* 阶段标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: theme.accentColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SAGE_FONT_SERIF, fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {activeStage.year}
          </div>
          <div>
            <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 15, fontWeight: 700, color: textColor }}>
              {activeStage.roundName}
              {activeStage.timeline && (
                <span style={{ fontSize: 11, color: subTextColor, marginLeft: 8, fontWeight: 400 }}>
                  {activeStage.timeline}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 阶段指标 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10.5, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>融资金额</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: theme.accentColor, fontFamily: SAGE_FONT_SERIF }}>
              {activeStage.targetAmount} <span style={{ fontSize: 11 }}>万元</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10.5, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>出让股权</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: theme.accentColor, fontFamily: SAGE_FONT_SERIF }}>
              {activeStage.equityOffered}<span style={{ fontSize: 11 }}>%</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10.5, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>预期估值</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: theme.accentColor, fontFamily: SAGE_FONT_SERIF }}>
              {activeStage.valuation} <span style={{ fontSize: 11 }}>万元</span>
            </span>
          </div>
        </div>

        {/* 里程碑（无序列表） */}
        {activeStage.milestones.length > 0 && (
          <div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: textColor,
              fontFamily: SAGE_FONT_SERIF, marginBottom: 8, letterSpacing: 1,
            }}>
              融资计划
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {activeStage.milestones.map((m, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: 6,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: theme.accentColor,
                    marginTop: 7, flexShrink: 0, opacity: 0.7,
                  }} />
                  <span style={{
                    fontSize: 12.5, color: textColor,
                    fontFamily: SAGE_FONT_SERIF, lineHeight: 1.7,
                  }}>
                    {m}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 阶段导航点 */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {stages.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIndex(i)}
            style={{
              width: i === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              background: i === activeIndex ? theme.accentColor : `${theme.accentColor}33`,
              cursor: 'pointer',
              transition: 'width 0.2s, background 0.2s',
              padding: 0,
            }}
            aria-label={`跳转到第${s.year}年`}
          />
        ))}
      </div>
    </div>
  );
};

export default FinancingTimeline;
