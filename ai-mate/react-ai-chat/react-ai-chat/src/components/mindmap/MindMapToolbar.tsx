/**
 * 幕布风格大纲思维导图 - 顶部工具栏
 *
 * 提供布局模式切换（大纲 / 思维导图 / 分栏）、全部展开/折叠、
 * 任务清单（复选框）模式切换、节点搜索、导出与新建等操作。
 *
 * 注意：verbatimModuleSyntax 下类型导入用 `import type`；
 *       erasableSyntaxOnly 下不使用 enum，布局模式用联合类型字面量。
 */
import { Button, Input, Segmented, Space, Tooltip } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import {
  AlignLeftOutlined,
  ApartmentOutlined,
  ColumnHeightOutlined,
  ExpandOutlined,
  CompressOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMindMapStore } from './useMindMapStore';
import type { LayoutMode } from './types';
import { SAGE_FONT_SERIF } from '../sage/sage-theme';
import type { SageTheme } from '../sage/sage-theme';
import { getSurfaceColor, getBorderColor, getTextColor } from './mindmap-theme';

/** 组件 Props */
export interface MindMapToolbarProps {
  /** 是否暗色主题 */
  isDark: boolean;
  /** 军师主题配置 */
  theme: SageTheme;
  /** 导出回调（不传则隐藏导出按钮） */
  onExport?: () => void;
}

/** 布局模式 Segmented 选项（固定配置，模块级缓存） */
const LAYOUT_OPTIONS: { label: string; value: LayoutMode; icon: ReactNode }[] = [
  { label: '大纲', value: 'outline', icon: <AlignLeftOutlined /> },
  { label: '思维导图', value: 'mindmap', icon: <ApartmentOutlined /> },
  { label: '分栏', value: 'split', icon: <ColumnHeightOutlined /> },
];

const MindMapToolbar = ({ isDark, theme, onExport }: MindMapToolbarProps) => {
  // ── Store 订阅（按字段拆分以减少不必要的重渲染） ──
  const layoutMode = useMindMapStore((s) => s.layoutMode);
  const showCheckbox = useMindMapStore((s) => s.showCheckbox);
  const searchQuery = useMindMapStore((s) => s.searchQuery);
  const setLayoutMode = useMindMapStore((s) => s.setLayoutMode);
  const setShowCheckbox = useMindMapStore((s) => s.setShowCheckbox);
  const setSearchQuery = useMindMapStore((s) => s.setSearchQuery);
  const expandAllNodes = useMindMapStore((s) => s.expandAllNodes);
  const collapseAllNodes = useMindMapStore((s) => s.collapseAllNodes);
  const newMap = useMindMapStore((s) => s.newMap);

  // ── 容器样式 ──
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: getSurfaceColor(isDark, theme),
    border: `1px solid ${getBorderColor(isDark, theme)}`,
    borderRadius: 8,
    fontFamily: SAGE_FONT_SERIF,
    color: getTextColor(isDark, theme),
  };

  return (
    <div style={containerStyle} className="mm-toolbar">
      {/* 布局模式切换：大纲 / 思维导图 / 分栏 */}
      <Segmented
        size="small"
        value={layoutMode}
        onChange={(value) => setLayoutMode(value as LayoutMode)}
        options={LAYOUT_OPTIONS}
      />

      {/* 展开折叠操作组 */}
      <Space size={4}>
        <Tooltip title="全部展开">
          <Button size="small" icon={<ExpandOutlined />} onClick={expandAllNodes} />
        </Tooltip>
        <Tooltip title="全部折叠">
          <Button size="small" icon={<CompressOutlined />} onClick={collapseAllNodes} />
        </Tooltip>
      </Space>

      {/* 任务清单（复选框）模式切换 */}
      <Tooltip title={showCheckbox ? '关闭任务清单模式' : '开启任务清单模式'}>
        <Button
          size="small"
          type={showCheckbox ? 'primary' : 'default'}
          icon={<CheckSquareOutlined />}
          onClick={() => setShowCheckbox(!showCheckbox)}
        >
          任务
        </Button>
      </Tooltip>

      {/* 搜索框：实时过滤并高亮节点（与各视图共享同一 searchQuery） */}
      <Input.Search
        allowClear
        size="small"
        placeholder="搜索节点..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ flex: '1 1 220px', minWidth: 160, maxWidth: 320 }}
      />

      {/* 右侧操作组：导出 + 新建 */}
      <Space size={4} style={{ marginLeft: 'auto' }}>
        {onExport ? (
          <Tooltip title="导出">
            <Button size="small" icon={<DownloadOutlined />} onClick={onExport} />
          </Tooltip>
        ) : null}
        <Tooltip title="新建思维导图">
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => newMap()}
          >
            新建
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default MindMapToolbar;
