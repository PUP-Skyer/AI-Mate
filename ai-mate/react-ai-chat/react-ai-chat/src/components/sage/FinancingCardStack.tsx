/**
 * 军师AI - 融资阶段3D卡片堆组件
 * 参照 DocCardStack 实现，适配融资阶段数据
 * 水平扇形展开 · 财青主题玻璃态 · 拖拽/点击/归位/悬停交互
 *
 * 核心拖拽逻辑：useRef + rAF + DOM直操，零React重渲染
 * 核心归位逻辑：清除内联样式，CSS transition 300ms ease-out自动回弹
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Tag, Drawer, Typography, Empty, Button } from 'antd';
import { DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { SAGE_THEMES, SAGE_FONT_SERIF } from './sage-theme';
import './financing-card-stack.css';
import type { FinancingCardData } from './financing-card-storage';
import { removeFinancingCard } from './financing-card-storage';

const { Text, Paragraph } = Typography;

/** 拖拽判定阈值（像素），小于此距离判定为点击 */
const DRAG_THRESHOLD = 5;

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
 */
function getCardTransform(index: number, total: number): string {
  if (total <= 1) return 'translateX(0) rotateX(8deg)';
  const stepX = 38;
  const translateX = index * stepX;
  const arc = Math.sin((index / (total - 1)) * Math.PI) * 12;
  const translateY = -arc;
  const translateZ = -index * 6;
  const angleY = -8 + (index / (total - 1)) * 53;
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

interface FinancingCardStackProps {
  cards: FinancingCardData[];
  onCardsChange?: () => void;
}

const FinancingCardStack: React.FC<FinancingCardStackProps> = ({ cards, onCardsChange }) => {
  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme = SAGE_THEMES.finance;
  const textColor = isDark ? theme.textDark : theme.textLight;

  // === 视觉状态（触发重渲染） ===
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<FinancingCardData | null>(null);

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

    const distance = Math.sqrt(ds.offsetX ** 2 + ds.offsetY ** 2);
    if (!ds.hasMoved && distance > DRAG_THRESHOLD) {
      ds.hasMoved = true;
      setIsDragging(true);
      setActiveIndex(ds.startIndex);
    }

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
    wasDragRef.current = ds.hasMoved;

    if (ds.startIndex !== null) {
      if (!ds.hasMoved) {
        // 点击：未越过阈值
        const card = cards[ds.startIndex];
        if (card) {
          setSelectedCard(card);
        }
      } else {
        // 拖拽结束：清除内联样式，CSS transition 自动回弹
        const cardEl = cardRefs.current[ds.startIndex];
        if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
          cardEl.style.zIndex = '';
        }
      }
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

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

  // 保持 ref 与最新回调同步
  useEffect(() => {
    mouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

  // === 鼠标按下：记录起点，绑定 document 事件 ===
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (e.button !== 0) return;
      e.preventDefault();

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
      removeFinancingCard(cardId);
      onCardsChange?.();
    },
    [onCardsChange]
  );

  // === 导出融资阶段为文本 ===
  const handleExport = useCallback((card: FinancingCardData) => {
    const lines = [
      `第${card.year}年 · ${card.roundName}`,
      `项目：${card.projectName}`,
      `目标融资金额：${card.targetAmount}万元`,
      `出让股权：${card.equityOffered}%`,
      `预期估值：${card.valuation}万元`,
      `时间：${card.timeline}`,
      '',
      '里程碑：',
      ...card.milestones.map((m, i) => `${i + 1}. ${m}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.roundName}_第${card.year}年.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // === 空状态 ===
  if (cards.length === 0) {
    return (
      <Empty
        description="暂无融资阶段卡片，生成融资规划后点击「添加融资阶段到卡片堆」"
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <>
      {/* 3D 卡片堆舞台 */}
      <div className={`fin-card-stage ${isDark ? '' : 'light-mode'}`}>
        <div className={`fin-card-layer ${isDragging ? 'is-dragging' : ''}`}>
          {cards.map((card, index) => {
            const total = cards.length;
            const baseTransform = getCardTransform(index, total);
            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`fin-card ${
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
                {/* 年份徽章 */}
                <div className="fin-card-badge">Y{card.year}</div>

                {/* 卡片内容 */}
                <div className="fin-card-content">
                  {/* 轮次名称 */}
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: textColor,
                      fontFamily: SAGE_FONT_SERIF,
                      lineHeight: 1.4,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 28,
                    }}
                  >
                    {card.roundName}
                  </div>

                  {/* 核心数据：大号融资金额（居中） */}
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
                        color: '#0D9488',
                        fontFamily: SAGE_FONT_SERIF,
                        lineHeight: 1,
                        textShadow: '0 0 16px rgba(13, 148, 136, 0.3)',
                      }}
                    >
                      {card.targetAmount}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: textColor,
                        opacity: 0.5,
                        fontFamily: SAGE_FONT_SERIF,
                        letterSpacing: 1,
                      }}
                    >
                      万元 · 目标融资
                    </span>
                  </div>

                  {/* 缩略纹理（灰色横线模拟文本行） */}
                  <div className="fin-card-texture">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="fin-card-texture-line"
                        style={{
                          width: `${80 - i * 10}%`,
                          opacity: 0.4 + (i % 2) * 0.15,
                        }}
                      />
                    ))}
                  </div>

                  {/* 底部信息栏 */}
                  <div className="fin-card-footer">
                    <span
                      style={{
                        fontSize: 9.5,
                        color: theme.accentColor,
                        fontFamily: SAGE_FONT_SERIF,
                        fontWeight: 700,
                      }}
                    >
                      出让{card.equityOffered}%
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: textColor,
                        opacity: 0.4,
                        fontFamily: SAGE_FONT_SERIF,
                      }}
                    >
                      {card.timeline || `第${card.year}年`}
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
            fontFamily: SAGE_FONT_SERIF,
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
          {cards.map((card, index) => (
            <div
              key={card.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${isDark ? theme.borderDark : theme.borderLight}`,
                background: isDark ? theme.surfaceDark : '#fff',
                fontSize: 11,
                fontFamily: SAGE_FONT_SERIF,
              }}
            >
              <span
                style={{
                  color: theme.accentColor,
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
                {card.roundName}
              </span>
              <Tag
                color="teal"
                style={{ fontSize: 9, margin: 0, lineHeight: '16px' }}
              >
                Y{card.year}
              </Tag>
              <button
                onClick={() => handleExport(card)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: theme.accentColor,
                  fontSize: 12,
                  padding: 0,
                }}
                title="导出"
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
          ))}
        </div>
      )}

      {/* 详情面板 Drawer */}
      <Drawer
        title={
          selectedCard ? (
            <span style={{ fontFamily: SAGE_FONT_SERIF }}>
              {selectedCard.roundName} · 第{selectedCard.year}年
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
            borderBottom: `1px solid ${isDark ? theme.borderDark : theme.borderLight}`,
          },
        }}
        extra={
          selectedCard && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleExport(selectedCard)}
              style={{ color: theme.accentColor }}
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
                flexWrap: 'wrap',
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${isDark ? theme.borderDark : theme.borderLight}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  融资金额
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.accentColor,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  {selectedCard.targetAmount}万
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  出让股权
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.accentColor,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  {selectedCard.equityOffered}%
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  预期估值
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.accentColor,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  {selectedCard.valuation}万
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: textColor,
                    opacity: 0.55,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  时间
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: textColor,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  {selectedCard.timeline || '—'}
                </div>
              </div>
            </div>

            {/* 里程碑列表 */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: SAGE_FONT_SERIF,
                  marginBottom: 10,
                }}
              >
                融资里程碑
              </div>
              {selectedCard.milestones.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCard.milestones.map((ms, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${isDark ? theme.borderDark : theme.borderLight}`,
                        borderLeft: `3px solid ${theme.accentColor}`,
                        background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: `${theme.accentColor}15`,
                          color: theme.accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <Paragraph
                        style={{
                          fontSize: 12.5,
                          color: textColor,
                          fontFamily: SAGE_FONT_SERIF,
                          lineHeight: 1.8,
                          margin: 0,
                        }}
                      >
                        {ms}
                      </Paragraph>
                    </div>
                  ))}
                </div>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: textColor,
                    opacity: 0.5,
                    fontFamily: SAGE_FONT_SERIF,
                  }}
                >
                  暂无里程碑数据
                </Text>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default FinancingCardStack;
