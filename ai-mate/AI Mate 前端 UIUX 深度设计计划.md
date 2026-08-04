# AI Mate 前端 UI/UX 深度设计计划

## 项目概述

**产品**: AI Mate —— 青宸智汇·AI集群创投赋能平台
**类型**: SaaS / 多角色智能协作平台
**技术栈**: React + Ant Design + Tailwind CSS, Vue 3 + Naive UI + qiankun 微前端
**架构**: 主应用(main-app) + 7个子应用（4 Vue + 3 React）
**现状**: 使用组件库默认样式，缺乏统一品牌视觉，各子应用风格割裂

## 设计目标

1. **建立统一设计系统** —— 跨 React/Vue 子应用的一致性视觉语言
2. **提升品牌辨识度** —— 从"Ant Design 默认风"升级为"AI Mate 专业科技风"
3. **优化深色/浅色模式** —— 专业的双主题系统，非简单的反色
4. **增强交互体验** —— 微动效、悬浮反馈、加载状态、过渡动画
5. **统一图标与插画** —— 使用 Lucide 图标库，禁用 emoji
6. **响应式与可访问性** —— 覆盖 375px~1536px，满足 WCAG 2.1 AA
7. **多端口统一入口** —— 四个端（学生端/融资端/专家端/管理端）在登录页切换，进入不同界面

---

## 阶段一：设计系统基础建设（优先）

### 1.1 全局设计令牌 (Design Tokens)

建立跨技术栈共享的设计令牌文件，位置：`/design-system/tokens/`。

#### 色彩系统

| 语义         | Token                    | 色值                        |
| ------------ | ------------------------ | --------------------------- |
| 主色         | `--color-primary`        | `#1E40AF` (专业深蓝)        |
| 辅色         | `--color-secondary`      | `#3B82F6` (明亮蓝)          |
| CTA/成功     | `--color-success`        | `#22C55E` (创业绿)          |
| 警告         | `--color-warning`        | `#F59E0B` (琥珀)            |
| 危险         | `--color-danger`         | `#EF4444` (红)              |
| 浅色背景     | `--bg-page`              | `#F8FAFC`                   |
| 浅色卡片     | `--bg-card`              | `#FFFFFF`                   |
| 浅色悬浮     | `--bg-hover`             | `#EFF6FF`                   |
| 深色背景     | `--bg-dark-page`         | `#0F172A`                   |
| 深色卡片     | `--bg-dark-card`         | `#1E293B`                   |
| 文字主色(浅) | `--text-primary`         | `#0F172A` (slate-900)       |
| 文字辅色(浅) | `--text-secondary`       | `#475569` (slate-600)       |
| 文字主色(深) | `--text-dark-primary`    | `#F8FAFC` (slate-50)        |
| 文字辅色(深) | `--text-dark-secondary`  | `#94A3B8` (slate-400)       |
| 边框(浅)     | `--border-light`         | `#E2E8F0` (slate-200)       |
| 边框(深)     | `--border-dark`          | `#334155` (slate-700)       |
| 毛玻璃底(浅) | `--glass-bg-light`       | `rgba(255,255,255,0.8)`     |
| 毛玻璃底(深) | `--glass-bg-dark`        | `rgba(30,41,59,0.7)`       |

#### 字体系统

| 用途   | 字体                   | 字重          |
| ------ | ---------------------- | ------------- |
| 标题   | `Poppins`              | 600 / 700     |
| 正文   | `Inter` / `Open Sans`  | 400 / 500/600 |
| 代码   | `JetBrains Mono`       | 400           |
| 中文   | `Noto Sans CJK SC`     | 400 / 500/700 |

字号层级：xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36)

#### 间距系统

基于 4px 栅格：1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64)

#### 圆角系统

sm(6px), md(10px), lg(16px), xl(24px), full(9999px)

#### 阴影系统

| 级别   | 值                                      |
| ------ | --------------------------------------- |
| sm     | `0 1px 2px rgba(0,0,0,0.05)`            |
| md     | `0 4px 6px -1px rgba(0,0,0,0.1)`        |
| lg     | `0 10px 15px -3px rgba(0,0,0,0.1)`      |
| glow   | `0 0 20px rgba(30,64,175,0.3)`          |

#### 动效系统

| 类型     | 时长     | 缓动                              |
| -------- | -------- | --------------------------------- |
| 快速反馈 | 150ms    | `cubic-bezier(0.4, 0, 0.2, 1)`   |
| 常规过渡 | 200-300ms | `cubic-bezier(0.4, 0, 0.2, 1)`   |
| 页面切换 | 400ms    | `cubic-bezier(0.4, 0, 0.2, 1)`   |

### 1.2 图标系统统一

- **禁用所有 emoji 作为 UI 图标**
- **统一使用 Lucide React / lucide-vue-next**
- 固定 viewBox 24x24，使用 w-5 h-5 (20px) 或 w-6 h-6 (24px)
- 每个 AI 角色分配专属图标与色彩标识：

| 角色       | 图标       | 品牌色     |
| ---------- | ---------- | ---------- |
| 探路者     | `Compass`  | `#1890FF`  |
| 军师       | `Brain`    | `#A855F7`  |
| 工匠       | `Wrench`   | `#22C55E`  |
| 管家       | `Shield`   | `#722ED1`  |

### 1.3 全局样式文件重构

为每个子应用创建/更新统一的全局样式入口：

- `react-ai-chat/src/styles/global.css` —— 引入设计令牌，覆盖 Ant Design 主题
- `main-app/src/styles/global.css` —— 覆盖 Naive UI 主题变量
- 其他 Vue 子应用同理

---

## 阶段二：入场动画与登录页重设计

### 2.1 开场文字动画 (TextType)

用户首次打开网站时，全屏展示一段打字机风格的入场动画，营造沉浸式品牌体验。

**组件**: `TextType` (基于 React + GSAP)

**动画文字**:

> "心怀赤诚的少年啊，准备好奔赴一段创业之旅了吗"

**实现方案**:

```
文件位置: main-app/src/components/TextType.tsx
依赖: gsap
```

**动画参数**:

| 参数             | 值                    | 说明                     |
| ---------------- | --------------------- | ------------------------ |
| text             | "心怀赤诚的少年啊，准备好奔赴一段创业之旅了吗" | 打字内容               |
| typingSpeed      | 80ms                  | 每个字符的打字速度       |
| initialDelay     | 500ms                 | 页面加载后的初始延迟     |
| pauseDuration    | 2000ms                | 打完后的停留时间         |
| showCursor       | true                  | 显示闪烁光标             |
| cursorCharacter  | `\|`                  | 光标字符                 |
| cursorBlinkDuration | 0.5s               | 光标闪烁周期             |
| loop             | false                 | 不循环，只播放一次       |
| startOnVisible   | true                  | 元素进入视口时才开始播放 |

**页面结构**:

```
┌──────────────────────────────────────────┐
│                                          │
│          (深蓝渐变全屏背景)               │
│                                          │
│              AI Mate                     │
│         青宸智汇·AI集群创投赋能平台        │
│                                          │
│     心怀赤诚的少年啊，准备好奔赴          │
│          一段创业之旅了吗|               │
│                                          │
│          [ 进入平台 → ]                  │
│                                          │
└──────────────────────────────────────────┘
```

**动画时序**:

```
0ms        → 背景渐入 (opacity 0→1, 800ms)
500ms      → Logo 缩放弹入 (scale 0.8→1, 600ms, ease-out-back)
800ms      → 副标题淡入上移 (opacity 0→1, translateY 20→0, 400ms)
1200ms     → 开始打字动画 (typingSpeed 80ms/字)
~3500ms    → 打字完成
5500ms     → "进入平台"按钮淡入 (opacity 0→1, 300ms)
           → 点击按钮 → 页面淡出 → 跳转登录页
```

**背景设计**:

- 深蓝渐变: `linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)`
- 装饰元素: 3-5个半透明圆形光斑，缓慢浮动动画 (20-30s循环)
- 光斑颜色: `rgba(30,64,175,0.15)` / `rgba(59,130,246,0.1)` / `rgba(34,197,94,0.08)`
- 粒子效果（可选）: 使用 canvas 绘制微弱星点，缓慢漂移

**TextType 组件核心代码**:

```tsx
'use client';

import { ElementType, useEffect, useRef, useState, createElement, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
}

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = () => {
    if (textColors.length === 0) return 'inherit';
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;
    let timeout: ReturnType<typeof setTimeout>;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode
      ? currentText.split('').reverse().join('')
      : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) return;
          if (onSentenceComplete)
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          setCurrentTextIndex(prev => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText(prev => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText(prev => prev + processedText[currentCharIndex]);
              setCurrentCharIndex(prev => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }
    return () => clearTimeout(timeout);
  }, [
    currentCharIndex, displayedText, isDeleting, typingSpeed,
    deletingSpeed, pauseDuration, textArray, currentTextIndex,
    loop, initialDelay, isVisible, reverseMode, variableSpeed, onSentenceComplete
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return createElement(
    Component,
    { ref: containerRef, className: `text-type ${className}`, ...props },
    <span className="text-type__content" style={{ color: getCurrentTextColor() || 'inherit' }}>
      {displayedText}
    </span>,
    showCursor && (
      <span
        ref={cursorRef}
        className={`text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'text-type__cursor--hidden' : ''}`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default TextType;
```

**TextType.css**:

```css
.text-type {
  display: inline-block;
  white-space: pre-wrap;
}

.text-type__cursor {
  margin-left: 0.25rem;
  display: inline-block;
  opacity: 1;
}

.text-type__cursor--hidden {
  display: none;
}
```

### 2.2 登录页重设计 —— 四端切换登录

**目标文件**: `main-app/src/views/LoginView.vue` (Vue) 或 `main-app/src/components/PortalLoginSwitcher.tsx` (React)

**核心功能**: 在登录页提供四个端的切换入口，用户选择身份后登录，系统根据身份展示对应的功能界面。

**页面布局**:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│              (深蓝渐变全屏背景)                    │
│                                                  │
│                  AI Mate                         │
│           青宸智汇·AI集群创投赋能平台              │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  🎓 学生端   │  │  💰 融资端   │               │
│  │  创业者使用  │  │  投资人使用  │               │
│  │  AI数字员工  │  │  项目浏览    │               │
│  │  资源匹配    │  │  融资对接    │               │
│  │  社区交流    │  │  投资管理    │               │
│  └─────────────┘  └─────────────┘               │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  🏆 专家端   │  │  ⚙️ 管理端   │               │
│  │  评审专家    │  │  运营团队    │               │
│  │  项目评审    │  │  用户管理    │               │
│  │  打分反馈    │  │  项目管理    │               │
│  │  专业指导    │  │  数据看板    │               │
│  └─────────────┘  └─────────────┘               │
│                                                  │
│  ┌──────────────────────────────────┐            │
│  │  (毛玻璃登录卡片)                 │            │
│  │  邮箱: [________________]        │            │
│  │  密码: [________________]        │            │
│  │  [        登 录        ]         │            │
│  │  还没有账号？立即注册             │            │
│  └──────────────────────────────────┘            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**四端Tab设计**:

| 端     | 图标              | 品牌色     | 描述                                       |
| ------ | ----------------- | ---------- | ------------------------------------------ |
| 学生端 | `GraduationCap`   | `#3B82F6`  | 创业者使用，AI数字员工对话、资源匹配、社区交流 |
| 融资端 | `Wallet`          | `#10B981`  | 投资人使用，项目浏览、融资对接、投资管理       |
| 专家端 | `Award`           | `#8B5CF6`  | 评审专家使用，项目评审、打分反馈、专业指导     |
| 管理端 | `Settings`        | `#F59E0B`  | 运营团队使用，用户管理、项目管理、数据看板     |

**交互细节**:

- Tab切换: 300ms过渡动画，选中态品牌色边框 + 背景发光效果
- 卡片hover: scale(1.02) + translateY(-4px) + 阴影加深
- 登录时将 `selectedPortal` 作为 `portal` 参数传给后端
- 登录成功后根据 `portal` 值跳转到对应端的首页
- 登录按钮颜色随选中端动态变化

**视觉规范**:

- 背景: `linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)`
- 登录卡片: `backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl`
- Logo区域: 毛玻璃效果容器 `bg-white/10 backdrop-blur-xl`
- 输入框: 深色半透明背景 `bg-white/5` + 白色文字 + 聚焦品牌色边框
- 按钮: 动态品牌色渐变 + hover扫光动画
- 装饰光斑: 蓝/紫/绿三色模糊圆形，缓慢浮动

**React 组件实现** (`PortalLoginSwitcher.tsx`):

```tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Wallet, 
  Award, 
  Settings,
  ArrowRight,
  Sparkles
} from 'lucide-react';

type PortalType = 'student' | 'investor' | 'expert' | 'admin';

interface PortalOption {
  id: PortalType;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  features: string[];
  gradient: string;
  accentColor: string;
}

const PORTALS: PortalOption[] = [
  {
    id: 'student',
    icon: GraduationCap,
    title: '学生端',
    subtitle: '创业者使用',
    features: ['AI数字员工对话', '资源匹配', '社区交流'],
    gradient: 'from-blue-500/20 via-blue-600/10 to-cyan-400/20',
    accentColor: '#3B82F6'
  },
  {
    id: 'investor',
    icon: Wallet,
    title: '融资端',
    subtitle: '投资人使用',
    features: ['项目浏览', '融资对接', '投资管理'],
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-teal-400/20',
    accentColor: '#10B981'
  },
  {
    id: 'expert',
    icon: Award,
    title: '专家端',
    subtitle: '评审专家使用',
    features: ['项目评审', '打分反馈', '专业指导'],
    gradient: 'from-purple-500/20 via-purple-600/10 to-violet-400/20',
    accentColor: '#8B5CF6'
  },
  {
    id: 'admin',
    icon: Settings,
    title: '管理端',
    subtitle: '运营团队使用',
    features: ['用户管理', '项目管理', '数据看板'],
    gradient: 'from-orange-500/20 via-orange-600/10 to-amber-400/20',
    accentColor: '#F59E0B'
  }
];

// PortalCard 子组件
const PortalCard: React.FC<{
  portal: PortalOption;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}> = ({ portal, isSelected, onClick, index }) => {
  const Icon = portal.icon;
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-2xl p-5 text-left
        transition-all duration-300 ease-out
        ${isSelected 
          ? 'ring-2 ring-offset-2 ring-offset-slate-900 shadow-lg' 
          : 'hover:shadow-xl'
        }
      `}
      style={{
        background: isSelected 
          ? `linear-gradient(135deg, ${portal.accentColor}15, ${portal.accentColor}05)`
          : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isSelected ? `0 0 20px ${portal.accentColor}30` : undefined
      }}
    >
      {/* 选中指示条 */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: portal.accentColor }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: isSelected ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* 图标 */}
      <div 
        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ 
          backgroundColor: `${portal.accentColor}20`,
          color: portal.accentColor 
        }}
      >
        <Icon className="h-6 w-6" />
      </div>
      
      {/* 标题 */}
      <h3 className="mb-1 text-lg font-semibold text-white">
        {portal.title}
      </h3>
      <p className="mb-3 text-sm text-slate-400">
        {portal.subtitle}
      </p>
      
      {/* 功能列表 */}
      <ul className="space-y-1.5">
        {portal.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles 
              className="h-3 w-3 flex-shrink-0" 
              style={{ color: portal.accentColor }}
            />
            {feature}
          </li>
        ))}
      </ul>
      
      {/* 选中标记 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: portal.accentColor }}
          >
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// LoginForm 子组件
const LoginForm: React.FC<{
  selectedPortal: PortalType;
  onSubmit: (credentials: { email: string; password: string }) => void;
}> = ({ selectedPortal, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const portal = PORTALS.find(p => p.id === selectedPortal)!;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSubmit({ email, password });
    setIsLoading(false);
  };
  
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* 当前选中端提示 */}
      <div 
        className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: `${portal.accentColor}15` }}
      >
        <portal.icon className="h-5 w-5" style={{ color: portal.accentColor }} />
        <span className="text-sm text-slate-200">
          正在以 <span className="font-medium" style={{ color: portal.accentColor }}>{portal.title}</span> 身份登录
        </span>
      </div>
      
      {/* 邮箱输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">邮箱</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱地址"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:bg-white/10"
          style={{ '--accent-color': portal.accentColor } as React.CSSProperties}
          required
        />
      </div>
      
      {/* 密码输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:bg-white/10"
          required
        />
      </div>
      
      {/* 登录按钮 */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="group relative mt-6 w-full overflow-hidden rounded-xl py-3.5 font-medium text-white transition-all disabled:opacity-50"
        style={{ 
          background: `linear-gradient(135deg, ${portal.accentColor}, ${portal.accentColor}dd)`
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? '登录中...' : <><>登录</><ArrowRight className="h-4 w-4" /></>}
        </span>
        {/* 按钮扫光效果 */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      </motion.button>
    </motion.form>
  );
};

// 主组件
const PortalLoginSwitcher: React.FC<{
  onPortalSelect?: (portal: PortalType) => void;
  onLogin?: (portal: PortalType, credentials: { email: string; password: string }) => void;
}> = ({ onPortalSelect, onLogin }) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('student');
  
  const handlePortalSelect = (portal: PortalType) => {
    setSelectedPortal(portal);
    onPortalSelect?.(portal);
  };
  
  const handleLogin = (credentials: { email: string; password: string }) => {
    onLogin?.(selectedPortal, credentials);
  };
  
  return (
    <div className="min-h-screen w-full">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
      
      {/* 装饰光斑 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>
      
      {/* 内容 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl">
              <Sparkles className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">AI Mate</h1>
            <p className="text-slate-400">青宸智汇 · AI集群创投赋能平台</p>
          </motion.div>
          
          {/* 主卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl"
          >
            <div className="grid lg:grid-cols-2">
              
              {/* 左侧：端选择 */}
              <div className="p-6 lg:p-8">
                <h2 className="mb-6 text-xl font-semibold text-white">
                  选择登录身份
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {PORTALS.map((portal, index) => (
                    <PortalCard
                      key={portal.id}
                      portal={portal}
                      isSelected={selectedPortal === portal.id}
                      onClick={() => handlePortalSelect(portal.id)}
                      index={index}
                    />
                  ))}
                </div>
              </div>
              
              {/* 右侧：登录表单 */}
              <div className="border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 lg:p-8">
                <h2 className="mb-6 text-xl font-semibold text-white">
                  账号登录
                </h2>
                <LoginForm
                  selectedPortal={selectedPortal}
                  onSubmit={handleLogin}
                />
              </div>
              
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
};

export default PortalLoginSwitcher;
```

**Vue 版本实现** (`LoginView.vue`):

```vue
<template>
  <div class="min-h-screen w-full relative">
    <!-- 背景 -->
    <div class="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />
    
    <!-- 装饰光斑 -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div class="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-purple-500/10 blur-3xl" />
    </div>
    
    <!-- 内容 -->
    <div class="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-5xl">
        
        <!-- Logo -->
        <div class="mb-8 text-center">
          <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl">
            <Sparkles class="h-8 w-8 text-blue-400" />
          </div>
          <h1 class="mb-2 text-3xl font-bold text-white">AI Mate</h1>
          <p class="text-slate-400">青宸智汇 · AI集群创投赋能平台</p>
        </div>
        
        <!-- 主卡片 -->
        <div class="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl">
          <div class="grid lg:grid-cols-2">
            
            <!-- 左侧：端选择 -->
            <div class="p-6 lg:p-8">
              <h2 class="mb-6 text-xl font-semibold text-white">选择登录身份</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <button
                  v-for="(portal, index) in portals"
                  :key="portal.id"
                  @click="selectedPortal = portal.id"
                  class="relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300"
                  :class="selectedPortal === portal.id 
                    ? 'ring-2 ring-offset-2 ring-offset-slate-900' 
                    : 'hover:shadow-xl'"
                  :style="getPortalCardStyle(portal, selectedPortal === portal.id)"
                >
                  <!-- 选中指示条 -->
                  <div 
                    class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-transform duration-200"
                    :style="{ backgroundColor: portal.accentColor, transform: selectedPortal === portal.id ? 'scaleY(1)' : 'scaleY(0)' }"
                  />
                  
                  <!-- 图标 -->
                  <div 
                    class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    :style="{ backgroundColor: portal.accentColor + '20', color: portal.accentColor }"
                  >
                    <component :is="portal.icon" class="h-6 w-6" />
                  </div>
                  
                  <!-- 标题 -->
                  <h3 class="mb-1 text-lg font-semibold text-white">{{ portal.title }}</h3>
                  <p class="mb-3 text-sm text-slate-400">{{ portal.subtitle }}</p>
                  
                  <!-- 功能列表 -->
                  <ul class="space-y-1.5">
                    <li v-for="(feature, i) in portal.features" :key="i" class="flex items-center gap-2 text-xs text-slate-300">
                      <Sparkles class="h-3 w-3 flex-shrink-0" :style="{ color: portal.accentColor }" />
                      {{ feature }}
                    </li>
                  </ul>
                </button>
              </div>
            </div>
            
            <!-- 右侧：登录表单 -->
            <div class="border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <h2 class="mb-6 text-xl font-semibold text-white">账号登录</h2>
              
              <!-- 当前选中端提示 -->
              <div 
                class="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
                :style="{ backgroundColor: currentPortal.accentColor + '15' }"
              >
                <component :is="currentPortal.icon" class="h-5 w-5" :style="{ color: currentPortal.accentColor }" />
                <span class="text-sm text-slate-200">
                  正在以 <span class="font-medium" :style="{ color: currentPortal.accentColor }">{{ currentPortal.title }}</span> 身份登录
                </span>
              </div>
              
              <!-- 表单 -->
              <form @submit.prevent="handleLogin" class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium text-slate-300">邮箱</label>
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:bg-white/10"
                    required
                  />
                </div>
                
                <div class="space-y-2">
                  <label class="text-sm font-medium text-slate-300">密码</label>
                  <input
                    v-model="form.password"
                    type="password"
                    placeholder="请输入密码"
                    class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition-all focus:bg-white/10"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  :disabled="loading"
                  class="group relative mt-6 w-full overflow-hidden rounded-xl py-3.5 font-medium text-white transition-all disabled:opacity-50"
                  :style="{ background: `linear-gradient(135deg, ${currentPortal.accentColor}, ${currentPortal.accentColor}dd)` }"
                >
                  <span class="relative z-10 flex items-center justify-center gap-2">
                    {{ loading ? '登录中...' : '登录' }}
                    <ArrowRight v-if="!loading" class="h-4 w-4" />
                  </span>
                </button>
              </form>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { GraduationCap, Wallet, Award, Settings, Sparkles, ArrowRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const portals = [
  {
    id: 'student' as const,
    icon: GraduationCap,
    title: '学生端',
    subtitle: '创业者使用',
    features: ['AI数字员工对话', '资源匹配', '社区交流'],
    accentColor: '#3B82F6'
  },
  {
    id: 'investor' as const,
    icon: Wallet,
    title: '融资端',
    subtitle: '投资人使用',
    features: ['项目浏览', '融资对接', '投资管理'],
    accentColor: '#10B981'
  },
  {
    id: 'expert' as const,
    icon: Award,
    title: '专家端',
    subtitle: '评审专家使用',
    features: ['项目评审', '打分反馈', '专业指导'],
    accentColor: '#8B5CF6'
  },
  {
    id: 'admin' as const,
    icon: Settings,
    title: '管理端',
    subtitle: '运营团队使用',
    features: ['用户管理', '项目管理', '数据看板'],
    accentColor: '#F59E0B'
  }
]

const selectedPortal = ref('student')
const currentPortal = computed(() => portals.find(p => p.id === selectedPortal.value)!)

const form = reactive({ email: '', password: '' })
const loading = ref(false)

const getPortalCardStyle = (portal: any, isSelected: boolean) => ({
  background: isSelected 
    ? `linear-gradient(135deg, ${portal.accentColor}15, ${portal.accentColor}05)`
    : 'rgba(255, 255, 255, 0.05)',
  boxShadow: isSelected ? `0 0 20px ${portal.accentColor}30` : undefined
})

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await loginApi({ 
      email: form.email, 
      password: form.password,
      portal: selectedPortal.value 
    })
    
    userStore.login(res.data.token, res.data.user, res.data.refreshToken)
    
    // 根据端跳转到不同页面
    const routes: Record<string, string> = {
      student: '/dashboard',
      investor: '/invest',
      expert: '/expert-review',
      admin: '/admin'
    }
    router.push(routes[selectedPortal.value])
  } finally {
    loading.value = false
  }
}
</script>
```

### 2.3 注册页同步更新

**目标文件**: `main-app/src/views/RegisterView.vue`

- 与登录页保持一致的视觉风格（深蓝渐变背景 + 毛玻璃卡片）
- 注册时同样传递 `portal` 参数
- 注册成功后自动登录并跳转到对应端首页

---

## 阶段三：核心布局与导航重设计

### 3.1 侧边栏 —— 根据角色动态菜单

**目标文件**: `main-app/src/layouts/AppSidebar.vue`

**核心功能**: 从 `userStore` 获取当前用户的 `portal` 字段，根据不同端显示不同的导航菜单。

#### 学生端菜单

```
AI 数字员工
  ├── 探路者 (资源对接)
  │   ├── AI 对话
  │   └── 学习路径
  ├── 军师 (运营策略)
  │   ├── AI 对话
  │   ├── 策略工作台
  │   └── 创业规划
  ├── 工匠 (内容生成)
  │   ├── AI 对话
  │   ├── 创作工作台
  │   └── 技能库
  └── 管家 (客户服务)
      ├── AI 对话
      ├── 管理看板
      └── FAQ

平台功能
  ├── 资源中心
  ├── 社区
  └── 数据看板
```

#### 融资端菜单

```
融资对接
  ├── 项目浏览
  │   ├── 按阶段筛选 (种子轮/天使轮/Pre-A/ABC轮)
  │   └── 项目详情 & 商业计划书
  ├── 融资管理
  │   ├── 已投项目
  │   └── 融资进度追踪
  └── 投资组合分析

平台功能
  ├── 资源中心
  ├── 社区
  └── 数据看板
```

#### 专家端菜单

```
专家评审
  ├── 待评审项目
  │   ├── 创意组评审
  │   └── 出场组评审
  ├── 评审历史
  └── 评审反馈

平台功能
  ├── 资源中心
  ├── 社区
  └── 数据看板
```

#### 管理端菜单

```
管理后台
  ├── 总览 (数据看板)
  ├── 用户管理
  │   ├── 用户列表
  │   ├── 角色权限
  │   └── 审核管理
  ├── 项目管理
  │   ├── 项目列表
  │   ├── 项目审核
  │   └── 项目分类
  ├── 系统设置
  │   ├── 基本配置
  │   ├── 通知管理
  │   └── 数据备份
  └── 内容管理

平台功能
  ├── 资源中心
  ├── 社区
  └── 数据看板
```

**侧边栏视觉规范**:

- 渐变背景: `linear-gradient(180deg, #0F172A 0%, #1E293B 50%, #1E40AF 100%)`
- 菜单项文字: 白色 `#F8FAFC`
- 选中态: 背景 `rgba(255,255,255,0.08)` + 左侧 3px 品牌色 `#3B82F6` 指示条
- Hover: 背景色淡入 + 左侧指示条
- 折叠/展开: width 过渡 300ms ease
- 底部用户卡片: 头像 + 用户名 + 端标识胶囊标签

### 3.2 顶部导航 —— 浮动式设计

**目标文件**: `main-app/src/layouts/AppHeader.vue`

**设计方案**:

- 浮动式定位: `position: sticky; top: 16px; left: 16px; right: 16px; border-radius: 16px`
- 毛玻璃效果: `backdrop-blur-xl bg-white/80 shadow-lg`
- Logo文字颜色: 品牌蓝 `#1E40AF`
- 当前端标识: 蓝色胶囊标签（如"学生端""融资端"）
- 水平菜单: AI 智聊 / 方案生成 / 协作空间
- 用户区域: 头像 + 用户名下拉菜单

### 3.3 主布局调整

**目标文件**: `main-app/src/layouts/MainLayout.vue`

- 内容区域顶部留白: `padding-top: 80px`（适配浮动导航）
- 背景色: `#F8FAFC`
- 页面切换过渡动画: fade + translateY，400ms

### 3.4 路由配置更新

**目标文件**: `main-app/src/router/index.ts`

**新增路由**:

| 路径                  | 名称         | 端     | 说明           |
| --------------------- | ------------ | ------ | -------------- |
| `/invest`             | Invest       | 融资端 | 融资对接       |
| `/invest/manage`      | InvestManage | 融资端 | 融资管理       |
| `/expert-review`      | ExpertReview | 专家端 | 专家评审       |
| `/expert-review/history` | ReviewHistory | 专家端 | 评审历史     |
| `/admin`              | Admin        | 管理端 | 管理后台总览   |
| `/admin/users`        | AdminUsers   | 管理端 | 用户管理       |
| `/admin/projects`     | AdminProjects | 管理端 | 项目管理      |
| `/admin/settings`     | AdminSettings | 管理端 | 系统设置      |
| `/admin/notifications`| AdminNotif   | 管理端 | 通知管理       |

**登录后跳转逻辑**:

```
学生端 → /dashboard (AI数字员工首页)
融资端 → /invest (融资对接)
专家端 → /expert-review (专家评审)
管理端 → /admin (管理后台)
```

### 3.5 用户状态管理更新

**目标文件**: `main-app/src/stores/user.ts`

**UserInfo 接口新增字段**:

```typescript
interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  role: string;
  username: string;
  avatar: string;
  roles: string[];
  portal?: 'student' | 'investor' | 'expert' | 'admin';  // 新增
}
```

---

## 阶段四：页面与组件深度设计

### 4.0 学生端欢迎信弹窗 (LetterModal)

**目标文件**: `main-app/src/components/LetterModal.vue`

**功能**: 学生端首次登录后，在首页弹出全屏模态弹窗，展示"致青年OPC创业者：以AI为刃，赴时代之约"信件内容。用户可通过右上角关闭按钮或底部"我已阅读，开始探索"按钮关闭弹窗。

**触发条件**:

- 仅学生端（`portal === 'student'`）登录后触发
- 使用 `sessionStorage` 记录 `letter-read` 状态
- 同一会话内只弹一次，刷新页面不再弹出
- 在 `HomeView.vue` 中通过 `v-if="showLetter"` 控制显示

**页面布局**:

```
┌──────────────────────────────────────────┐
│  (毛玻璃遮罩层 backdrop-blur 8px)        │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │                    [✕ 关闭按钮]  │    │
│  │                                  │    │
│  │  ◇ ───── ◇ ───── ◇             │    │
│  │                                  │    │
│  │  致青年OPC创业者：               │    │
│  │  以AI为刃，赴时代之约            │    │
│  │                                  │    │
│  │  亲爱的青年OPC创业者们：         │    │
│  │                                  │    │
│  │  展信安！当工业数字化的浪潮...    │    │
│  │  (信件正文，可滚动)              │    │
│  │                                  │    │
│  │  愿山河无恙，产业兴旺...         │    │
│  │                                  │    │
│  │              一名同行者           │    │
│  │          写于工业革新之时         │    │
│  │                                  │    │
│  │  ◇ ───── ◇ ───── ◇             │    │
│  │                                  │    │
│  │     [ 我已阅读，开始探索 → ]     │    │
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

**视觉设计**:

- **遮罩层**: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(8px)`
- **信纸背景**: 米黄渐变 `linear-gradient(180deg, #FFFEF7, #FFF9EC, #FFF5E0)`
- **信纸装饰**: 左侧红色竖线 `rgba(220,80,60,0.15)`，顶部/底部菱形装饰
- **信纸阴影**: 多层阴影 `0 0 0 1px rgba(180,140,80,0.15), 0 4px 24px rgba(0,0,0,0.2), 0 16px 48px rgba(0,0,0,0.15)`
- **圆角**: 信纸 `16px`，按钮 `12px`，关闭按钮 `50%`（圆形）
- **最大宽度**: `680px`，最大高度 `90vh`，内容超出可滚动

**排版规范**:

| 元素     | 字号   | 字重 | 颜色       | 其他               |
| -------- | ------ | ---- | ---------- | ------------------ |
| 标题     | 22px   | 700  | `#2C1810`  | 居中，letter-spacing 2px |
| 称呼     | 14.5px | 500  | `#3D2B1F`  | 无缩进             |
| 正文     | 14.5px | 400  | `#3D2B1F`  | text-indent 2em，line-height 2 |
| 祝福语   | 14.5px | 500  | `#8B4513`  | 无缩进             |
| 结语     | 14.5px | 500  | `#8B4513`  | 居中               |
| 署名     | 14.5px | 400  | `#6B5344`  | 右对齐，italic     |
| 署名作者 | 14.5px | 600  | `#4A3728`  | 右对齐，非italic   |
| 署名日期 | 13px   | 400  | `#6B5344`  | 右对齐             |

**交互设计**:

| 操作           | 效果                                     | 时长  |
| -------------- | ---------------------------------------- | ----- |
| 弹窗出现       | 遮罩淡入 + 信纸从 scale(0.9) 放大到 1    | 400ms |
| 点击遮罩       | 关闭弹窗                                 | 300ms |
| 点击关闭按钮   | 按钮旋转 90° + 关闭弹窗                  | 300ms |
| 点击底部按钮   | 关闭弹窗                                 | 300ms |
| 弹窗消失       | 遮罩淡出 + 信纸缩小到 scale(0.95)        | 300ms |
| 关闭按钮 hover | 背景变亮 + 旋转 90°                      | 200ms |
| 底部按钮 hover | translateY(-2px) + 阴影加深              | 300ms |

**动效缓动**: `cubic-bezier(0.4, 0, 0.2, 1)`

**Vue 组件实现** (`LetterModal.vue`):

```vue
<template>
  <Teleport to="body">
    <Transition name="letter-modal">
      <div v-if="visible" class="letter-overlay" @click.self="handleClose">
        <div class="letter-container">
          <!-- 关闭按钮 -->
          <button class="letter-close" @click="handleClose" title="关闭">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- 信件主体 -->
          <div class="letter-paper">
            <div class="letter-header-deco">
              <div class="deco-line"></div>
              <div class="deco-diamond"></div>
              <div class="deco-line"></div>
            </div>

            <h1 class="letter-title">致青年OPC创业者：以AI为刃，赴时代之约</h1>

            <div class="letter-body">
              <p class="letter-greeting">亲爱的青年OPC创业者们：</p>
              <p>展信安！当工业数字化的浪潮席卷天地，当"万物互联"的号角响彻山河，
                你们以青春为炬，以初心为帆，手握OPC这把"工业通用钥匙"，
                毅然闯入智能制造的无垠旷野，在破界与革新中，
                书写着属于青年创客的滚烫篇章。</p>
              <!-- ... 完整信件内容 ... -->
              <p class="letter-closing">
                愿山河无恙，产业兴旺，愿你们落笔皆成章，前行皆坦途！</p>
              <p class="letter-signature">
                致每一位心怀梦想、勇毅前行的青年OPC创业者！<br />
                <span class="sign-author">一名同行者</span><br />
                <span class="sign-date">写于工业革新之时</span>
              </p>
            </div>

            <div class="letter-footer-deco">
              <div class="deco-line"></div>
              <div class="deco-diamond"></div>
              <div class="deco-line"></div>
            </div>
          </div>

          <div class="letter-actions">
            <button class="btn-close" @click="handleClose">
              我已阅读，开始探索
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{ close: [] }>()
const visible = ref(false)

onMounted(() => {
  setTimeout(() => { visible.value = true }, 500)
})

const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>
```

**在 HomeView 中集成**:

```vue
<template>
  <div class="home-view">
    <!-- 学生端首次登录弹窗 -->
    <LetterModal v-if="showLetter" @close="handleLetterClose" />
    <!-- ... 原有内容 ... -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import LetterModal from '@/components/LetterModal.vue'

const userStore = useUserStore()
const showLetter = ref(false)

onMounted(() => {
  const hasReadLetter = sessionStorage.getItem('letter-read')
  if (userStore.portal === 'student' && !hasReadLetter) {
    showLetter.value = true
  }
})

const handleLetterClose = () => {
  showLetter.value = false
  sessionStorage.setItem('letter-read', 'true')
}
</script>
```

**关键样式**:

```css
/* 信纸背景 */
.letter-paper {
  background: linear-gradient(180deg, #FFFEF7 0%, #FFF9EC 50%, #FFF5E0 100%);
  border-radius: 16px;
  padding: 40px 48px 32px;
  box-shadow: 0 0 0 1px rgba(180,140,80,0.15),
              0 4px 24px rgba(0,0,0,0.2),
              0 16px 48px rgba(0,0,0,0.15);
}

/* 左侧红线装饰 */
.letter-paper::before {
  content: '';
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(220, 80, 60, 0.15);
}

/* 底部按钮 */
.btn-close {
  padding: 12px 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1E40AF, #3B82F6);
  color: #fff;
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.3);
}

/* 弹窗过渡 */
.letter-modal-enter-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.letter-modal-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.letter-modal-enter-from .letter-paper { transform: scale(0.9) translateY(30px); opacity: 0; }
.letter-modal-leave-to .letter-paper { transform: scale(0.95) translateY(10px); opacity: 0; }
```

### 4.1 AI 对话页统一改造 (ChatLayout)

**目标文件**: `react-ai-chat/src/components/ChatLayout.tsx`

**侧边栏对话列表**:

- 新对话按钮: 品牌色渐变背景 + 悬浮放大阴影
- 对话项: 圆角 10px，hover 背景 `slate-100/50`，选中态左侧品牌色边框
- 删除按钮: hover 时才显示，红色悬浮态
- 空状态: 精致插画占位 + 引导文案

**消息气泡区**:

- AI 消息: 左侧头像 + 毛玻璃卡片 `bg-white/60 dark:bg-slate-800/60 backdrop-blur-md`
- 用户消息: 右侧品牌色渐变卡片 `bg-gradient-to-br from-blue-600 to-blue-700 text-white`
- 消息间距: 16px
- 打字指示器: 三个跳动的圆点动画
- 代码块: 深色背景 + 语法高亮 + 复制按钮悬浮显示

**输入区域**:

- 固定底部，毛玻璃背景 `backdrop-blur-xl bg-white/80 dark:bg-slate-900/80`
- TextArea 圆角 16px，聚焦时品牌色边框 + 微光阴影
- 发送按钮: 品牌色圆形按钮，hover 放大 + 旋转图标
- 快捷操作栏: 悬浮在输入框上方，图标按钮组

### 4.2 军师AI (SageAI) 面板设计

**目标文件**: `src/pages/SageAI.tsx`, `src/components/sage/*.tsx`

**创业规划面板** (`EntrepreneurshipPlanning.tsx`):

- 步骤指示器: 水平进度条 + 圆形节点，已完成/当前/未到达三种状态
- 表单卡片: 白色背景 + 圆角 16px + 阴影，分组使用折叠面板
- 数据可视化: 使用 recharts + 统一配色
- 思维导图: 节点使用圆角矩形 + 品牌色边框 + 连接线动画

**六大创业方向功能块** (荧光紫卡片设计):

| 方向                   | 核心功能                                                     |
| ---------------------- | ------------------------------------------------------------ |
| 校园刚需服务类         | 资料整理售卖、文案代写优化、校园代办服务、证件照精修         |
| 自媒体 & 内容IP类      | 校园账号运营、短视频剪辑、自媒体接单、校园探店达人           |
| 技能接单类             | 设计类(PPT/简历/LOGO)、剪辑类、编程技术类、翻译类            |
| AI 衍生创业            | 提示词售卖、AI代做服务、AI绘画接单、网课AI整理               |
| 知识付费 & 教学类      | 线上家教、技能小班带练、资料社群                             |
| 轻电商无货源           | 拼多多/淘宝无货源、闲鱼二手倒卖、虚拟商品售卖                |
| 赛事 & 校园项目类      | 创业计划书、挑战杯/互联网+申报、商业项目策划、校园活动策划   |

**增长策略/营销计划/数据分析面板**:

- 统一使用卡片式布局 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- KPI 指标卡片: 顶部图标 + 大数字 + 趋势箭头 + 底部描述
- 图表容器: 统一圆角 16px + 内边距 + 标题栏

### 4.3 探路者AI (ScoutAI) 面板设计

**目标文件**: `src/pages/ScoutAI.tsx`, `src/components/scout/*.tsx`

- 供应商搜索: 搜索框居中，大圆角，带放大镜图标和快捷键提示
- 投资商选调: 卡片方式展示，点击查看详情，个人投资者显示合作微信
- 结果列表: 卡片式布局，每项带品牌logo占位、评分星级、标签组
- 资源对比: 并排对比表格，差异项高亮显示
- 市场分析: 大型数据卡片 + 趋势图 + 关键洞察标签

### 4.4 工匠AI (MakerAI) 面板设计

**目标文件**: `src/pages/MakerAI.tsx`, `src/components/maker/*.tsx`

- 工作台 (`WorkBoard.tsx`): 看板式布局，列使用毛玻璃背景，卡片可拖拽，九个模块点击跳转执行流程
- 内容生成 (`ContentGenerationPanel.tsx`): 左侧参数配置 + 右侧实时预览，分栏比例 1:2

### 4.5 管家AI (ButlerAI) 面板设计

**目标文件**: `src/pages/ButlerAI.tsx`, `src/components/butler/*.tsx`

- 数据看板: 网格布局的 KPI 卡片 + 图表区域
- 售后服务: 工单列表带状态标签（待处理/处理中/已解决），不同状态不同颜色
- FAQ 面板: 手风琴式折叠，搜索框置顶
- 反馈面板: 评分星级组件 + 文本框 + 提交按钮
- 创业监管: 创业历程数据可视化总结，实时生成报告，投资情况交互卡片展示

### 4.6 Vue 子应用页面设计

| 子应用              | 设计要点                                                     |
| ------------------- | ------------------------------------------------------------ |
| vue-user (用户中心) | 个人资料卡片、会员等级进度条、订单列表时间线                 |
| vue-resource (资源) | 搜索页大标题 + 筛选侧边栏 + 资源卡片网格                    |
| vue-dashboard (看板) | 专业图表布局，暗蓝色主题，数字和文字亮度提高                  |
| vue-community (社区) | 帖子卡片（头像、标题、摘要、互动按钮）、发布页富文本编辑器   |
| react-collab (协作) | 在线用户头像组、实时光标、协作工具栏                         |
| react-bp-gen (方案) | 章节导航侧边栏 + 编辑器区域 + AI 批注悬浮框                 |

---

## 阶段五：主题系统深度重构

### 5.1 深色模式

**背景层级**:

| 层级   | 色值       | 用途         |
| ------ | ---------- | ------------ |
| 最深   | `#020617`  | 页面底       |
| 深     | `#0F172A`  | 主内容区     |
| 中     | `#1E293B`  | 卡片、面板   |
| 浅     | `#334155`  | 输入框、hover |

**文字层级**: 主标题 `#F8FAFC` / 正文 `#E2E8F0` / 次要 `#94A3B8` / 禁用 `#64748B`

**毛玻璃**: `bg-slate-800/60 backdrop-blur-xl border border-slate-700/50`

### 5.2 浅色模式

**背景层级**: 页面 `#F8FAFC` / 卡片 `#FFFFFF` / 悬浮 `#F1F5F9`

**文字层级**: 主标题 `#0F172A` / 正文 `#334155` / 次要 `#64748B` / 禁用 `#94A3B8`

**毛玻璃**: `bg-white/80 backdrop-blur-xl border border-white/20`

### 5.3 主题切换动效

- 切换按钮: 太阳/月亮图标旋转过渡
- 页面背景色过渡: `transition-colors duration-500`
- 卡片颜色过渡: `transition-colors duration-300`
- 使用 React Context / Vue Pinia 统一管理主题状态

---

## 阶段六：交互与动效设计

### 6.1 微交互规范

| 元素   | 触发     | 效果                          | 时长  |
| ------ | -------- | ----------------------------- | ----- |
| 按钮   | hover    | 背景色加深 + 阴影放大         | 200ms |
| 按钮   | active   | scale(0.97)                   | 100ms |
| 卡片   | hover    | translateY(-2px) + 阴影加深   | 200ms |
| 链接   | hover    | 下划线从左滑入                | 200ms |
| 菜单项 | hover    | 背景色淡入 + 左侧指示条       | 150ms |
| 输入框 | focus    | 品牌色边框 + 外发光           | 200ms |
| 开关   | toggle   | 滑块移动 + 背景色渐变         | 200ms |
| 加载   | 异步操作 | 骨架屏 pulse 或品牌色 spinner | 持续  |
| 通知   | 出现     | 从右侧滑入 + 淡入             | 300ms |
| 模态框 | 打开     | 背景淡入 + 内容从下方滑入     | 300ms |

### 6.2 页面转场动画

- 使用 Framer Motion (React) / Vue Transition (Vue)
- 页面切换: 淡入淡出 + 轻微向上滑动
- 列表项进入: stagger 延迟，每项间隔 50ms
- 模态框/抽屉: 背景遮罩 fade-in，内容 slide-up

### 6.3 滚动行为

- 平滑滚动: `scroll-behavior: smooth`
- 回到顶部: 悬浮按钮，hover 放大
- 滚动触发动画: 元素进入视口时 fade-in + translateY

### 6.4 可访问性动效

- 尊重 `prefers-reduced-motion`
- 减少动效模式下: 禁用转场动画，仅保留必要的透明度变化

---

## 阶段七：响应式设计

### 7.1 断点规范

| 断点 | 宽度    | 说明               |
| ---- | ------- | ------------------ |
| xs   | < 640px | 手机竖屏，单列布局 |
| sm   | 640px+  | 手机横屏/小平板    |
| md   | 768px+  | 平板，侧边栏可折叠 |
| lg   | 1024px+ | 小桌面，双栏布局   |
| xl   | 1280px+ | 标准桌面，完整布局 |
| 2xl  | 1536px+ | 大屏，增加间距     |

### 7.2 移动端适配重点

- 侧边栏改为抽屉式 (Drawer)，汉堡菜单触发
- 底部固定操作栏（输入发送等）
- 卡片全宽，减少内边距
- 表格改为卡片列表或横向滚动
- 触摸目标最小 44px

---

## 阶段八：组件库与代码规范

### 8.1 封装通用 UI 组件

在 `react-ai-chat/src/components/ui/` 和 Vue 子应用对应目录中封装：

| 组件             | 说明                       |
| ---------------- | -------------------------- |
| `GlassCard`      | 毛玻璃卡片容器             |
| `GradientButton` | 渐变按钮（主/次/危险/幽灵） |
| `IconButton`     | 图标按钮（圆形/方形）       |
| `StatusBadge`    | 状态标签（多种语义色）      |
| `KpiCard`        | KPI 指标卡片               |
| `EmptyState`     | 空状态占位                 |
| `SkeletonCard`   | 骨架屏卡片                 |
| `AnimatedNumber` | 数字滚动动画               |
| `TypingIndicator`| 打字指示器                 |
| `CodeBlock`      | 代码块（带复制）           |
| `ThemeToggle`    | 主题切换按钮               |
| `TextType`       | 打字机文字动画             |

### 8.2 CSS 架构

- 使用 Tailwind CSS 工具类为主
- 复杂组件使用 CSS Modules / scoped style
- 全局变量使用 CSS 自定义属性: `--color-primary`, `--bg-card` 等
- Ant Design / Naive UI 主题通过 ConfigProvider 覆盖

---

## 执行优先级

### P0 (最高优先级)

1. 建立 TextType 入场动画组件
2. 建立全局 Design Tokens 文件
3. 登录页四端切换功能实现
4. 统一图标系统（替换 emoji，引入 Lucide）
5. 深色/浅色主题系统重构

### P1 (高优先级)

1. 侧边栏根据角色动态菜单实现
2. 封装通用 UI 组件（GlassCard, GradientButton, StatusBadge 等）
3. 改造 SageAI / ScoutAI / MakerAI / ButlerAI 核心面板
4. Vue 主应用布局统一改造
5. 微交互与动效系统实现

### P2 (中优先级)

1. Vue 子应用（vue-user, vue-resource, vue-dashboard, vue-community）样式统一
2. react-collab / react-bp-gen 样式改造
3. 响应式移动端适配
4. 可访问性优化（aria-label, focus trap, 键盘导航）

### P3 (低优先级)

1. 页面转场动画优化
2. 滚动触发动画
3. 性能优化（will-change, GPU 加速）
4. 设计系统文档化

---

## 交付检查清单

### 视觉质量

- [ ] 无 emoji 作为图标（全部替换为 Lucide SVG）
- [ ] 所有图标统一 24x24 viewBox
- [ ] Hover 态不引起布局偏移
- [ ] 品牌 Logo 正确显示

### 交互

- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] Hover 态有明显视觉反馈
- [ ] 过渡动画平滑（150-300ms）
- [ ] Focus 态可见（键盘导航可用）

### 主题

- [ ] 浅色模式文字对比度 >= 4.5:1
- [ ] 深色模式文字对比度 >= 4.5:1
- [ ] 毛玻璃元素在两种模式下都可见
- [ ] 边框在两种模式下都可见

### 布局

- [ ] 浮动元素距边缘有间距
- [ ] 无内容被固定导航遮挡
- [ ] 响应式: 375px, 768px, 1024px, 1440px 无水平滚动

### 四端切换

- [ ] 登录页四端Tab可正常切换
- [ ] 不同端登录后跳转到正确页面
- [ ] 侧边栏根据角色显示对应菜单
- [ ] 顶部导航显示当前端标识

### 入场动画

- [ ] 首次打开显示打字机动画
- [ ] 动画文字正确显示
- [ ] "进入平台"按钮在动画完成后出现
- [ ] 点击后平滑过渡到登录页

### 可访问性

- [ ] 所有图片有 alt 文本
- [ ] 表单输入有关联 label
- [ ] 颜色不是唯一的状态指示器
- [ ] 支持 `prefers-reduced-motion`

---

## 工具与依赖

### 新增依赖（按需）

**React 子应用**:

- `gsap` —— 入场动画引擎
- `lucide-react` —— 图标库
- `framer-motion` —— 动效库
- `clsx` + `tailwind-merge` —— 类名管理

**Vue 子应用**:

- `lucide-vue-next` —— 图标库
- `@vueuse/motion` —— 动效库

### 设计参考

- 风格: Glassmorphism（毛玻璃）+ 专业 SaaS
- 色彩: 专业蓝 `#1E40AF` + 创业绿 `#22C55E`
- 字体: Poppins + Inter + Noto Sans CJK SC
- 效果: backdrop blur 10-20px, 微妙边框, Z-depth
