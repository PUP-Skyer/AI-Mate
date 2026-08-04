/**
 * 幕布风格大纲思维导图 - 顶层编辑器容器
 *
 * 组合工具栏 + 大纲视图 + 思维导图图谱视图，按布局模式切换/分栏渲染；
 * 启用全局键盘快捷键；standalone 模式下无数据时自动新建空白思维导图。
 *
 * 注意：verbatimModuleSyntax 下类型导入用 `import type`；
 *       erasableSyntaxOnly 下不使用 enum，布局模式用联合类型字面量。
 */
import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Row, Col } from 'antd';
import { useMindMapStore } from './useMindMapStore';
import { useKeyboard } from './useKeyboard';
import { SAGE_FONT_SERIF } from '../sage/sage-theme';
import type { SageTheme } from '../sage/sage-theme';
import MindMapToolbar from './MindMapToolbar';
import OutlineView from './OutlineView';
import MindMapGraph from './MindMapGraph';

/** 组件 Props */
export interface MindMapEditorProps {
  /** 是否暗色主题 */
  isDark: boolean;
  /** 军师主题配置 */
  theme: SageTheme;
  /** 独立模式：为 true 且无数据时自动新建空白思维导图 */
  standalone?: boolean;
  /** 导出回调（透传给工具栏） */
  onExport?: () => void;
}

const MindMapEditor = ({ isDark, theme, standalone = false, onExport }: MindMapEditorProps) => {
  // ── Store 订阅 ──
  const layoutMode = useMindMapStore((s) => s.layoutMode);
  const data = useMindMapStore((s) => s.data);
  const newMap = useMindMapStore((s) => s.newMap);

  // ── 全局键盘快捷键（编辑态由子组件 Input 焦点自动豁免） ──
  useKeyboard({});

  // ── standalone 模式：无数据时自动新建空白思维导图 ──
  useEffect(() => {
    if (standalone && !data) {
      newMap();
    }
  }, [standalone, data, newMap]);

  // ── 容器样式 ──
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: 8,
    fontFamily: SAGE_FONT_SERIF,
  };

  const bodyStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  };

  // ── 按布局模式渲染主体内容 ──
  const renderBody = () => {
    // 大纲模式：仅渲染大纲视图
    if (layoutMode === 'outline') {
      return <OutlineView isDark={isDark} theme={theme} />;
    }
    // 思维导图模式：仅渲染图谱视图
    if (layoutMode === 'mindmap') {
      return <MindMapGraph isDark={isDark} theme={theme} />;
    }
    // 分栏模式：左大纲 + 右图谱，xs 堆叠 / lg 左右各半
    return (
      <>
        {/* 分栏高度响应式：lg 两列各占满高，xs/md 上下堆叠各占半高 */}
        <style>{`
          .mm-split-row { height: 100%; }
          .mm-split-col { height: 100%; }
          @media (max-width: 991px) {
            .mm-split-col { height: 50%; min-height: 240px; }
          }
        `}</style>
        <Row gutter={8} className="mm-split-row" style={{ margin: 0 }}>
          <Col xs={24} lg={12} className="mm-split-col">
            <OutlineView isDark={isDark} theme={theme} />
          </Col>
          <Col xs={24} lg={12} className="mm-split-col">
            <MindMapGraph isDark={isDark} theme={theme} />
          </Col>
        </Row>
      </>
    );
  };

  return (
    <div style={containerStyle}>
      {/* 顶部工具栏 */}
      <MindMapToolbar isDark={isDark} theme={theme} onExport={onExport} />

      {/* 主体内容区 */}
      <div style={bodyStyle}>{renderBody()}</div>
    </div>
  );
};

export default MindMapEditor;
