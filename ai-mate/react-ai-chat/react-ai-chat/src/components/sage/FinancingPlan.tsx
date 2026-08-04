/**
 * 军师AI - 融资规划面板（案四 · 财青）
 * 分区式结构：融资设定 + 方案要点 + 资金用途分配 + 融资方案全文
 * 动画：指标数字递增 / 预算条增长 / 交错入场
 */

import React from 'react';
import { Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import AIGeneratorForm from '../AIGeneratorForm';
import { SageSection, SageStatCard } from './shared';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { splitByH2, extractKeyValues } from './sage-markdown';

const { Text } = Typography;

// 从全文提取关键指标
const extractMetrics = (result: string): { label: string; value: string }[] => {
  const all: { label: string; value: string }[] = [];

  // 从键值对行提取
  for (const line of result.split('\n')) {
    const m = line.match(/^\s*[-*]?\s*([^：:]{2,12})[：:]\s*(.+)$/);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();
      // 过滤关键指标
      if (
        /融资金额|出让比例|估值|股份|期限|周期|目标金额|轮次/.test(label) &&
        value.length < 20
      ) {
        all.push({ label, value });
      }
    }
  }
  // 去重（保留前 6 个）
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.label)) return false;
    seen.add(p.label);
    return true;
  }).slice(0, 6);
};

// 从"资金用途"章节提取分配比例
const extractBudget = (result: string, theme: SageTheme): { label: string; value: number; color: string }[] => {
  const section = splitByH2(result).find(
    (s) => s.title.includes('资金用途') || s.title.includes('预算') || s.title.includes('分配')
  );
  const items: { label: string; value: number }[] = [];
  const source = section ? section.content : result;
  for (const line of source.split('\n')) {
    const m = line.match(/^\s*[-*]?\s*([^：:]{2,12})[：:]\s*(\d+(?:\.\d+)?)\s*%?/);
    if (m) {
      const value = parseFloat(m[2]);
      if (!Number.isNaN(value) && value > 0 && value <= 100) {
        items.push({ label: m[1].trim(), value });
      }
    }
  }
  // 不足 3 项时用示例数据兜底
  const fallback = [
    { label: '产品研发', value: 40 },
    { label: '市场推广', value: 35 },
    { label: '团队扩张', value: 15 },
    { label: '运营储备', value: 10 },
  ];
  const final = items.length >= 2 ? items : fallback;
  const total = final.reduce((sum, i) => sum + i.value, 0) || 100;
  return final.map((i, idx) => ({
    ...i,
    value: Math.round((i.value / total) * 100),
    color: theme.chartColors[idx % theme.chartColors.length],
  }));
};

const FinancingPlan: React.FC = () => (
  <AIGeneratorForm
    title="融资规划"
    variant="sage"
    sageTheme="finance"
    fields={[
      { name: 'projectName', label: '项目名称', placeholder: '请输入项目名称', required: true },
      { name: 'industry', label: '所属行业', placeholder: '如：人工智能、消费升级、教育科技...', required: true },
      { name: 'stage', label: '当前阶段', placeholder: '如：种子轮、天使轮、Pre-A轮...', required: true },
      { name: 'fundingNeed', label: '融资金额', placeholder: '如：100万、500万...', required: true },
      { name: 'useOfFunds', label: '资金用途', placeholder: '如：产品研发、市场推广、团队扩张...', required: true },
    ]}
    systemPrompt={`你是一位资深融资顾问，擅长为大学生创业团队设计融资方案。请根据提供的信息，生成一份专业的融资规划报告（Markdown格式）。

输出结构（严格使用 ## 二级标题）：
# 融资规划方案

## 一、项目概述
- 项目简介与市场定位

## 二、融资目标
- 融资金额：XXX万元
- 出让比例：XX%
- 估值预期：XXX万元

## 三、资金用途规划
- 产品研发：40%
- 市场推广：35%
- 团队扩张：15%
- 运营储备：10%
（请按实际情况调整比例，并说明时间节点）

## 四、目标投资人画像
- 合适的投资机构类型和名单建议

## 五、融资路线图
- 本轮及未来2-3轮的融资规划

## 六、退出机制
- 预期退出方式和回报分析

## 七、投资人沟通策略
- BP准备、路演要点、常见问题应对`}
    resultTitle="融资规划方案"
    generateLabel="生成方案"
    resultRenderer={(result, { theme, isDark }) => {
      const sections = splitByH2(result);
      const metrics = extractMetrics(result);
      const budget = extractBudget(result, theme);
      const textColor = isDark ? theme.textDark : theme.textLight;
      const borderColor = isDark ? theme.borderDark : theme.borderLight;
      const fullSections = sections.filter(
        (s) => !s.title.includes('资金用途') && !s.title.includes('融资目标') && !s.title.includes('项目概述')
      );

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 分区2：方案要点指标卡 */}
          {metrics.length > 0 && (
            <SageSection title="方案要点" subtitle="KEY METRICS" theme={theme} isDark={isDark} stagger={2}>
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

          {/* 分区3：资金用途分配 */}
          <SageSection title="资金用途分配" subtitle="BUDGET ALLOCATION" theme={theme} isDark={isDark} stagger={3}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {budget.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 76,
                      fontSize: 12.5,
                      color: textColor,
                      fontFamily: SAGE_FONT_SERIF,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {item.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 22,
                      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      className="sage-bar-grow"
                      style={{
                        height: '100%',
                        width: `${item.value}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                        borderRadius: 6,
                        animationDelay: `${i * 0.12}s`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 8,
                        minWidth: 34,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#fff',
                          fontFamily: SAGE_FONT_SERIF,
                        }}
                      >
                        {item.value}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SageSection>

          {/* 分区4：融资方案全文 */}
          <SageSection title="融资方案全文" subtitle="FULL REPORT" theme={theme} isDark={isDark} stagger={4}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Button
                type="text"
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = '融资规划方案.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
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
              {fullSections.length > 0 ? (
                fullSections.map((section, i) => (
                  <div key={i} style={{ marginBottom: i < fullSections.length - 1 ? 12 : 0 }}>
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
                ))
              ) : (
                <Text
                  style={{
                    color: textColor,
                    whiteSpace: 'pre-wrap',
                    fontFamily: SAGE_FONT_SERIF,
                    lineHeight: 1.9,
                    fontSize: 13,
                  }}
                >
                  {result}
                </Text>
              )}
            </div>
          </SageSection>
        </div>
      );
    }}
  />
);

export default FinancingPlan;
