/**
 * 商业模式 9 宫格可编辑画布（纯 CSS Grid，无新依赖）
 * 单元格每行为 dimensions 树根节点的子节点，与幕布树单一数据源
 */
import React, { useState } from 'react';
import { Input, Tooltip } from 'antd';
import { CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { BMC_DIMENSIONS, BMC_GRID_ORDER, type TreeNode } from './bmc-utils';

const { TextArea } = Input;

interface BMCCanvasProps {
  dimensions: Record<string, TreeNode>;
  isDark: boolean;
  theme: SageTheme;
  activeDimension: string;
  onSelectDimension: (dimKey: string) => void;
  onUpdateText: (dimKey: string, nodeId: string, text: string) => void;
  onAddBullet: (dimKey: string) => void;
  onRemoveBullet: (dimKey: string, nodeId: string) => void;
}

const BMCCanvas: React.FC<BMCCanvasProps> = ({
  dimensions, isDark, theme, activeDimension,
  onSelectDimension, onUpdateText, onAddBullet, onRemoveBullet,
}) => {
  const [editing, setEditing] = useState<{ dimKey: string; nodeId: string; text: string } | null>(null);

  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        background: isDark ? 'rgba(0,0,0,0.25)' : '#FAF6EF',
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        padding: 8,
      }}
    >
      {BMC_GRID_ORDER.map((dimKey) => {
        const dim = BMC_DIMENSIONS.find((d) => d.key === dimKey)!;
        const root = dimensions[dimKey];
        const isValue = dimKey === 'valuePropositions';
        const active = activeDimension === dimKey;
        return (
          <div
            key={dimKey}
            onClick={() => onSelectDimension(dimKey)}
            style={{
              borderRadius: 8,
              border: `1.5px solid ${active ? dim.color : borderColor}`,
              background: active ? `${dim.color}10` : (isDark ? theme.surfaceDark : '#fff'),
              padding: 10,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              transform: active ? 'scale(1.01)' : 'scale(1)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: isValue ? 168 : 120,
            }}
          >
            {/* 单元格头部 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{dim.icon}</span>
              <span
                style={{
                  flex: 1, fontFamily: SAGE_FONT_SERIF, fontSize: 12, fontWeight: 700,
                  color: dim.color, letterSpacing: 1,
                }}
              >
                {dim.label}
              </span>
              <Tooltip title="添加要点">
                <span
                  onClick={(e) => { e.stopPropagation(); onAddBullet(dimKey); }}
                  style={{ cursor: 'pointer', color: dim.color, fontSize: 11 }}
                >
                  <PlusOutlined />
                </span>
              </Tooltip>
            </div>

            {/* 要点行（根节点一级子节点） */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflow: 'auto' }}>
              {(root?.children || []).map((child) => {
                const isEditing = editing?.nodeId === child.id;
                return (
                  <div
                    key={child.id}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 4px', borderRadius: 4,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    }}
                  >
                    <span style={{ color: dim.color, fontSize: 9, flexShrink: 0 }}>▪</span>
                    {isEditing ? (
                      <>
                        <TextArea
                          size="small"
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          value={editing.text}
                          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                          onBlur={() => {
                            onUpdateText(dimKey, child.id, editing.text);
                            setEditing(null);
                          }}
                          onPressEnter={() => {
                            onUpdateText(dimKey, child.id, editing.text);
                            setEditing(null);
                          }}
                          style={{
                            flex: 1, background: isDark ? theme.surfaceDark : '#fff',
                            borderColor, color: textColor, fontSize: 11.5,
                            fontFamily: SAGE_FONT_SERIF, borderRadius: 4, padding: '1px 4px',
                          }}
                        />
                        <CheckOutlined style={{ fontSize: 10, color: dim.color, flexShrink: 0 }} />
                      </>
                    ) : (
                      <>
                        <span
                          onDoubleClick={() => setEditing({ dimKey, nodeId: child.id, text: child.text })}
                          style={{
                            flex: 1, fontSize: 11.5, color: textColor, fontFamily: SAGE_FONT_SERIF,
                            lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                            cursor: 'text',
                          }}
                        >
                          {child.text}
                        </span>
                        <Tooltip title="删除">
                          <DeleteOutlined
                            onClick={() => onRemoveBullet(dimKey, child.id)}
                            style={{ fontSize: 10, color: '#999', flexShrink: 0, cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </>
                    )}
                  </div>
                );
              })}
              {(root?.children?.length || 0) === 0 && (
                <span style={{ fontSize: 10.5, color: textColor, opacity: 0.35, fontFamily: SAGE_FONT_SERIF }}>
                  点击 + 添加要点
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BMCCanvas;
