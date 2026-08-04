/**
 * 幕布风格大纲思维导图 - 单个节点行组件
 * 支持展开折叠、双击编辑、增删同级/子级、复选框、颜色标记、标签、
 * 选中高亮、搜索关键词高亮、拖拽排序（before/after/inside 三态落点）
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties, DragEvent, MouseEvent, ReactNode } from 'react';
import { Badge, Checkbox, Input, Tag, Tooltip } from 'antd';
import type { InputRef, CheckboxChangeEvent } from 'antd';
import {
  RightOutlined,
  DownOutlined,
  EnterOutlined,
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import type { MindMapNode, DropPosition } from './types';
import { useMindMapStore } from './useMindMapStore';
import { SAGE_FONT_SERIF } from '../sage/sage-theme';
import type { SageTheme } from '../sage/sage-theme';
import { getNodeColor, getNodeBg, getTextColor } from './mindmap-theme';

/** 组件 Props */
export interface MindMapNodeViewProps {
  /** 当前节点 */
  node: MindMapNode;
  /** 节点深度（根为 0），用于缩进与配色 */
  depth: number;
  /** 是否暗色主题 */
  isDark: boolean;
  /** 军师主题配置 */
  theme: SageTheme;
  /** 是否为根节点（根节点不显示"添加同级/删除"） */
  isRoot?: boolean;
  /** 搜索关键词（用于文本高亮） */
  searchQuery?: string;
}

/**
 * 根据鼠标在目标元素中的相对纵坐标计算落点位置：
 * 上 1/3 -> before，下 1/3 -> after，中间 -> inside
 */
function calcDropPosition(e: DragEvent<HTMLDivElement>): DropPosition {
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const h = rect.height;
  if (h <= 0) return 'inside';
  if (y < h / 3) return 'before';
  if (y > (h * 2) / 3) return 'after';
  return 'inside';
}

/**
 * 将文本按搜索关键词切分，匹配片段用 <mark> 高亮。
 * 大小写不敏感；空关键词直接返回原文本。
 */
function highlightText(text: string, query: string | undefined, isDark: boolean): ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  // 暗色用琥珀色高亮，亮色用明黄高亮，保证可读性
  const markStyle: CSSProperties = isDark
    ? { background: 'rgba(245, 158, 11, 0.45)', color: '#1C1917', padding: '0 2px', borderRadius: 2 }
    : { background: '#FFE58F', color: '#1C1917', padding: '0 2px', borderRadius: 2 };
  while (i <= text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      if (i < text.length) parts.push(<span key={key++}>{text.slice(i)}</span>);
      break;
    }
    if (idx > i) parts.push(<span key={key++}>{text.slice(i, idx)}</span>);
    parts.push(
      <mark key={key++} style={markStyle}>
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

const MindMapNodeView = ({
  node,
  depth,
  isDark,
  theme,
  isRoot = false,
  searchQuery,
}: MindMapNodeViewProps) => {
  // ── 局部状态 ──
  /** 是否处于文本编辑模式 */
  const [editing, setEditing] = useState(false);
  /** 编辑中的临时文本 */
  const [editText, setEditText] = useState(node.text);
  /** 当前拖拽悬停落点（用于视觉反馈） */
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);
  /** 编辑框引用（用于自动聚焦） */
  const inputRef = useRef<InputRef>(null);

  // ── Store 订阅（按字段拆分以减少不必要的重渲染） ──
  const showCheckbox = useMindMapStore((s) => s.showCheckbox);
  const isSelected = useMindMapStore((s) => s.selectedId === node.id);
  const setText = useMindMapStore((s) => s.setText);
  const addChildNode = useMindMapStore((s) => s.addChildNode);
  const addSiblingNode = useMindMapStore((s) => s.addSiblingNode);
  const removeNodeById = useMindMapStore((s) => s.removeNodeById);
  const toggleNodeExpand = useMindMapStore((s) => s.toggleNodeExpand);
  const updateMeta = useMindMapStore((s) => s.updateMeta);
  const moveNodeById = useMindMapStore((s) => s.moveNodeById);
  const setSelectedId = useMindMapStore((s) => s.setSelectedId);

  // ── 衍生值 ──
  const hasChildren = node.children.length > 0;
  const childCount = node.children.length;
  const accent = getNodeColor(depth, theme);
  const textColor = getTextColor(isDark, theme);

  // ── 进入编辑模式时聚焦并选中文本 ──
  useEffect(() => {
    if (editing) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editing]);

  // ── 事件处理 ──
  /** 进入编辑模式 */
  const startEditing = useCallback(() => {
    setEditText(node.text);
    setEditing(true);
  }, [node.text]);

  /** 保存编辑内容 */
  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== node.text) {
      setText(node.id, trimmed);
    }
    setEditing(false);
  }, [editText, node.id, node.text, setText]);

  /** 取消编辑（Esc） */
  const cancelEdit = useCallback(() => {
    setEditText(node.text);
    setEditing(false);
  }, [node.text]);

  /** 点击节点行 -> 选中 */
  const handleSelect = useCallback(() => {
    if (!isSelected) setSelectedId(node.id);
  }, [isSelected, node.id, setSelectedId]);

  /** 切换展开/折叠 */
  const handleToggle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      toggleNodeExpand(node.id);
    },
    [node.id, toggleNodeExpand]
  );

  /** 添加同级节点 */
  const handleAddSibling = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      addSiblingNode(node.id);
    },
    [addSiblingNode, node.id]
  );

  /** 添加子节点 */
  const handleAddChild = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      addChildNode(node.id);
    },
    [addChildNode, node.id]
  );

  /** 删除节点 */
  const handleRemove = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      removeNodeById(node.id);
    },
    [node.id, removeNodeById]
  );

  /** 复选框切换 */
  const handleCheck = useCallback(
    (e: CheckboxChangeEvent) => {
      e.stopPropagation();
      updateMeta(node.id, { checked: e.target.checked });
    },
    [node.id, updateMeta]
  );

  // ── 拖拽源 ──
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      // 将被拖拽节点 id 写入 dataTransfer，供 drop 目标读取
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'move';
    },
    [node.id]
  );

  // ── 拖拽目标 ──
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      // 不允许拖到自身
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId === node.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropPos(calcDropPosition(e));
    },
    [node.id]
  );

  const handleDragLeave = useCallback(() => {
    setDropPos(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceId = e.dataTransfer.getData('text/plain');
      const pos = calcDropPosition(e);
      setDropPos(null);
      // 忽略无效拖拽（空来源 / 拖到自身 / 拖到根节点的 before|after）
      if (!sourceId || sourceId === node.id) return;
      if (isRoot && pos !== 'inside') return;
      moveNodeById(sourceId, node.id, pos);
    },
    [isRoot, moveNodeById, node.id]
  );

  // ── 拖拽落点视觉反馈样式 ──
  let dropIndicatorStyle: CSSProperties = {};
  if (dropPos === 'before') {
    dropIndicatorStyle = { boxShadow: `inset 0 2px 0 0 ${accent}` };
  } else if (dropPos === 'after') {
    dropIndicatorStyle = { boxShadow: `inset 0 -2px 0 0 ${accent}` };
  } else if (dropPos === 'inside') {
    dropIndicatorStyle = { boxShadow: `inset 0 0 0 2px ${accent}`, background: getNodeBg(depth, theme) };
  }

  // ── 行样式 ──
  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: depth * 24,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 4,
    fontFamily: SAGE_FONT_SERIF,
    fontSize: Math.max(13, 16 - depth),
    fontWeight: isRoot ? 700 : 400,
    color: textColor,
    background: isSelected ? getNodeBg(depth, theme) : 'transparent',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
    cursor: editing ? 'text' : 'default',
    transition: 'background 0.15s ease',
    userSelect: 'none',
    ...dropIndicatorStyle,
  };

  return (
    <div
      style={rowStyle}
      onClick={handleSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽手柄（拖动以移动节点） */}
      <span
        draggable
        onDragStart={handleDragStart}
        onClick={(e) => e.stopPropagation()}
        title="拖拽以移动节点"
        style={{ cursor: 'grab', color: isDark ? theme.borderDark : theme.borderLight, lineHeight: 1 }}
      >
        <HolderOutlined />
      </span>

      {/* 展开/折叠箭头：仅当存在子节点时显示，占据固定宽度保持对齐 */}
      <span style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {hasChildren ? (
          <span
            onClick={handleToggle}
            style={{ cursor: 'pointer', color: accent, display: 'inline-flex' }}
            title={node.expanded ? '折叠' : '展开'}
          >
            {node.expanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        ) : null}
      </span>

      {/* 子节点数量徽章：有子节点时显示 */}
      {hasChildren && (
        <Badge count={childCount} size="small" style={{ backgroundColor: accent, boxShadow: 'none' }} />
      )}

      {/* 复选框模式：开启时显示 */}
      {showCheckbox && (
        <Checkbox
          checked={!!node.checked}
          onChange={handleCheck}
          onClick={(e) => e.stopPropagation()}
          style={{ flexShrink: 0 }}
        />
      )}

      {/* 颜色标记圆点：node.color 存在时显示 */}
      {node.color && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: node.color,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${isDark ? theme.surfaceDark : theme.surfaceLight}`,
          }}
          title={node.color}
        />
      )}

      {/* 文本显示 / 编辑模式 */}
      {editing ? (
        <Input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onPressEnter={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit();
          }}
          onBlur={commitEdit}
          onClick={(e) => e.stopPropagation()}
          size="small"
          style={{ flex: 1, fontFamily: SAGE_FONT_SERIF, maxWidth: 420 }}
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing();
          }}
          style={{ flex: 1, cursor: 'pointer', minWidth: 0, wordBreak: 'break-word' }}
          title="双击编辑"
        >
          {highlightText(node.text, searchQuery, isDark)}
        </span>
      )}

      {/* 标签展示：存在 tags 时逐个渲染 */}
      {node.tags && node.tags.length > 0 && (
        <span style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap' }}>
          {node.tags.map((tag) => (
            <Tag key={tag} color={accent} style={{ margin: 0, fontSize: 11 }}>
              {tag}
            </Tag>
          ))}
        </span>
      )}

      {/* 操作按钮组：选中时高亮，根节点隐藏"添加同级/删除" */}
      <span
        style={{
          display: 'flex',
          gap: 4,
          flexShrink: 0,
          opacity: isSelected ? 1 : 0.45,
          transition: 'opacity 0.15s ease',
        }}
      >
        {!isRoot && (
          <Tooltip title="添加同级">
            <EnterOutlined onClick={handleAddSibling} style={{ color: accent, cursor: 'pointer', padding: 2 }} />
          </Tooltip>
        )}
        <Tooltip title="添加子级">
          <PlusOutlined onClick={handleAddChild} style={{ color: accent, cursor: 'pointer', padding: 2 }} />
        </Tooltip>
        {!isRoot && (
          <Tooltip title="删除">
            <DeleteOutlined onClick={handleRemove} style={{ color: theme.sealColor, cursor: 'pointer', padding: 2 }} />
          </Tooltip>
        )}
      </span>
    </div>
  );
};

export default MindMapNodeView;
