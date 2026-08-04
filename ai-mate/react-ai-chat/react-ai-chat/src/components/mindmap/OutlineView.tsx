/**
 * 幕布风格大纲思维导图 - 大纲视图容器
 * 从 useMindMapStore 读取数据，递归渲染 MindMapNodeView；
 * data 为 null 时显示空状态；折叠节点不渲染子节点。
 */
import { useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Empty, Input } from 'antd';
import type { MindMapNode } from './types';
import { useMindMapStore } from './useMindMapStore';
import { SAGE_FONT_SERIF } from '../sage/sage-theme';
import type { SageTheme } from '../sage/sage-theme';
import { getSurfaceColor, getBorderColor } from './mindmap-theme';
import MindMapNodeView from './MindMapNodeView';

/** 组件 Props */
export interface OutlineViewProps {
  /** 是否暗色主题 */
  isDark: boolean;
  /** 军师主题配置 */
  theme: SageTheme;
}

/**
 * 递归渲染一棵子树。
 * @param node    当前节点
 * @param depth   当前深度
 * @param isDark  是否暗色
 * @param theme   主题
 * @param searchQuery 搜索关键词（透传给节点用于高亮）
 * @param searchMatchedIds 命中搜索的节点 id 集合（用于决定是否强制渲染子树）
 */
function renderTree(
  node: MindMapNode,
  depth: number,
  isDark: boolean,
  theme: SageTheme,
  searchQuery: string,
  searchMatchedIds: Set<string>,
): ReactNode {
  // 当前节点是否命中搜索（或其后代命中）-- 命中时需要展开渲染以保持可见
  const selfMatched = searchMatchedIds.has(node.id);
  // 折叠状态下，若自身或后代命中搜索则仍渲染子节点
  const shouldRenderChildren = node.expanded || selfMatched;

  return (
    <div key={node.id}>
      <MindMapNodeView
        node={node}
        depth={depth}
        isDark={isDark}
        theme={theme}
        isRoot={depth === 0}
        searchQuery={searchQuery}
      />
      {shouldRenderChildren && node.children.length > 0
        ? node.children.map((child) =>
            renderTree(child, depth + 1, isDark, theme, searchQuery, searchMatchedIds),
          )
        : null}
    </div>
  );
}

/**
 * 收集所有包含搜索关键词的节点 id（含自身），用于折叠态强制渲染。
 */
function collectMatchedIds(root: MindMapNode, query: string): Set<string> {
  const ids = new Set<string>();
  if (!query || !query.trim()) return ids;
  const ql = query.trim().toLowerCase();
  const walk = (n: MindMapNode) => {
    if (n.text.toLowerCase().includes(ql)) ids.add(n.id);
    n.children.forEach(walk);
  };
  walk(root);
  return ids;
}

const OutlineView = ({ isDark, theme }: OutlineViewProps) => {
  // ── Store 订阅 ──
  const data = useMindMapStore((s) => s.data);
  const searchQuery = useMindMapStore((s) => s.searchQuery);
  const setSearchQuery = useMindMapStore((s) => s.setSearchQuery);

  // ── 命中搜索的节点 id 集合（仅在有搜索词时计算） ──
  const searchMatchedIds = useMemo(
    () => (data ? collectMatchedIds(data.root, searchQuery) : new Set<string>()),
    [data, searchQuery],
  );

  // ── 容器样式 ──
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: 12,
    background: getSurfaceColor(isDark, theme),
    border: `1px solid ${getBorderColor(isDark, theme)}`,
    borderRadius: 8,
    minHeight: 200,
    maxHeight: '100%',
    overflow: 'auto',
    fontFamily: SAGE_FONT_SERIF,
  };

  // ── 空状态 ──
  if (!data) {
    return (
      <div style={containerStyle}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无思维导图数据"
          style={{ margin: 'auto' }}
        />
      </div>
    );
  }

  // ── 搜索框 ──
  const searchInputStyle: CSSProperties = {
    marginBottom: 8,
    maxWidth: 320,
  };

  return (
    <div style={containerStyle}>
      {/* 顶部搜索框：实时过滤并高亮 */}
      <Input.Search
        allowClear
        placeholder="搜索节点文本…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={searchInputStyle}
      />

      {/* 递归渲染节点树 */}
      {renderTree(data.root, 0, isDark, theme, searchQuery, searchMatchedIds)}
    </div>
  );
};

export default OutlineView;
