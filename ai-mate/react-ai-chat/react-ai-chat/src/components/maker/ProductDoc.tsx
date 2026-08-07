/**
 * 工匠AI - 产品文档面板（案三 · 靛青）
 * 分区式结构：文档设定 + 动态折叠文件夹
 * 动画：折叠展开 / 铆钉 CTA
 */

import React, { useState, useCallback } from 'react';
import { Typography, Button, Space } from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  DownloadOutlined,
  DownOutlined,
  RightOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import AIGeneratorForm from '../AIGeneratorForm';
import { MakerSection } from './shared';
import { MAKER_FONT_SERIF, MAKER_THEMES, type MakerTheme } from './maker-theme';
import { splitByH2 } from '../sage/sage-markdown';
import { useAIStore } from '../../store/aiStore';
import DocCardStack from './DocCardStack';
import {
  loadDocCards,
  addDocCard,
  type DocCardData,
} from './doc-card-storage';

const { Text } = Typography;

/** 折叠文件夹树（真实组件，持有展开状态） */
const DocTree: React.FC<{
  result: string;
  mTheme: MakerTheme;
  isDark: boolean;
}> = ({ result, mTheme, isDark }) => {
  const sections = splitByH2(result);
  const textColor = isDark ? mTheme.textDark : mTheme.textLight;
  const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;
  const [openKeys, setOpenKeys] = useState<Record<number, boolean>>({ 0: true });

  return (
    <>
      {/* 折叠文件夹树 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sections.map((section, i) => {
          const isOpen = !!openKeys[i];
          return (
            <div key={i} className="maker-fade-in-up" style={{ animationDelay: `${Math.min(i, 9) * 0.06}s` }}>
              {/* 章节文件夹行 */}
              <div
                onClick={() => setOpenKeys((prev) => ({ ...prev, [i]: !prev[i] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${isOpen ? mTheme.accentColor + '55' : borderColor}`,
                  background: isOpen ? `${mTheme.accentColor}0A` : (isDark ? mTheme.surfaceDark : '#fff'),
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                {isOpen ? (
                  <FolderOpenOutlined style={{ color: mTheme.accentColor, fontSize: 15 }} />
                ) : (
                  <FolderOutlined style={{ color: mTheme.accentColor, fontSize: 15 }} />
                )}
                <span
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  {section.title.replace(/^#{1,6}\s*/, '').trim()}
                </span>
                <span style={{ fontSize: 10.5, color: textColor, opacity: 0.45, fontFamily: MAKER_FONT_SERIF }}>
                  {section.content.trim() ? `${section.content.trim().split('\n').length} 行` : '空'}
                </span>
                {isOpen ? (
                  <DownOutlined style={{ fontSize: 10, color: mTheme.accentColor }} />
                ) : (
                  <RightOutlined style={{ fontSize: 10, color: textColor, opacity: 0.5 }} />
                )}
              </div>

              {/* 展开内容 */}
              {isOpen && (
                <div
                  className="maker-folder-open"
                  style={{
                    margin: '6px 0 2px 26px',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isDark ? 'rgba(0,0,0,0.25)' : '#F7F7F5',
                    borderLeft: `3px solid ${mTheme.accentColor}`,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      whiteSpace: 'pre-wrap',
                      fontFamily: MAKER_FONT_SERIF,
                      fontSize: 12.5,
                      lineHeight: 1.8,
                    }}
                  >
                    {section.content.trim() || '（本章暂无内容）'}
                  </Text>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部操作 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => {
              const all: Record<number, boolean> = {};
              sections.forEach((_, i) => { all[i] = true; });
              setOpenKeys(all);
            }}
            style={{ color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF, fontSize: 12 }}
          >
            全部展开
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              const blob = new Blob([result], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '产品文档.md';
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF, fontSize: 12 }}
          >
            导出 Markdown
          </Button>
        </Space>
      </div>
    </>
  );
};

const ProductDoc: React.FC = () => {
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const mTheme = MAKER_THEMES.doc;
  const [cards, setCards] = useState<DocCardData[]>(() => loadDocCards().cards);

  /** 将生成的文档添加到3D卡片堆 */
  const handleAddToStack = useCallback((result: string) => {
    const sections = splitByH2(result);
    const titleMatch = result.match(/^#{1,2}\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '未命名文档';

    const newCard: DocCardData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      progress: Math.min(sections.length * 11, 100),
      status: 'draft',
      content: result,
      sections: sections.map((s) => s.title.replace(/^#{1,6}\s*/, '').trim()),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addDocCard(newCard);
    setCards(loadDocCards().cards);
  }, []);

  /** 卡片变更回调（删除/导出后刷新） */
  const handleCardsChange = useCallback(() => {
    setCards(loadDocCards().cards);
  }, []);

  return (
    <AIGeneratorForm
      title="产品文档生成（PRD / 用户手册）"
      variant="maker"
      makerTheme="doc"
      fields={[
        { name: 'productName', label: '产品名称', placeholder: '请输入产品名称', required: true },
        { name: 'productType', label: '文档类型', placeholder: 'PRD / 用户手册 / API文档', required: true },
        { name: 'intro', label: '产品简介', placeholder: '简要描述产品功能和目标用户...', required: true },
        { name: 'features', label: '核心功能', placeholder: '列出产品的主要功能模块...', required: true },
      ]}
      systemPrompt={`你是一位资深产品经理，擅长撰写专业的产品文档。请根据提供的信息，生成一份结构完整的产品文档（Markdown格式）。

输出结构（严格使用 ## 二级标题，每章一个标题）：
# 产品文档

## 一、文档概述
## 二、产品背景
## 三、需求分析
## 四、功能规格
## 五、用户场景
## 六、界面原型说明
## 七、数据模型
## 八、非功能需求
## 九、附录

每章用 - 列出 2-4 个要点。`}
      resultTitle="产品文档"
      generateLabel="生成文档"
      resultRenderer={(result, { theme }) => {
        const renderTheme = theme as unknown as MakerTheme;
        return (
          <>
            {/* 保留：文档结构树 */}
            <MakerSection title="文档结构" subtitle="FOLDER TREE" theme={renderTheme} isDark={isDark} stagger={2}>
              <DocTree result={result} mTheme={renderTheme} isDark={isDark} />
            </MakerSection>

            {/* 添加到3D卡片堆按钮 */}
            <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddToStack(result)}
                style={{
                  background: renderTheme.sealColor,
                  border: 'none',
                  borderRadius: 8,
                  height: 38,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontFamily: MAKER_FONT_SERIF,
                  fontWeight: 600,
                  letterSpacing: 1,
                  boxShadow: `0 4px 14px ${renderTheme.glowColor}`,
                }}
              >
                添加到3D文档卡片堆
              </Button>
            </div>
          </>
        );
      }}
      extraContent={
        cards.length > 0 ? (
          <MakerSection title="文档卡片堆" subtitle="3D CARD STACK" theme={mTheme} isDark={isDark} stagger={3}>
            <DocCardStack cards={cards} onCardsChange={handleCardsChange} />
          </MakerSection>
        ) : null
      }
    />
  );
};

export default ProductDoc;
