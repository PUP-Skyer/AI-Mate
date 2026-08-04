/**
 * 工匠AI - PPT大纲面板（案二 · 琥珀金）
 * 分区式结构：大纲设定 + 大纲预览（行边栏）+ HTML PPT 生成
 * 动画：章节交错入场 / 行边栏悬停动效 / 铆钉 CTA
 */

import React, { useState } from 'react';
import { Typography } from 'antd';
import AIGeneratorForm from '../AIGeneratorForm';
import { MakerSection } from './shared';
import { MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
import { splitByH2, extractListItems } from '../sage/sage-markdown';
import LineSidebar from './LineSidebar';
import PPTPreview from './PPTPreview';

const { Text } = Typography;

/** 行边栏大纲预览（真实组件，持有选中章节状态） */
const OutlineWithSidebar: React.FC<{
  result: string;
  mTheme: MakerTheme;
  isDark: boolean;
}> = ({ result, mTheme, isDark }) => {
  const sections = splitByH2(result);
  const titles = sections.map((s) => s.title.replace(/^#{1,6}\s*/, '').trim());
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const textColor = isDark ? mTheme.textDark : mTheme.textLight;
  const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;

  const current = sections[activeIdx] || sections[0];
  const currentItems = extractListItems(current?.content || '');

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
      {/* 左侧：行边栏 */}
      <div
        style={{
          flexShrink: 0,
          width: 190,
          background: isDark ? 'rgba(0,0,0,0.2)' : '#F7F7F5',
          borderRadius: 10,
          border: `1px solid ${borderColor}`,
          padding: '6px 10px',
          maxHeight: 440,
          overflowY: 'auto',
        }}
      >
        <LineSidebar
          items={titles.length > 0 ? titles : ['大纲章节']}
          accentColor={mTheme.accentColor}
          textColor={isDark ? mTheme.textDark : mTheme.textLight}
          markerColor={isDark ? mTheme.borderDark : mTheme.borderLight}
          showIndex
          showMarker
          proximityRadius={110}
          maxShift={18}
          falloff="smooth"
          markerLength={48}
          markerGap={8}
          tickScale={0.5}
          scaleTick
          itemGap={14}
          fontSize={0.92}
          smoothing={90}
          defaultActive={0}
          onItemClick={(index) => setActiveIdx(index)}
        />
      </div>

      {/* 右侧：选中章节内容 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {current && (
          <div
            key={activeIdx}
            className="maker-fade-in-up"
            style={{
              borderRadius: 10,
              border: `1px solid ${borderColor}`,
              borderTop: `3px solid ${mTheme.accentColor}`,
              background: isDark ? mTheme.surfaceDark : '#fff',
              padding: '16px 18px',
              minHeight: 160,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  background: mTheme.accentColor,
                  borderRadius: 4,
                  padding: '3px 10px',
                  fontFamily: MAKER_FONT_SERIF,
                  letterSpacing: 1,
                  flexShrink: 0,
                }}
              >
                P{activeIdx + 1}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: MAKER_FONT_SERIF,
                }}
              >
                {current.title.replace(/^#{1,6}\s*/, '').trim()}
              </span>
            </div>
            {currentItems.length > 0 ? (
              currentItems.map((item, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: 12.5,
                    color: textColor,
                    opacity: 0.8,
                    fontFamily: MAKER_FONT_SERIF,
                    lineHeight: 1.7,
                    padding: '6px 0',
                    borderTop: j > 0 ? `1px dashed ${borderColor}` : 'none',
                  }}
                >
                  · {item}
                </div>
              ))
            ) : (
              <Text
                style={{
                  fontSize: 12.5,
                  color: textColor,
                  fontFamily: MAKER_FONT_SERIF,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  opacity: 0.8,
                }}
              >
                {current.content.trim() || '（本页暂无要点，点击左侧章节切换查看）'}
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PPTOutline: React.FC = () => (
  <AIGeneratorForm
    title="PPT 路演大纲生成"
    variant="maker"
    makerTheme="ppt"
    fields={[
      { name: 'theme', label: '路演主题', placeholder: '如：大学生创业融资路演...', required: true },
      { name: 'audience', label: '目标受众', placeholder: '如：投资人、评委、合作伙伴...', required: true },
      { name: 'pages', label: '期望页数', placeholder: '如：10-15页', required: true },
      { name: 'keyPoints', label: '核心要点', placeholder: '列出希望在路演中重点传达的内容...', required: true },
    ]}
    systemPrompt={`你是一位专业的路演PPT设计顾问。请根据提供的信息，生成一份结构清晰、逻辑严密的PPT路演大纲（Markdown格式）。

输出结构（严格使用 ## 二级标题，每页一个章节）：
# 路演PPT大纲

## 封面页
- 项目名称与一句话定位

## 目录页
- 全片章节索引

## 问题与机会
- 市场痛点与机会窗口

## 解决方案
- 核心方案与差异化

## 产品演示
- 关键功能与使用场景

## 商业模式
- 收入模型与成本结构

## 市场规模
- TAM/SAM/SOM 与增长预期

## 竞争分析
- 主要竞对与优势对比

## 团队介绍
- 核心成员与分工

## 财务规划
- 关键财务指标与预测

## 融资需求
- 融资金额、用途与里程碑

## 结尾页
- 愿景总结与联系方式

每页用 - 列出 3-5 个要点。`}
    resultTitle="PPT 大纲"
    generateLabel="生成大纲"
    demoLabel="查看示例大纲"
    demoContent={`# 大学生创业融资路演

## 封面页
- 项目名称：校园易购 — 高校生活服务一站式平台
- 一句话定位：让校园生活更便捷，让创业实践更简单
- 团队：青宸智汇大学生创业团队

## 目录页
- 01 问题与机会
- 02 解决方案
- 03 商业模式
- 04 市场规模与竞争分析
- 05 团队与财务规划
- 06 融资需求

## 问题与机会
- 痛点：校园二手交易分散、信息不透明、信任缺失
- 现状：全国 3000+ 高校，超 4500 万在校生
- 机会：校园市场年交易规模超千亿，线上渗透率不足 15%

## 解决方案
- 核心功能：二手交易 + 跑腿代取 + 拼团省钱
- 差异化：实名认证 + 校内信用分 + 24h 客服
- 技术亮点：LBS 定位 + 智能推荐 + 小程序轻量体验

## 产品演示
- 首页信息流与搜索
- 发布流程（拍照上传 + 智能估价）
- 订单履约与评价闭环

## 商业模式
- 收入来源：交易佣金 5% + 广告位 + 增值服务
- 成本结构：研发 40% + 运营 30% + 市场 30%
- 盈利模型：单校模型跑通后快速复制

## 市场规模
- TAM：全国高校生活服务 1200 亿
- SAM：可服务的一线城市 200 所高校 80 亿
- SOM：上线 3 年内覆盖 50 所高校 2 亿

## 竞争分析
- 竞对 1：闲鱼 — 无校园专属服务
- 竞对 2：美团 — 无二手交易场景
- 我们的优势：校园场景深耕 + 信任体系

## 团队介绍
- 创始人：王小明（连续创业者，曾获省级创业金奖）
- CTO：李华（前大厂后端工程师）
- 运营：张丽（校园社群运营达人）

## 财务规划
- 未来 12 个月营收预测：240 万元
- 关键指标：MAU 5 万，GMV 800 万
- 盈亏平衡点：第 10 个月

## 融资需求
- 融资金额：200 万元（出让 10%）
- 资金用途：产品研发 40% + 市场推广 35% + 团队扩张 25%
- 里程碑：6 个月覆盖 20 所高校，12 个月实现盈亏平衡

## 结尾页
- 愿景：成为大学生信赖的生活服务平台
- 联系方式：contact@campusbuy.cn
- 谢谢聆听，欢迎提问！`}
    resultRenderer={(result, { theme, isDark }) => {
      const mTheme = theme as unknown as MakerTheme;
      const textColor = isDark ? mTheme.textDark : mTheme.textLight;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 分区2：大纲预览（行边栏） */}
          <MakerSection title="大纲预览" subtitle="OUTLINE PREVIEW" theme={mTheme} isDark={isDark} stagger={2}>
            <OutlineWithSidebar result={result} mTheme={mTheme} isDark={isDark} />
          </MakerSection>

          {/* 分区3：HTML PPT 生成 */}
          <MakerSection title="HTML PPT 生成" subtitle="HTML DECK" theme={mTheme} isDark={isDark} stagger={3}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: `1px dashed ${mTheme.accentColor}66`,
                background: `${mTheme.accentColor}08`,
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor, fontFamily: MAKER_FONT_SERIF }}>
                  一键生成可演示的 HTML PPT
                </div>
                <div style={{ fontSize: 11.5, color: textColor, opacity: 0.6, fontFamily: MAKER_FONT_SERIF, marginTop: 2 }}>
                  自包含文件 · 方向键翻页 · 进度条 · 全屏演示（F）
                </div>
              </div>
              <PPTPreview title="路演PPT" markdown={result} mTheme={mTheme} isDark={isDark} />
            </div>
          </MakerSection>
        </div>
      );
    }}
  />
);

export default PPTOutline;
