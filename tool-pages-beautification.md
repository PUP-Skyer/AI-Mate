# 工具箱五页面美化文档

> **项目：** AI 创业赋能平台 — react-ai-chat 子应用
> **范围：** 新对话 / Skill 库 / MCP 配置 / 自动化 / 知识库
> **日期：** 2026-08-08
> **状态：** 已完成，TypeScript 零编译错误

---

## 一、设计理念

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **玻璃拟态 (Glassmorphism)** | 所有卡片采用 `rgba(255,255,255,0.72)` 半透明背景 + `backdrop-filter: blur(12px)` 毛玻璃效果 |
| **胶囊圆角 (Pill Radius)** | 按钮、输入框、标签统一使用 `border-radius: 9999px` 胶囊造型 |
| **交错入场动画** | 列表项通过 `tool-stagger-1` 至 `tool-stagger-9` 实现 60ms 递增延迟 |
| **页面独立配色** | 每个页面拥有独立主题色，避免同质化 |
| **减少动效兼容** | `@media (prefers-reduced-motion: reduce)` 全局降级 |

### 1.2 页面配色方案

| 页面 | 主题色 | 辅助色 | 渐变 | 寓意 |
|------|--------|--------|------|------|
| 新对话 | `#1677ff` 科技蓝 | `#36cfc9` 青色 | `linear-gradient(135deg, #1677ff, #36cfc9)` | 延续侧边栏 `#0c1e3e` 深海蓝主调 |
| Skill 库 | `#00b96b` 翡翠绿 | `#95de64` 浅绿 | `linear-gradient(135deg, #00b96b, #95de64)` | 技能 = 能力增长 |
| MCP 配置 | `#08979c` 青色 | `#5cdbd3` 浅青 | `linear-gradient(135deg, #08979c, #5cdbd3)` | 连接 = 管道通信 |
| 自动化 | `#fa8c16` 琥珀橙 | `#ffc069` 浅橙 | `linear-gradient(135deg, #fa8c16, #ffc069)` | 自动化 = 齿轮运转 |
| 知识库 | `#722ed1` 紫色 | `#b37feb` 浅紫 | `linear-gradient(135deg, #722ed1, #b37feb)` | 知识 = 深度智慧 |

---

## 二、架构总览

### 2.1 文件结构

```
src/
├── components/tools/
│   ├── tool-theme.ts              # 共享主题系统（配色/字体/间距/圆角/阴影/纹理）
│   ├── tool-animations.css        # 共享动画库（关键帧/工具类/玻璃拟态/骨架屏）
│   └── shared/
│       ├── index.ts               # 统一导出
│       ├── ToolSection.tsx        # 分区容器（左侧渐变竖线 + 标题）
│       ├── ToolStatCard.tsx       # 统计卡片（rAF 缓动递增数字）
│       ├── ToolSkeleton.tsx       # 骨架屏（grid/list/card/stat 四种布局）
│       └── ToolEmptyState.tsx     # 空状态（浮动图标 + 文字）
├── pages/
│   ├── NewConversation.tsx        # 新对话页面
│   ├── SkillLibrary.tsx           # Skill 库页面
│   ├── MCPConfig.tsx              # MCP 配置页面
│   ├── Automation.tsx             # 自动化页面
│   └── KnowledgeVault.tsx         # 知识库页面
└── main.tsx                       # 全局导入 tool-animations.css
```

### 2.2 依赖关系

```
main.tsx
  └── imports tool-animations.css (全局生效)

各页面 (5个)
  ├── imports tool-theme.ts        (配色/字体/间距常量)
  ├── imports tool-animations.css  (通过全局 <style> 类名引用)
  └── imports shared/              (ToolSection, ToolStatCard, ...)
```

---

## 三、主题系统 (tool-theme.ts)

### 3.1 配色方案 (TOOL_PALETTE)

```typescript
export const TOOL_PALETTE = {
  conversation: {
    accent: '#1677ff',     secondary: '#36cfc9',
    glow: 'rgba(22, 119, 255, 0.15)',
    gradient: 'linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)',
    surface: '#ffffff',    surfaceAlt: '#f0f5ff',
    border: '#d6e4ff',
    chartColors: ['#1677ff', '#36cfc9', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'],
  },
  skill: {
    accent: '#00b96b',     secondary: '#95de64',
    glow: 'rgba(0, 185, 107, 0.12)',
    gradient: 'linear-gradient(135deg, #00b96b 0%, #95de64 100%)',
    surface: '#ffffff',    surfaceAlt: '#f6ffed',
    border: '#d9f7be',
    chartColors: ['#00b96b', '#95de64', '#1677ff', '#faad14', '#722ed1', '#eb2f96'],
  },
  mcp: {
    accent: '#08979c',     secondary: '#5cdbd3',
    glow: 'rgba(8, 151, 156, 0.12)',
    gradient: 'linear-gradient(135deg, #08979c 0%, #5cdbd3 100%)',
    surface: '#ffffff',    surfaceAlt: '#e6fffb',
    border: '#b5f5ec',
    chartColors: ['#08979c', '#5cdbd3', '#1677ff', '#52c41a', '#faad14', '#722ed1'],
  },
  automation: {
    accent: '#fa8c16',     secondary: '#ffc069',
    glow: 'rgba(250, 140, 22, 0.12)',
    gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)',
    surface: '#ffffff',    surfaceAlt: '#fff7e6',
    border: '#ffe7ba',
    chartColors: ['#fa8c16', '#ffc069', '#1677ff', '#52c41a', '#722ed1', '#eb2f96'],
  },
  knowledge: {
    accent: '#722ed1',     secondary: '#b37feb',
    glow: 'rgba(114, 46, 209, 0.12)',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
    surface: '#ffffff',    surfaceAlt: '#f9f0ff',
    border: '#d3adf7',
    chartColors: ['#722ed1', '#b37feb', '#1677ff', '#52c41a', '#faad14', '#08979c'],
  },
} as const;
```

### 3.2 设计令牌

| 令牌组 | 值 |
|--------|-----|
| **字体 (TOOL_FONTS)** | heading/body: `'Inter', 'PingFang SC', 'Microsoft YaHei'`; mono: `'JetBrains Mono', 'Consolas'` |
| **间距 (TOOL_SPACING)** | xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 |
| **圆角 (TOOL_RADIUS)** | sm:6, md:10, lg:16, xl:24, pill:9999 |
| **阴影 (TOOL_SHADOWS)** | card / cardHover / glass / glassHover / drawerGlow |
| **渐变 (TOOL_GRADIENTS)** | glassHighlight / headerBlue / statusConnected / statusError / statusIdle / shimmerLight |
| **纹理 (TOOL_TEXTURES)** | dotGrid (SVG 点阵) / gridLines (SVG 网格线) |

---

## 四、动画系统 (tool-animations.css)

### 4.1 关键帧定义

| 动画名 | 用途 | 参数 |
|--------|------|------|
| `toolFadeInUp` | 通用入场（上滑+淡入） | `0.5s cubic-bezier(0.22, 1, 0.36, 1)` |
| `toolCardRise` | 卡片入场（缩放+上滑+淡入） | `0.5s cubic-bezier(0.22, 1, 0.36, 1)` |
| `toolSlideInRight` | 右侧滑入 | `0.4s cubic-bezier(0.22, 1, 0.36, 1)` |
| `toolSlideInLeft` | 左侧滑入 | `0.4s cubic-bezier(0.22, 1, 0.36, 1)` |
| `toolPulseDot` | 状态脉动（缩放+透明度） | `2s ease-in-out infinite` |
| `toolNumberCount` | 数字递增入场 | `0.6s ease-out` |
| `toolStatusGlow` | 状态发光 | `1.8s ease-in-out infinite` |
| `toolFloat` | 浮动效果 | `3s ease-in-out infinite` |
| `toolBarGrow` | 进度条增长 | `0.8s cubic-bezier(0.22, 1, 0.36, 1)` |
| `toolShimmer` | 骨架屏闪烁 | `1.5s ease-in-out infinite` |

### 4.2 交错延迟工具类

```css
.tool-stagger-1 { animation-delay: 0.06s; }
.tool-stagger-2 { animation-delay: 0.12s; }
.tool-stagger-3 { animation-delay: 0.18s; }
.tool-stagger-4 { animation-delay: 0.24s; }
.tool-stagger-5 { animation-delay: 0.30s; }
.tool-stagger-6 { animation-delay: 0.36s; }
.tool-stagger-7 { animation-delay: 0.42s; }
.tool-stagger-8 { animation-delay: 0.48s; }
.tool-stagger-9 { animation-delay: 0.54s; }
```

### 4.3 复合样式类

| 类名 | 效果 |
|------|------|
| `.tool-glass-card` | 玻璃拟态卡片：`rgba(255,255,255,0.72)` + `blur(12px)` + `border-radius:16px` + hover 上浮 |
| `.tool-pill-btn` | 胶囊按钮：`border-radius:9999px` + hover `scale(1.03)` + active `scale(0.97)` |
| `.tool-pill-input` | 胶囊输入框：`border-radius:9999px` |
| `.tool-pill-tag` | 胶囊标签：`border-radius:9999px` + `padding:2px 12px` |
| `.tool-skeleton` | 骨架屏闪烁：蓝色渐变 + `shimmer` 动画 |
| `.tool-dot-bg` | 点阵背景纹理 |
| `.tool-grid-bg` | 网格线背景纹理 |

### 4.4 可访问性

```css
@media (prefers-reduced-motion: reduce) {
  /* 所有动画和过渡均被禁用 */
  /* 交错延迟归零 */
}
```

---

## 五、共享组件

### 5.1 ToolSection — 分区容器

**设计：** 左侧 3px 渐变竖线（从主题色渐变到透明）+ 无衬线标题 + 可选图标和副标题

```tsx
<ToolSection title="触发条件" accent="#fa8c16" icon={<ThunderboltOutlined />}>
  {/* 子内容 */}
</ToolSection>
```

**视觉细节：**
- 竖线：`width:3px`, `border-radius:9999px`, `linear-gradient(to bottom, accent, accent + '00')`
- 标题：`fontSize:15`, `fontWeight:700`, `letterSpacing:0.3`
- 默认带 `tool-fade-in-up tool-stagger-1` 入场动画

### 5.2 ToolStatCard — 统计卡片

**设计：** 顶部 2px 主色细线 + rAF 缓动递增数字 + 趋势箭头

```tsx
<ToolStatCard value={42} label="服务器总数" icon={<ApiOutlined />} accent="#08979c" trend="up" />
```

**技术实现：**
- 使用 `requestAnimationFrame` + smoothstep 缓动函数实现数字从 0 递增到目标值
- `useCountUp(target, duration=800)` Hook，800ms 内完成递增
- 趋势箭头：`up` 绿色 `#52c41a`，`down` 红色 `#ff4d4f`，`neutral` 灰色 `#8c8c8c`

### 5.3 ToolSkeleton — 骨架屏

**设计：** 支持四种布局，蓝色渐变 shimmer 效果

```tsx
<ToolSkeleton type="grid" rows={3} columns={3} />
<ToolSkeleton type="list" rows={5} />
<ToolSkeleton type="card" rows={3} />
<ToolSkeleton type="stat" columns={4} />
```

### 5.4 ToolEmptyState — 空状态

**设计：** 浮动图标（`tool-float` 动画）+ 标题 + 副标题

```tsx
<ToolEmptyState icon={<InboxOutlined />} title="暂无数据" subtitle="点击上方按钮创建" accent="#722ed1" />
```

---

## 六、页面美化详情

### 6.1 新对话页面 (NewConversation.tsx)

**主题色：** `#1677ff` 科技蓝

| 区域 | 美化内容 |
|------|----------|
| **根容器** | 添加 `tool-dot-bg` 点阵纹理背景 + CSS 变量 `--tool-accent` |
| **顶部工具栏** | 玻璃拟态：`rgba(255,255,255,0.72)` + `blur(12px)` + `tool-fade-in-up` 入场 |
| **消息气泡** | `tool-fade-in-up` + `tool-stagger-N` 交错入场; AI 回复使用 `rgba(255,255,255,0.85)` + `blur(8px)` 玻璃效果; 用户消息带 `rgba(22,119,255,0.15)` 阴影 |
| **空状态** | 渐变图标方块（64x64, `linear-gradient(135deg, #1677ff, #36cfc9)`）+ `tool-float` 浮动动画 + `tool-fade-in-up` 入场 |
| **输入区域** | 玻璃拟态背景 + 胶囊圆角 |
| **Skill 按钮** | 左侧 `9999px 0 0 9999px` 胶囊半圆 |
| **发送按钮** | 右侧 `0 9999px 9999px 0` 胶囊半圆 + 渐变背景 + 蓝色阴影 |
| **Skill 下拉** | 玻璃拟态 + `tool-fade-in-up` + 列表项 hover 横向位移 `translateX(4px)` |
| **Skill 面板** | 玻璃拟态 + 头部 `rgba(255,255,255,0.6)` 半透明 + 列表项交错入场 |
| **全局 CSS** | `.ant-btn` 胶囊圆角 + `cubic-bezier(0.22, 1, 0.36, 1)` 缓动; `.ant-tag` 胶囊; `.ant-card` 16px 圆角; `.ant-avatar` hover `scale(1.08)` |
| **头像** | hover `scale(1.08)` 微交互 |

### 6.2 Skill 库页面 (SkillLibrary.tsx)

**主题色：** `#00b96b` 翡翠绿

| 区域 | 美化内容 |
|------|----------|
| **根容器** | `tool-dot-bg` 点阵纹理 + CSS 变量 `--tool-accent: #00b96b` |
| **顶部标题栏** | 玻璃拟态卡片 + 渐变图标方块（40x40, `linear-gradient(135deg, #00b96b, #95de64)`） + `tool-fade-in-up` 入场 |
| **新建按钮** | `tool-pill-btn` 胶囊圆角 |
| **分类筛选** | `Space.Compact` + 每个 Tag 使用 `tool-pill-btn` + 交错入场 + Badge 计数 |
| **Skill 卡片** | `tool-glass-card` + `tool-card-rise` + `tool-stagger-N` 交错入场; 分类图标渐变背景 + hover `scale` |
| **卡片操作** | 底部 actions 区域使用胶囊圆角 |

### 6.3 MCP 配置页面 (MCPConfig.tsx)

**主题色：** `#08979c` 青色

| 区域 | 美化内容 |
|------|----------|
| **根容器** | `tool-dot-bg` 点阵纹理 + CSS 变量 `--tool-accent: #08979c` |
| **统计概览** | 玻璃拟态卡片包裹 + `ToolStatCard` 组件（rAF 数字递增）+ 胶囊搜索框和按钮 |
| **统计指标** | 服务器总数 `#08979c` / 已连接 `#52c41a` (trend=up) / 可用工具 `#08979c` |
| **服务器卡片** | `tool-glass-card` + `tool-card-rise` + 交错入场; 状态图标渐变背景（connected=绿/error=红/idle=青）; connecting 状态使用 `tool-pulse-dot` 脉动动画 |
| **内置工具测试** | 胶囊按钮 |

### 6.4 自动化页面 (Automation.tsx)

**主题色：** `#fa8c16` 琥珀橙

| 区域 | 美化内容 |
|------|----------|
| **根容器** | `tool-dot-bg` 点阵纹理 + CSS 变量 `--tool-accent: #fa8c16` |
| **规则列表** | `tool-glass-card` + `tool-card-rise` + 交错入场; hover `translateY(-2px)` 上浮 |
| **触发类型 Tag** | `tool-pill-tag` 胶囊圆角 + 渐变背景色 |
| **Timeline 日志** | 自定义节点（`tool-pulse-dot` 脉动 for running 状态）; 交错入场动画 |
| **Drawer 表单** | 使用 `ToolSection` 替代 Divider + Title; 触发条件区/执行动作区/规则设置区各有独立渐变竖线 |
| **执行状态** | success=绿/failed=红/running=蓝; running 使用脉动动画 |

### 6.5 知识库页面 (KnowledgeVault.tsx)

**主题色：** `#722ed1` 紫色

| 区域 | 美化内容 |
|------|----------|
| **根容器** | `tool-dot-bg` 点阵纹理 + CSS 变量 `--tool-accent: #722ed1` |
| **Obsidian 接入卡片** | 玻璃拟态 + 渐变图标方块（`linear-gradient(135deg, #722ed1, #b37feb)`） + 连接状态 `tool-pulse-dot` 绿色脉动 + 胶囊状态 Tag |
| **搜索区** | 玻璃拟态卡片 + 胶囊搜索框 + TopK 选择器 + 胶囊搜索按钮 |
| **文档列表** | 玻璃拟态卡片 + 交错入场; 文档图标渐变背景 |
| **空状态** | `ToolEmptyState` 组件 + 浮动图标 |

---

## 七、技术实现要点

### 7.1 玻璃拟态实现

```css
.tool-glass-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 4px 16px rgba(31, 110, 185, 0.06);
  border-radius: 16px;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.2s ease;
}

.tool-glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(31, 110, 185, 0.06),
              0 8px 24px rgba(22, 119, 255, 0.08);
}
```

### 7.2 rAF 数字递增 (ToolStatCard)

```typescript
const useCountUp = (target: number, duration = 800): number => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t); // smoothstep
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return display;
};
```

### 7.3 CSS 变量主题注入

每个页面根容器注入 CSS 变量，供 `tool-animations.css` 中的 `var()` 引用：

```tsx
<Layout
  className="tool-page tool-dot-bg"
  style={{
    '--tool-accent': '#1677ff',
    '--tool-accent-glow': 'rgba(22,119,255,0.15)',
  } as React.CSSProperties}
>
```

### 7.4 全局 CSS 注入 (NewConversation.tsx)

新对话页面通过 `<style>` 标签注入页面级 CSS，覆盖 Ant Design 默认样式：

```tsx
<style>{`
  .new-conv-page .ant-btn {
    border-radius: 9999px !important;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1) !important;
  }
  .new-conv-page .ant-btn:hover { transform: scale(1.03); }
  .new-conv-page .ant-btn:active { transform: scale(0.97); }
  .new-conv-page .ant-input,
  .new-conv-page .ant-input-affix-wrapper {
    border-radius: 9999px !important;
  }
  .new-conv-page .ant-tag {
    border-radius: 9999px !important;
    padding: 2px 12px !important;
  }
  .new-conv-page .ant-card { border-radius: 16px !important; }
  .new-conv-page .ant-avatar:hover { transform: scale(1.08); }
  .new-conv-page .msg-bubble {
    animation: toolFadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
`}</style>
```

### 7.5 交错入场动画模式

列表项通过 `index` 计算 stagger 类名，实现递增延迟入场：

```tsx
{items.map((item, index) => (
  <Card
    className={`tool-glass-card tool-card-rise tool-stagger-${Math.min(index + 1, 9)}`}
  >
    {/* ... */}
  </Card>
))}
```

`Math.min(index + 1, 9)` 确保延迟不超过第 9 级（0.54s），避免长列表等待过久。

---

## 八、验证结果

### 8.1 TypeScript 编译

```
命令: npx tsc --noEmit
结果: 退出码 0，零错误
```

### 8.2 美化类名覆盖统计

| 页面 | `tool-glass-card` | `tool-pill-btn` | `tool-fade-in-up` | `TOOL_PALETTE` |
|------|-------------------|-----------------|-------------------|-----------------|
| NewConversation.tsx | 2 (下拉+面板) | CSS 全局覆盖 | 5+ (消息+下拉+面板+空状态) | CSS 变量注入 |
| SkillLibrary.tsx | 6 | 6 | 6 | 直接引用 |
| MCPConfig.tsx | 19 | 12 | 19 | 直接引用 |
| Automation.tsx | 12 | 12 | 12 | 直接引用 |
| KnowledgeVault.tsx | 9 | 9 | 9 | 直接引用 |

### 8.3 共享文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `tool-theme.ts` | 139 | 5 页配色 + 字体 + 间距 + 圆角 + 渐变 + 阴影 + 纹理 + 类型导出 |
| `tool-animations.css` | 215 | 10 个关键帧 + 9 级交错延迟 + 8 个动画类 + 6 个复合样式类 + 可访问性 |
| `shared/ToolSection.tsx` | 85 | 分区容器（渐变竖线 + 标题） |
| `shared/ToolStatCard.tsx` | 125 | 统计卡片（rAF 递增 + 趋势箭头） |
| `shared/ToolSkeleton.tsx` | 106 | 骨架屏（4 种布局） |
| `shared/ToolEmptyState.tsx` | 72 | 空状态（浮动图标） |
| `shared/index.ts` | 4 | 统一导出 |

---

## 九、设计一致性保障

### 9.1 与现有系统的对齐

| 维度 | 工具箱页面 | 现有系统 | 对齐方式 |
|------|-----------|---------|----------|
| 侧边栏配色 | 科技蓝 `#0c1e3e` | 侧边栏 `#0c1e3e` | 新对话页面 accent 延续 `#1677ff` |
| 管家AI主题 | 独立品红色系 | butler-theme.ts | 结构镜像，配色独立 |
| 动画缓动 | `cubic-bezier(0.22, 1, 0.36, 1)` | butler-animations.css | 完全一致 |
| 圆角系统 | pill:9999, lg:16 | 全局设计令牌 | 完全一致 |
| 骨架屏 | shimmer 蓝色渐变 | ScoutLoadingSkeleton | 结构镜像 |

### 9.2 后续扩展指南

1. **新增页面：** 在 `TOOL_PALETTE` 中添加新配色方案，页面根容器注入对应 CSS 变量
2. **新增动画：** 在 `tool-animations.css` 中添加关键帧和工具类
3. **新增共享组件：** 在 `shared/` 目录创建组件并更新 `index.ts`
4. **主题切换：** 可通过读取 `aiStore` 的设置动态切换 `TOOL_PALETTE` key

---

## 十、总结

本次美化工作为工具箱五个页面（新对话、Skill 库、MCP 配置、自动化、知识库）建立了统一的视觉设计语言：

- **共享基础设施：** 1 个主题系统 + 1 个动画库 + 4 个共享组件，总计 7 个文件
- **页面级改造：** 5 个页面全部应用玻璃拟态、胶囊圆角、交错入场动画
- **独立配色：** 每个页面拥有独立主题色，避免视觉同质化
- **可访问性：** 支持 `prefers-reduced-motion` 减少动效偏好
- **零编译错误：** TypeScript 严格模式通过
- **设计一致性：** 与侧边栏科技蓝、管家AI主题系统、全局设计令牌完全对齐
