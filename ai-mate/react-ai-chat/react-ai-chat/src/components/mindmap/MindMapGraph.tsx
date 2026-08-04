/**
 * 幕布风格大纲思维导图 - SVG 图谱视图
 *
 * 水平树布局渲染、贝塞尔连线、节点交互（单击选中 / 双击编辑 / 折叠徽章）、
 * 滚轮缩放与拖拽平移（基于 viewBox 变换）、搜索命中高亮闪烁、颜色标记条。
 *
 * 注意：verbatimModuleSyntax 下类型导入用 `import type`；
 *       erasableSyntaxOnly 下不使用 enum，状态用联合类型字面量。
 */
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Empty, Input } from 'antd';
import type { InputRef } from 'antd';
import type { MindMapNode, LayoutNode } from './types';
import { useMindMapStore } from './useMindMapStore';
import { SAGE_FONT_SERIF } from '../sage/sage-theme';
import type { SageTheme } from '../sage/sage-theme';
import { computeLayout, getLayoutSize, getBezierPath } from './layout';
import { getNodeColor, getNodeBg, getLinkColor, getTextColor } from './mindmap-theme';

/** 组件 Props */
export interface MindMapGraphProps {
  /** 是否暗色主题 */
  isDark: boolean;
  /** 军师主题配置 */
  theme: SageTheme;
}

/** viewBox 视口状态（平移与缩放均通过修改它实现） */
interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 拖拽平移时的起点记录 */
interface DragStart {
  /** 鼠标按下时的屏幕坐标 */
  clientX: number;
  clientY: number;
  /** 鼠标按下时的 viewBox 左上角坐标 */
  vbX: number;
  vbY: number;
}

/** SVG 节点圆角半径 */
const NODE_RADIUS = 6;
/** 折叠徽章半径 */
const BADGE_RADIUS = 10;
/** 颜色标记条宽度 */
const COLOR_BAR_WIDTH = 4;
/** 节点内文本左右内边距 */
const TEXT_PADDING = 12;
/** 拖拽平移触发阈值（像素），小于此距离视为点击 */
const DRAG_THRESHOLD = 4;

/**
 * 按节点宽度估算可容纳的文本，超长则截断并追加省略号。
 * 中文按全角字符宽度近似估算（约为字号的 1 倍）。
 */
function truncateText(text: string, maxWidth: number, fontSize: number): string {
  // 单字符宽度近似为字号（适配中文），减去左右内边距
  const available = maxWidth - TEXT_PADDING * 2;
  if (available <= 0) return '';
  const maxChars = Math.floor(available / fontSize);
  if (text.length <= maxChars) return text;
  // 至少保留 1 个字符 + 省略号
  const keep = Math.max(1, maxChars - 1);
  return `${text.slice(0, keep)}…`;
}

/** 收集所有包含搜索关键词的节点 id（大小写不敏感） */
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

/** 构建 id -> 原始节点的映射，便于按 id 读取 expanded/color/children 等 */
function buildNodeMap(root: MindMapNode): Map<string, MindMapNode> {
  const map = new Map<string, MindMapNode>();
  const walk = (n: MindMapNode) => {
    map.set(n.id, n);
    n.children.forEach(walk);
  };
  walk(root);
  return map;
}

const MindMapGraph = ({ isDark, theme }: MindMapGraphProps) => {
  // ── Store 订阅（按字段拆分以减少不必要的重渲染） ──
  const data = useMindMapStore((s) => s.data);
  const selectedId = useMindMapStore((s) => s.selectedId);
  const searchQuery = useMindMapStore((s) => s.searchQuery);
  const setSelectedId = useMindMapStore((s) => s.setSelectedId);
  const setText = useMindMapStore((s) => s.setText);
  const toggleNodeExpand = useMindMapStore((s) => s.toggleNodeExpand);

  // ── DOM 引用 ──
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<InputRef>(null);

  // ── 编辑模式状态 ──
  /** 正在编辑的节点 id（null 表示非编辑态） */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** 编辑中的临时文本 */
  const [editText, setEditText] = useState('');

  // ── 布局计算（data 变化时重算） ──
  const layoutNodes = useMemo(
    () => (data ? computeLayout(data.root) : []),
    [data],
  );
  const size = useMemo(() => getLayoutSize(layoutNodes), [layoutNodes]);
  /** id -> LayoutNode 映射，用于查找父节点坐标 */
  const layoutById = useMemo(() => {
    const m = new Map<string, LayoutNode>();
    layoutNodes.forEach((ln) => m.set(ln.id, ln));
    return m;
  }, [layoutNodes]);
  /** id -> 原始节点映射，用于读取 expanded/color/children */
  const nodeMap = useMemo(
    () => (data ? buildNodeMap(data.root) : new Map<string, MindMapNode>()),
    [data],
  );

  // ── 搜索命中集合 ──
  const searchMatchedIds = useMemo(
    () => (data ? collectMatchedIds(data.root, searchQuery) : new Set<string>()),
    [data, searchQuery],
  );

  // ── viewBox 视口状态（平移缩放的核心） ──
  const [viewBox, setViewBox] = useState<ViewBox>(() => ({
    x: 0,
    y: 0,
    w: size.width,
    h: size.height,
  }));

  // 切换文档（projectName 变化）时重置视口以适应内容
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewBox({ x: 0, y: 0, w: size.width, h: size.height });
  }, [data?.projectName, size.width, size.height]);

  // ── 拖拽平移状态 ──
  const [dragging, setDragging] = useState(false);
  /** 本次按下是否发生过移动（用于区分点击与拖拽） */
  const movedRef = useRef(false);
  const dragStart = useRef<DragStart>({ clientX: 0, clientY: 0, vbX: 0, vbY: 0 });

  // ── 编辑模式：自动聚焦并选中文本 ──
  useEffect(() => {
    if (editingId) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editingId]);

  // ── 滚轮缩放：注册原生非被动监听以阻止页面滚动 ──
  // React 的 onWheel 是被动监听，无法 preventDefault，故改用原生 addEventListener。
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: globalThis.WheelEvent) => {
      // 编辑模式下禁用缩放，避免输入框被意外缩放
      if (editingId) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // 鼠标在 svg 元素中的归一化位置（0~1）
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      // deltaY>0 向下滚 -> 放大内容（缩小视口）；向上滚 -> 缩小内容（放大视口）
      const factor = e.deltaY > 0 ? 1 / 0.9 : 0.9;
      setViewBox((vb) => {
        // 限制缩放范围：不小于 50x50，不大于内容的 4 倍
        const minW = 50;
        const minH = 50;
        const maxW = size.width * 4;
        const maxH = size.height * 4;
        let newW = vb.w * factor;
        let newH = vb.h * factor;
        newW = Math.max(minW, Math.min(newW, maxW));
        newH = Math.max(minH, Math.min(newH, maxH));
        // 保持鼠标指向的内容坐标不变：以鼠标点为缩放中心
        const contentX = vb.x + mx * vb.w;
        const contentY = vb.y + my * vb.h;
        return {
          x: contentX - mx * newW,
          y: contentY - my * newH,
          w: newW,
          h: newH,
        };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [editingId, size.width, size.height]);

  // ── 拖拽平移：在 window 上监听 move/up ──
  useEffect(() => {
    if (!dragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // 屏幕像素 -> viewBox 坐标的换算系数
    const scaleX = viewBox.w / (rect.width || 1);
    const scaleY = viewBox.h / (rect.height || 1);
    const onMove = (e: globalThis.MouseEvent) => {
      const dxScreen = e.clientX - dragStart.current.clientX;
      const dyScreen = e.clientY - dragStart.current.clientY;
      if (!movedRef.current && Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setViewBox((vb) => ({
        ...vb,
        x: dragStart.current.vbX - dxScreen * scaleX,
        y: dragStart.current.vbY - dyScreen * scaleY,
      }));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, viewBox.w, viewBox.h]);

  // ── 事件处理 ──
  /** 鼠标按下空白背景：开始拖拽平移（节点元素会 stopPropagation 阻止进入此处） */
  const handleSvgMouseDown = useCallback(
    (e: ReactMouseEvent<SVGSVGElement>) => {
      movedRef.current = false;
      dragStart.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        vbX: viewBox.x,
        vbY: viewBox.y,
      };
      setDragging(true);
    },
    [viewBox.x, viewBox.y],
  );

  /** 点击空白背景（未发生拖拽）：取消选中 */
  const handleSvgClick = useCallback(() => {
    if (movedRef.current) return;
    if (selectedId) setSelectedId(null);
  }, [selectedId, setSelectedId]);

  /** 进入节点编辑模式 */
  const startEditing = useCallback((node: MindMapNode) => {
    setEditText(node.text);
    setEditingId(node.id);
  }, []);

  /** 提交编辑（回车或失焦） */
  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editText.trim();
    const original = nodeMap.get(editingId);
    if (trimmed && original && trimmed !== original.text) {
      setText(editingId, trimmed);
    }
    setEditingId(null);
  }, [editingId, editText, nodeMap, setText]);

  /** 取消编辑（Esc） */
  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // ── 空状态 ──
  if (!data) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          height: '100%',
          background: isDark ? theme.bgDark : theme.bgLight,
          borderRadius: 8,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无思维导图数据"
        />
      </div>
    );
  }

  // ── 连线路径计算：每个非根节点从父节点右边缘连到子节点左边缘 ──
  const linkPaths = layoutNodes
    .filter((ln) => ln.parentId !== null)
    .map((ln) => {
      const parent = layoutById.get(ln.parentId as string);
      if (!parent) return null;
      const fromX = parent.x + parent.width;
      const fromY = parent.y + parent.height / 2;
      const toX = ln.x;
      const toY = ln.y + ln.height / 2;
      return {
        key: ln.id,
        d: getBezierPath(fromX, fromY, toX, toY),
        // 连线颜色取父节点深度配色
        stroke: getLinkColor(parent.depth, theme),
      };
    })
    .filter((p): p is { key: string; d: string; stroke: string } => p !== null);

  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;
  const textColor = getTextColor(isDark, theme);

  // 鼠标样式：拖拽中为 grabbing，否则为可拖拽的 grab（提示可平移）
  const cursorStyle = dragging ? 'grabbing' : 'grab';

  // 编辑中节点对应的布局信息（用于定位 foreignObject 输入框）
  const editingLayout = editingId ? layoutById.get(editingId) : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: isDark ? theme.bgDark : theme.bgLight,
        borderRadius: 8,
        userSelect: 'none',
      }}
    >
      {/* 搜索命中高亮闪烁动画定义 */}
      <style>{`
        @keyframes mm-search-pulse {
          0%, 100% { stroke-opacity: 1; }
          50% { stroke-opacity: 0.35; }
        }
        .mm-search-hit {
          animation: mm-search-pulse 1s ease-in-out infinite;
        }
      `}</style>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBoxStr}
        onMouseDown={handleSvgMouseDown}
        onClick={handleSvgClick}
        style={{ cursor: cursorStyle, display: 'block' }}
      >
        {/* 选中节点发光滤镜定义 */}
        <defs>
          <filter id="mm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 连线层（先绘制，位于节点之下） */}
        <g>
          {linkPaths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill="none"
              stroke={p.stroke}
              strokeWidth={1.5}
            />
          ))}
        </g>

        {/* 节点层 */}
        <g>
          {layoutNodes.map((ln) => {
            const node = nodeMap.get(ln.id);
            if (!node) return null;

            const isSelected = selectedId === ln.id;
            const isMatched = searchMatchedIds.has(ln.id);
            // 折叠徽章：仅折叠且有子节点时显示
            const showBadge = !node.expanded && node.children.length > 0;
            const badgeCount = node.children.length;

            // 节点填充与边框配色
            const fill = getNodeBg(ln.depth, theme);
            const border = getNodeColor(ln.depth, theme);
            // 文本字号随深度递减（根节点最大）
            const fontSize = Math.max(12, 16 - ln.depth);
            const displayText = truncateText(node.text, ln.width, fontSize);

            // 阻止节点上的 mousedown 冒泡到 svg，避免触发拖拽平移
            const stopNodeMouseDown = (e: ReactMouseEvent<SVGElement>) => {
              e.stopPropagation();
            };

            return (
              <g
                key={ln.id}
                data-node={ln.id}
                onMouseDown={stopNodeMouseDown}
                onClick={(e) => {
                  e.stopPropagation();
                  // 拖拽平移过程中产生的点击忽略
                  if (movedRef.current) return;
                  setSelectedId(ln.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(node);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* 节点矩形：选中时加粗边框 + 发光滤镜；搜索命中时边框闪烁 */}
                <rect
                  x={ln.x}
                  y={ln.y}
                  width={ln.width}
                  height={ln.height}
                  rx={NODE_RADIUS}
                  ry={NODE_RADIUS}
                  fill={fill}
                  stroke={border}
                  strokeWidth={isSelected ? 3 : 1.5}
                  filter={isSelected ? 'url(#mm-glow)' : undefined}
                  className={isMatched ? 'mm-search-hit' : undefined}
                />

                {/* 颜色标记条：node.color 存在时在节点左侧绘制彩色竖条 */}
                {node.color && (
                  <rect
                    x={ln.x}
                    y={ln.y}
                    width={COLOR_BAR_WIDTH}
                    height={ln.height}
                    rx={2}
                    ry={2}
                    fill={node.color}
                  />
                )}

                {/* 节点文本：居中显示，使用衬线字体，颜色取主题文本色 */}
                <text
                  x={ln.x + ln.width / 2}
                  y={ln.y + ln.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize={fontSize}
                  fontFamily={SAGE_FONT_SERIF}
                  fontWeight={ln.depth === 0 ? 700 : 400}
                  pointerEvents="none"
                >
                  {displayText}
                </text>

                {/* 折叠徽章：小圆形 + "+N"，点击切换展开 */}
                {showBadge && (
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeExpand(ln.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={ln.x + ln.width + BADGE_RADIUS - 2}
                      cy={ln.y + ln.height / 2}
                      r={BADGE_RADIUS}
                      fill={border}
                      stroke={isDark ? theme.surfaceDark : theme.surfaceLight}
                      strokeWidth={1.5}
                    />
                    <text
                      x={ln.x + ln.width + BADGE_RADIUS - 2}
                      y={ln.y + ln.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isDark ? theme.textDark : theme.textLight}
                      fontSize={11}
                      fontFamily={SAGE_FONT_SERIF}
                      fontWeight={600}
                      pointerEvents="none"
                    >
                      +{badgeCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 编辑模式：用 foreignObject 内嵌 antd Input，跟随 svg 变换定位 */}
        {editingLayout && (
          <foreignObject
            x={editingLayout.x}
            y={editingLayout.y}
            width={editingLayout.width}
            height={editingLayout.height}
            // 阻止编辑区域的事件冒泡，避免触发选中/平移
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              ref={inputRef}
              value={editText}
              size="small"
              onChange={(e) => setEditText(e.target.value)}
              onPressEnter={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={commitEdit}
              style={{
                width: '100%',
                fontFamily: SAGE_FONT_SERIF,
                // 让输入框贴合节点高度
                height: editingLayout.height - 4,
              }}
            />
          </foreignObject>
        )}
      </svg>
    </div>
  );
};

export default MindMapGraph;
