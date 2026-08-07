/**
 * 工匠AI - 3D层叠项目文档卡片堆
 * 8-10张卡片呈3D斜向扇形层叠，支持拖拽拉出、点击查看、自动归位、悬停反馈
 * 暗黑科技B端风格，磨砂玻璃拟态，激活态荧光绿发光
 *
 * 核心拖拽逻辑：useRef + rAF + DOM直操，零React重渲染
 * 核心归位逻辑：清除内联样式，CSS transition 300ms ease-out自动回弹
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Tag, Drawer, Typography, Empty, Button } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { MAKER_THEMES, MAKER_FONT_SERIF } from './maker-theme';
import './doc-card-stack.css';
import './maker-animations.css';
import { splitByH2 } from '../sage/sage-markdown';
import type { DocCardData, DocStatus } from './doc-card-storage';
import { removeDocCard } from './doc-card-storage';

const { Text, Paragraph } = Typography;

/** 拖拽判定阈值（像素），小于此距离判定为点击 */
const DRAG_THRESHOLD = 5;

/** 状态标签配置 */
const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  review: { label: '审核中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
};

/** 拖拽过程数据（存储在 useRef 中，不触发重渲染） */
interface DragState {
  startIndex: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  hasMoved: boolean;
}

/**
 * 计算卡片在水平扇形布局中的 3D transform
 * 从左向右弧线展开：每张卡片向右偏移、轻微上抬、绕Y轴旋转形成扇形
 * 左侧卡片面向用户（小角度），右侧卡片逐渐侧转
 */
function getCardTransform(index: number, total: number): string {
  if (total <= 1) return 'translateX(0) rotateX(8deg)';
  // 每张卡片水平偏移量（px），形成层叠错落
  const stepX = 38;
  const translateX = index * stepX;
  // 轻微上抬弧线：中间略高，两端略低
  const arc = Math.sin((index / (total - 1)) * Math.PI) * 12;
  const translateY = -arc;
  // Z轴：靠左的卡片更靠前（z更大），靠右的逐渐后退
  const translateZ = -index * 6;
  // Y轴旋转：左侧约-8°（微面向用户），右侧约+45°（侧转）
  const angleY = -8 + (index / (total - 1)) * 53;
  // X轴轻微俯视
  const angleX = 8;
  return `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${angleY}deg) rotateX(${angleX}deg)`;
}

/**
 * 构建拖拽时的 transform（扇形基础位置 + 拖拽偏移 + 前浮放大）
 */
function buildDragTransform(
  baseTransform: string,
  offsetX: number,
  offsetY: number
): string {
  return `${baseTransform} translateZ(100px) translateX(${offsetX * 0.5}px) translateY(${offsetY}px) scale(1.08)`;
}

interface DocCardStackProps {
  cards: DocCardData[];
  onCardsChange?: () => void;
}

const DocCardStack: React.FC<DocCardStackProps> = ({ cards, onCardsChange }) => {
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const mTheme = MAKER_THEMES.doc;
  const textColor = isDark ? mTheme.textDark : mTheme.textLight;

  // === 视觉状态（触发重渲染） ===
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<DocCardData | null>(null);

  // === 拖拽过程数据（不触发重渲染） ===
  const dragState = useRef<DragState>({
    startIndex: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    hasMoved: false,
  });

  // === DOM 引用 ===
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  /** 存储 mouseUp 处理器的引用，避免 useCallback 自引用 */
  const mouseUpRef = useRef<(e: MouseEvent) => void>(() => {});
  /** 记录最后一次交互是否为拖拽（供 onClick 判断） */
  const wasDragRef = useRef(false);

  // === 拖拽 mousemove 处理器（绑定到 document） ===
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ds = dragState.current;
    if (ds.startIndex === null) return;

    ds.offsetX = e.clientX - ds.startX;
    ds.offsetY = e.clientY - ds.startY;

    // 阈值检测：首次越过阈值时切换为拖拽态
    const distance = Math.sqrt(ds.offsetX ** 2 + ds.offsetY ** 2);
    if (!ds.hasMoved && distance > DRAG_THRESHOLD) {
      ds.hasMoved = true;
      setIsDragging(true);
      setActiveIndex(ds.startIndex);
    }

    // rAF 节流：直接操作 DOM style，零重渲染
    if (rafRef.current === null && ds.hasMoved) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (ds.startIndex !== null && ds.hasMoved) {
          const cardEl = cardRefs.current[ds.startIndex];
          if (cardEl) {
            const baseTransform = getCardTransform(ds.startIndex, cards.length);
            cardEl.style.transition = 'none';
            cardEl.style.transform = buildDragTransform(
              baseTransform,
              ds.offsetX,
              ds.offsetY
            );
            cardEl.style.zIndex = '1000';
          }
        }
      });
    }
  }, [cards.length]);

  // === 拖拽 mouseup 处理器（绑定到 document） ===
  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', mouseUpRef.current);

    const ds = dragState.current;

    // 记录本次交互是否为拖拽，供 onClick 判断
    wasDragRef.current = ds.hasMoved;

    if (ds.startIndex !== null) {
      if (!ds.hasMoved) {
        // === 点击：未越过阈值 ===
        const card = cards[ds.startIndex];
        if (card) {
          setSelectedCard(card);
        }
      } else {
        // === 拖拽结束：清除内联样式，CSS transition 自动回弹 ===
        const cardEl = cardRefs.current[ds.startIndex];
        if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
          cardEl.style.zIndex = '';
        }
      }
    }

    // 清理 rAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // 重置状态
    setIsDragging(false);
    setActiveIndex(null);
    dragState.current = {
      startIndex: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      hasMoved: false,
    };
  }, [cards, handleMouseMove]);

  // 保持 ref 与最新回调同步（在 effect 中更新 ref，避免渲染期间访问）
  useEffect(() => {
    mouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

  // === 鼠标按下：记录起点，绑定 document 事件 ===
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (e.button !== 0) return; // 仅响应左键
      e.preventDefault(); // 阻止默认选中和拖拽行为

      dragState.current = {
        startIndex: index,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: 0,
        offsetY: 0,
        hasMoved: false,
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', mouseUpRef.current);
    },
    [handleMouseMove]
  );

  // === 组件卸载时清理事件监听 ===
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', mouseUpRef.current);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove]);

  // === 删除卡片 ===
  const handleDelete = useCallback(
    (cardId: string) => {
      removeDocCard(cardId);
      onCardsChange?.();
    },
    [onCardsChange]
  );

  // === 导出文档 ===
  const handleExport = useCallback((card: DocCardData) => {
    const blob = new Blob([card.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // === 空状态 ===
  if (cards.length === 0) {
    return (
      <Empty
        description="暂无文档卡片，生成文档后点击「添加到卡片堆」"
        style={{ padding: 40 }}
      />
    );
  }

  // === 详情面板章节列表 ===
  const detailSections = selectedCard
    ? splitByH2(selectedCard.content)
    : [];

  return (
    <>
      {/* 3D 卡片堆舞台 */}
      <div className={`doc-card-stage ${isDark ? '' : 'light-mode'}`}>
        <div className={`doc-card-layer ${isDragging ? 'is-dragging' : ''}`}>
          {cards.map((card, index) => {
            const total = cards.length;
            const baseTransform = getCardTransform(index, total);
            const statusCfg = STATUS_CONFIG[card.status];
            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`doc-card ${
                  activeIndex === index ? 'active' : ''
                } ${isDragging && activeIndex === index ? 'dragging' : ''} ${
                  hoveredIndex === index && !isDragging ? 'hovered' : ''
                }`}
                style={{
                  transform: baseTransform,
                  zIndex: total - index,
                }}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onClick={() => {
                  // click 在 mouseup 之后触发；若非拖拽则打开详情
                  if (!wasDragRef.current) {
                    setSelectedCard(card);
                  }
                  wasDragRef.current = false;
                }}
                onMouseEnter={() =>
                  !isDragging && setHoveredIndex(index)
                }
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* 序号徽章 */}
                <div className="doc-card-badge">{index + 1}</div>

                {/* 卡片内容 */}
                <div className="doc-card-content">
                  {/* 文档标题 */}
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: textColor,
                      fontFamily: MAKER_FONT_SERIF,
                      lineHeight: 1.4,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 28,
                    }}
                  >
                    {card.title}
                  </div>

                  {/* 核心数据：大号进度百分比（居中） */}
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        color: '#00FF88',
                        fontFamily: MAKER_FONT_SERIF,
                        lineHeight: 1,
                        textShadow: '0 0 16px rgba(0, 255, 136, 0.3)',
                      }}
                    >
                      {card.progress}%
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: textColor,
                        opacity: 0.5,
                        fontFamily: MAKER_FONT_SERIF,
                        letterSpacing: 1,
                      }}
                    >
                      完成进度
                    </span>
                  </div>

                  {/* 文档缩略纹理（灰色横线模拟文本行） */}
                  <div className="doc-card-texture">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="doc-card-texture-line"
                        style={{
                          width: `${80 - i * 10}%`,
                          opacity: 0.4 + (i % 2) * 0.15,
                        }}
                      />
                    ))}
                  </div>

                  {/* 底部信息栏 */}
                  <div className="doc-card-footer">
                    <Tag
                      color={statusCfg.color}
                      style={{ fontSize: 9, margin: 0, lineHeight: '18px' }}
                    >
                      {statusCfg.label}
                    </Tag>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: textColor,
                        opacity: 0.4,
                        fontFamily: MAKER_FONT_SERIF,
                      }}
                    >
                      {card.sections.length} 章
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作提示 */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            color: textColor,
            opacity: 0.45,
            fontFamily: MAKER_FONT_SERIF,
          }}
        >
          拖拽卡片移出查看 · 单击卡片打开详情 · 松开自动归位
        </Text>
      </div>

      {/* 卡片列表管理 */}
      {cards.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          {cards.map((card, index) => {
            const statusCfg = STATUS_CONFIG[card.status];
            return (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${isDark ? mTheme.borderDark : mTheme.borderLight}`,
                  background: isDark ? mTheme.surfaceDark : '#fff',
                  fontSize: 11,
                  fontFamily: MAKER_FONT_SERIF,
                }}
              >
                <span
                  style={{
                    color: mTheme.accentColor,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </span>
                <span
                  style={{
                    color: textColor,
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.title}
                </span>
                <Tag
                  color={statusCfg.color}
                  style={{ fontSize: 9, margin: 0, lineHeight: '16px' }}
                >
                  {statusCfg.label}
                </Tag>
                <button
                  onClick={() => handleExport(card)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: mTheme.accentColor,
                    fontSize: 12,
                    padding: 0,
                  }}
                  title="导出文档"
                >
                  <DownloadOutlined />
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#ff4d4f',
                    fontSize: 12,
                    padding: 0,
                  }}
                  title="删除卡片"
                >
                  <DeleteOutlined />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 详情面板 Drawer */}
      <Drawer
        title={
          selectedCard ? (
            <span style={{ fontFamily: MAKER_FONT_SERIF }}>
              {selectedCard.title}
            </span>
          ) : (
            ''
          )
        }
        open={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        width={520}
        styles={{
          body: {
            background: isDark ? '#111827' : '#f5f5f5',
            padding: '16px 20px',
          },
          header: {
            background: isDark ? '#111827' : '#f5f5f5',
            borderBottom: `1px solid ${isDark ? mTheme.borderDark : mTheme.borderLight}`,
          },
        }}
        extra={
          selectedCard && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(selectedCard)}
              style={{ color: mTheme.accentColor }}
            >
              导出
            </Button>
          )
        }
      >
        {selectedCard && (
          <div>
            {/* 卡片元信息 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${isDark ? mTheme.borderDark : mTheme.borderLight}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  进度
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#00FF88',
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  {selectedCard.progress}%
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  状态
                </div>
                <Tag
                  color={STATUS_CONFIG[selectedCard.status].color}
                  style={{ marginTop: 2 }}
                >
                  {STATUS_CONFIG[selectedCard.status].label}
                </Tag>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  章节数
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: mTheme.accentColor,
                    fontFamily: MAKER_FONT_SERIF,
                  }}
                >
                  {detailSections.length}
                </div>
              </div>
            </div>

            {/* 章节内容 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {detailSections.map((section, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${isDark ? mTheme.borderDark : mTheme.borderLight}`,
                    borderLeft: `3px solid ${mTheme.accentColor}`,
                    background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: textColor,
                      fontFamily: MAKER_FONT_SERIF,
                      marginBottom: 8,
                    }}
                  >
                    {section.title.replace(/^#{1,6}\s*/, '').trim()}
                  </div>
                  <Paragraph
                    style={{
                      fontSize: 12.5,
                      color: textColor,
                      opacity: 0.8,
                      fontFamily: MAKER_FONT_SERIF,
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {section.content.trim() || '（本章暂无内容）'}
                  </Paragraph>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default DocCardStack;
