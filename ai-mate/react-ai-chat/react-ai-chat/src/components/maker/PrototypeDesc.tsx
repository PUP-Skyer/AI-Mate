/**
 * 工匠AI - 原型描述面板（案四 · 紫罗兰）
 * 分区式结构：描述设定 + 页面描述网格卡片
 * 动画：卡片交错入场 / 铆钉 CTA
 */

import React from 'react';
import { Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import AIGeneratorForm from '../AIGeneratorForm';
import { MakerSection } from './shared';
import { MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
import { splitByH2, extractListItems } from '../sage/sage-markdown';

const { Text } = Typography;

const PrototypeDesc: React.FC = () => (
  <AIGeneratorForm
    title="原型页面描述生成"
    variant="maker"
    makerTheme="proto"
    fields={[
      { name: 'pageName', label: '页面名称', placeholder: '如：首页、个人中心、支付页...', required: true },
      { name: 'pageType', label: '页面类型', placeholder: '如：列表页、详情页、表单页...', required: true },
      { name: 'elements', label: '页面元素', placeholder: '描述页面包含的主要元素和组件...', required: true },
      { name: 'interactions', label: '交互说明', placeholder: '描述用户与页面的交互流程...', required: true },
    ]}
    systemPrompt={`你是一位专业的UX设计师，擅长撰写原型设计文档。请根据提供的信息，生成详细的页面描述和交互说明（Markdown格式）。

输出结构（严格使用 ## 二级标题，每部分一个标题）：
# 原型页面描述

## 一、页面概述
- 页面定位与目标

## 二、页面结构
- 布局与区块划分

## 三、元素说明
- 关键元素与组件

## 四、交互流程
- 用户操作与反馈

## 五、状态说明
- 加载/空/错误状态

## 六、异常处理
- 边界情况与容错

每部分用 - 列出 2-4 个要点。`}
    resultTitle="原型描述"
    generateLabel="生成描述"
    resultRenderer={(result, { theme, isDark }) => {
      const mTheme = theme as unknown as MakerTheme;
      const sections = splitByH2(result);
      const textColor = isDark ? mTheme.textDark : mTheme.textLight;
      const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;

      return (
        <MakerSection title="页面描述" subtitle="PAGE CARDS" theme={mTheme} isDark={isDark} stagger={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {sections.map((section, i) => {
              const items = extractListItems(section.content);
              return (
                <div
                  key={i}
                  className={`maker-fade-in-up maker-stagger-${Math.min(i + 1, 9)}`}
                  style={{
                    borderRadius: 10,
                    border: `1px solid ${borderColor}`,
                    borderTop: `3px solid ${mTheme.chartColors[i % mTheme.chartColors.length]}`,
                    background: isDark ? mTheme.surfaceDark : '#fff',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#fff',
                        background: mTheme.chartColors[i % mTheme.chartColors.length],
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontFamily: MAKER_FONT_SERIF,
                        letterSpacing: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: textColor,
                        fontFamily: MAKER_FONT_SERIF,
                      }}
                    >
                      {section.title.replace(/^#{1,6}\s*/, '').trim()}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    items.map((item, j) => (
                      <div
                        key={j}
                        style={{
                          fontSize: 12,
                          color: textColor,
                          opacity: 0.75,
                          fontFamily: MAKER_FONT_SERIF,
                          lineHeight: 1.65,
                          padding: '4px 0',
                          borderTop: j > 0 ? `1px dashed ${borderColor}` : 'none',
                        }}
                      >
                        {item}
                      </div>
                    ))
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        color: textColor,
                        fontFamily: MAKER_FONT_SERIF,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.65,
                      }}
                    >
                      {section.content.trim()}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => {
                const blob = new Blob([result], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '原型描述.md';
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{ color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF, fontSize: 12 }}
            >
              导出 Markdown
            </Button>
          </div>
        </MakerSection>
      );
    }}
  />
);

export default PrototypeDesc;
