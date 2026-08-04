/**
 * 军师AI - 需求分析面板（案一 · 金）
 * 分区式结构：创业想法设定 + 需求总览指标 + 需求分布图(ECharts) + 需求卡片清单 + 报告全文
 * 动画：指标数字递增 / 图表入场 / 卡片交错入场 / 印章 CTA
 */

import React, { useEffect, useRef } from 'react';
import { Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import AIGeneratorForm from '../AIGeneratorForm';
import { SAGE_REQUIREMENTS_KEY } from './sage-storage';
import { SageSection, SageStatCard } from './shared';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { splitByH2, extractListItems, extractKeyValues } from './sage-markdown';

const { Text } = Typography;

// ─── 解析工具 ─────────────────────────────────────────────

interface RequirementItem {
  name: string;
  body: string;
  priority: string; // P0 | P1 | P2 | P3
  category: string;
}

const PRIORITY_META: Record<string, { color: string; label: string }> = {
  P0: { color: '#E11D48', label: 'P0 核心' },
  P1: { color: '#F59E0B', label: 'P1 重要' },
  P2: { color: '#0E7490', label: 'P2 一般' },
  P3: { color: '#6B7280', label: 'P3 延后' },
};

const detectPriority = (text: string): string => {
  const m = text.match(/P\s*[0-3]/i);
  if (m) return m[0].replace(/\s+/g, '').toUpperCase();
  if (/优先级[:：]\s*高/.test(text)) return 'P0';
  if (/优先级[:：]\s*中/.test(text)) return 'P1';
  if (/优先级[:：]\s*低/.test(text)) return 'P2';
  return 'P2';
};

const detectCategory = (text: string): string => {
  const m = text.match(/类别[:：]\s*([^，,。；;\s]{2,6})/);
  return m ? m[1] : '功能';
};

// 从"用户需求/功能需求/非功能需求"章节提取需求条目
const parseRequirements = (result: string): RequirementItem[] => {
  const sections = splitByH2(result).filter((s) => /需求|功能/.test(s.title));
  const items: RequirementItem[] = [];
  for (const section of sections) {
    for (const raw of extractListItems(section.content)) {
      const idx = raw.search(/[：:]/);
      const name = idx > 0 ? raw.slice(0, idx).trim() : raw;
      const body = idx > 0 ? raw.slice(idx + 1).trim() : '';
      items.push({
        name: name.replace(/^#{1,6}\s*/, '').trim(),
        body,
        priority: detectPriority(raw),
        category: detectCategory(raw),
      });
    }
  }
  return items.slice(0, 12);
};

// 仅从"项目概述"章节提取指标，避免"优先级：P0"这类行混入
const extractOverviewMetrics = (result: string): { label: string; value: string }[] => {
  const overview = splitByH2(result).find(
    (s) => s.title.includes('概述') || s.title.includes('项目信息')
  );
  return extractKeyValues(overview ? overview.content : result).slice(0, 6);
};

const countBy = <T,>(items: T[], key: (t: T) => string): { name: string; value: number }[] => {
  const map = new Map<string, number>();
  items.forEach((it) => {
    const k = key(it) || '其他';
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

// ─── ECharts 需求分布图（环形饼图）───────────────────────────

const RequirementChart: React.FC<{ theme: SageTheme; isDark: boolean; reqs: RequirementItem[] }> = ({
  theme,
  isDark,
  reqs,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || reqs.length === 0) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? theme.textDark : theme.textLight, fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? theme.surfaceDark : '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            color: isDark ? theme.textDark : theme.textLight,
            fontSize: 11,
          },
          data: countBy(reqs, (r) => r.priority).map((d, i) => ({
            ...d,
            itemStyle: { color: theme.chartColors[i % theme.chartColors.length] },
          })),
        },
      ],
    });
    return () => chart.dispose();
  }, [reqs, theme, isDark]);

  if (reqs.length === 0) return null;
  return <div ref={chartRef} style={{ width: '100%', height: 240 }} />;
};

// ─── 主面板 ───────────────────────────────────────────────

const RequirementsAnalysis: React.FC = () => (
  <AIGeneratorForm
    title="需求分析"
    variant="sage"
    sageTheme="requirements"
    fields={[
      { name: 'projectName', label: '项目名称', placeholder: '如：校园二手书交易平台', required: true },
      { name: 'ideaContent', label: '创业想法', placeholder: '用一段话描述：解决什么问题、给谁用、核心差异...', required: true },
      { name: 'targetUser', label: '目标用户', placeholder: '如：高校大学生、职场新人、宝妈群体...', required: true },
      { name: 'stage', label: '当前阶段', placeholder: '如：创意构思、市场验证、MVP开发...', required: true },
    ]}
    systemPrompt={`你是一位资深产品需求分析师，擅长把创业想法转化为结构化的需求分析报告。请根据用户提供的项目信息，生成专业的需求分析报告（Markdown 格式）。

输出结构（严格使用 ## 二级标题，每个需求条目必须带 优先级 与 类别 标注，便于可视化）：
# 需求分析报告

## 一、项目概述
- 项目名称：XXX
- 目标用户：XXX
- 核心场景：XXX
- 市场规模：XXX

## 二、用户需求清单
- 需求名称：需求描述（优先级：P0，类别：功能）
（列出 5-8 条核心用户需求）

## 三、功能需求
- 功能点：功能描述（优先级：P0/P1/P2，类别：功能）
（列出 6-10 条功能需求）

## 四、非功能需求
- 性能需求：描述（优先级：P1，类别：性能）
- 安全需求：描述（优先级：P0，类别：安全）
- 可用性需求：描述（优先级：P2，类别：体验）

## 五、需求优先级矩阵
- P0 核心需求：X 项
- P1 重要需求：X 项
- P2 一般需求：X 项

## 六、验收标准
给出每个 P0 需求的验收标准与上线检查清单。`}
    resultTitle="需求分析报告"
    generateLabel="生成报告"
    persistKey={SAGE_REQUIREMENTS_KEY}
    resultRenderer={(result, { theme, isDark, handleDownload }) => {
      const reqs = parseRequirements(result);
      const metrics = extractOverviewMetrics(result);
      const sections = splitByH2(result);
      const textColor = isDark ? theme.textDark : theme.textLight;
      const borderColor = isDark ? theme.borderDark : theme.borderLight;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 分区2：需求总览指标 */}
          {metrics.length > 0 && (
            <SageSection title="需求总览" subtitle="OVERVIEW" theme={theme} isDark={isDark} stagger={2}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {metrics.map((m, i) => (
                  <SageStatCard
                    key={i}
                    label={m.label}
                    value={m.value}
                    theme={theme}
                    isDark={isDark}
                    stagger={i + 1}
                  />
                ))}
              </div>
            </SageSection>
          )}

          {/* 分区3：ECharts 需求分布图 */}
          {reqs.length > 0 && (
            <SageSection title="需求分布" subtitle="PRIORITY DISTRIBUTION" theme={theme} isDark={isDark} stagger={3}>
              <RequirementChart theme={theme} isDark={isDark} reqs={reqs} />
            </SageSection>
          )}

          {/* 分区4：需求卡片清单 */}
          {reqs.length > 0 && (
            <SageSection title="需求清单" subtitle="REQUIREMENTS" theme={theme} isDark={isDark} stagger={4}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 10,
                }}
              >
                {reqs.map((req, i) => {
                  const meta = PRIORITY_META[req.priority] || PRIORITY_META.P2;
                  return (
                    <div
                      key={i}
                      className={`sage-fade-in-up sage-stagger-${i + 2}`}
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${borderColor}`,
                        borderLeft: `3px solid ${meta.color}`,
                        background: isDark ? theme.surfaceDark : '#fff',
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: textColor,
                            fontFamily: SAGE_FONT_SERIF,
                          }}
                        >
                          {req.name}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: '#fff',
                            background: meta.color,
                            borderRadius: 4,
                            padding: '1px 7px',
                            fontFamily: SAGE_FONT_SERIF,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      {req.body && (
                        <Text
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: textColor,
                            opacity: 0.75,
                            fontFamily: SAGE_FONT_SERIF,
                            lineHeight: 1.6,
                          }}
                        >
                          {req.body}
                        </Text>
                      )}
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 8,
                          fontSize: 10,
                          color: theme.accentColor,
                          border: `1px solid ${theme.accentColor}55`,
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontFamily: SAGE_FONT_SERIF,
                        }}
                      >
                        {req.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SageSection>
          )}

          {/* 分区5：报告全文 + 导出 */}
          <SageSection title="需求分析报告全文" subtitle="FULL REPORT" theme={theme} isDark={isDark} stagger={5}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
                onClick={handleDownload}
                style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
              >
                导出 Markdown
              </Button>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(0,0,0,0.25)' : '#FAF6EF',
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                padding: '14px 16px',
                maxHeight: 360,
                overflow: 'auto',
              }}
            >
              {sections.map((section, i) => (
                <div key={i} style={{ marginBottom: i < sections.length - 1 ? 12 : 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: theme.accentColor,
                      fontFamily: SAGE_FONT_SERIF,
                      marginBottom: 4,
                      letterSpacing: 1,
                    }}
                  >
                    {section.title.replace(/^#{1,6}\s*/, '').trim()}
                  </div>
                  <Text
                    style={{
                      color: textColor,
                      whiteSpace: 'pre-wrap',
                      fontFamily: SAGE_FONT_SERIF,
                      lineHeight: 1.8,
                      fontSize: 12.8,
                    }}
                  >
                    {section.content.trim()}
                  </Text>
                </div>
              ))}
            </div>
          </SageSection>
        </div>
      );
    }}
  />
);

export default RequirementsAnalysis;
