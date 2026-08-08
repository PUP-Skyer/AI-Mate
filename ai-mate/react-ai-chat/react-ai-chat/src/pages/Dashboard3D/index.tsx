/**
 * 3D 沉浸式 AI 行业资讯数据看板（高德地图 3D 实景）
 * 高德地图 JS API 2.0 + 主题驱动
 * 布局：顶部4卡片横排 | 左下3D地图面板(大) | 右下2卡片纵排
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAIStore } from '../../store/aiStore';
import { getDashboardTheme } from './dashboard-theme';
import type { DashboardTheme } from './dashboard-theme';
import {
  ReportCountCard,
  AIPolicyCard,
  IndustryDataCard,
  TimelineCard,
  PenetrationChartCard,
  ToolLibraryCard,
} from './Panels';
import './dashboard-animations.css';

// ─── 高德地图配置 ────────────────────────────────────────
const AMAP_KEY = '2db9d1f563beecc84b3ecc07aa472730';
const AMAP_SECURITY_CODE = 'b34a44a884ff78a01cab45ee21480495';
/** 杭州西湖坐标 */
const HANGZHOU_CENTER: [number, number] = [120.153576, 30.287459];

// AMap 全局类型声明
declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: { securityJsCode: string };
  }
}

const Dashboard3D: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mapInitRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const theme = useAIStore((s) => s.settings.theme);
  const isDark = theme === 'dark';
  const t: DashboardTheme = getDashboardTheme(isDark);

  // ── 加载高德地图脚本（仅一次） ──────────────────────────
  useEffect(() => {
    window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };

    if (window.AMap) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById('amap-script');
    if (existing) {
      existing.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'amap-script';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── 初始化地图（脚本加载后仅创建一次） ────────────────────
  useEffect(() => {
    if (!scriptLoaded || !sceneContainerRef.current || !window.AMap || mapInitRef.current) return;

    mapInitRef.current = true;

    const map = new window.AMap.Map(sceneContainerRef.current, {
      zoom: 18,                        // ≥17 才会加载3D建筑模型，18效果更佳
      center: HANGZHOU_CENTER,
      viewMode: '3D',                 // 3D视图核心开关
      pitch: 65,                      // 倾斜角度，越大越立体
      rotation: -15,                  // 初始旋转角度
      buildingAnimation: true,        // 建筑物"生长"动画
      showBuildingBlock: true,        // 关键：显示3D建筑体块
      mapStyle: isDark ? 'amap://styles/dark' : 'amap://styles/normal',
      features: ['bg', 'road', 'building'],
      resizeEnable: true,
    });

    map.on('complete', () => setMapReady(true));
    map.on('dragstart', () => setIsDragging(true));
    map.on('dragend', () => setIsDragging(false));

    // 显式添加3D建筑图层，放大建筑高度增强立体感
    const buildingsLayer = new window.AMap.Buildings({
      zooms: [16, 20],
      heightFactor: 2,                // 楼层高度放大因子，让建筑更高更醒目
      visible: true,
    });
    map.add(buildingsLayer);

    // 添加3D控制条插件（缩放/倾斜/旋转）
    window.AMap.plugin(['AMap.ControlBar'], () => {
      const controlBar = new window.AMap.ControlBar({
        position: { right: '10px', top: '30px' },
        showControlButton: false,
      });
      map.addControl(controlBar);
    });

    mapRef.current = map;
  }, [scriptLoaded, isDark]);

  // ── 主题切换时更新地图样式 ──────────────────────────────
  useEffect(() => {
    if (mapRef.current && mapInitRef.current) {
      mapRef.current.setMapStyle(isDark ? 'amap://styles/dark' : 'amap://styles/normal');
    }
  }, [isDark]);

  // ── 组件卸载时销毁地图 ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const bgGradient = isDark
    ? 'linear-gradient(180deg, #1a1510 0%, #15120e 50%, #0f0a06 100%)'
    : 'linear-gradient(180deg, #e8e2d8 0%, #e0d8cc 50%, #e8e2d8 100%)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: bgGradient,
      }}
    >
      {isDark && <div className="dash-crt-overlay" />}
      {isDark && <div className="dash-scanline-overlay" />}

      {/* 卡片层 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* 顶部：4张卡片横排 */}
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            pointerEvents: 'auto',
            alignItems: 'flex-start',
          }}
        >
          <FloatCard delay={0.15} isDark={isDark} t={t}>
            <ReportCountCard />
          </FloatCard>
          <FloatCard delay={0.25} isDark={isDark} t={t}>
            <AIPolicyCard />
          </FloatCard>
          <FloatCard delay={0.35} isDark={isDark} t={t}>
            <IndustryDataCard />
          </FloatCard>
          <FloatCard delay={0.45} isDark={isDark} t={t}>
            <TimelineCard />
          </FloatCard>
        </div>

        {/* 右下：2张卡片纵排 — 与上方 AI 行业大事件对齐 */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            width: 'calc((100% - 54px) / 4)',
            top: '34%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            pointerEvents: 'auto',
          }}
        >
          <FloatCard delay={0.55} isDark={isDark} t={t} style={{ flex: 'none' }}>
            <PenetrationChartCard />
          </FloatCard>
          <FloatCard delay={0.65} isDark={isDark} t={t} style={{ flex: 'none' }}>
            <ToolLibraryCard />
          </FloatCard>
        </div>
      </div>

      {/* 3D 地图面板 — 左下角，右边缘与 AI 行业大事件左边缘对齐 */}
      <div
        ref={sceneContainerRef}
        style={{
          position: 'absolute',
          bottom: 8,
          left: 12,
          right: 'calc(16px + (100% - 54px) / 4)',
          top: '34%',
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${t.glassBorder}`,
          boxShadow: t.glassShadow,
          zIndex: 5,
          background: isDark
            ? 'rgba(15, 10, 6, 0.4)'
            : 'rgba(255, 252, 248, 0.3)',
        }}
      >
        {/* 面板标题 */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.textAccent,
              letterSpacing: 0.5,
              textShadow: isDark
                ? '0 0 8px rgba(255, 184, 77, 0.3)'
                : 'none',
            }}
          >
            3D 城市数字孪生 · 杭州实景
          </span>
        </div>

        {/* 加载提示 */}
        {!mapReady && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              color: t.textSecondary,
              fontSize: 12,
              pointerEvents: 'none',
            }}
          >
            正在加载3D实景建筑...
          </div>
        )}

        {/* 拖拽提示 */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            zIndex: 20,
            background: t.glassBg,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '3px 10px',
            borderRadius: 8,
            fontSize: 9,
            color: t.textSecondary,
            pointerEvents: 'none',
            border: `1px solid ${t.glassBorder}`,
          }}
        >
          {isDragging
            ? '拖拽中...'
            : '左键拖拽 · 滚轮缩放 · 右键旋转'}
        </div>
      </div>
    </div>
  );
};

// ─── 悬浮卡片包装器 ─────────────────────────────────────
const FloatCard: React.FC<{
  children: React.ReactNode;
  delay: number;
  isDark: boolean;
  t: DashboardTheme;
  style?: React.CSSProperties;
}> = ({ children, delay, isDark, t, style }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        minWidth: 0,
        ...style,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        const card = e.currentTarget.firstChild as HTMLElement;
        if (card) {
          card.style.boxShadow = t.glassHoverShadow;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        const card = e.currentTarget.firstChild as HTMLElement;
        if (card) {
          card.style.boxShadow = t.glassShadow;
        }
      }}
    >
      {isDark ? <div style={{ filter: 'drop-shadow(0 0 4px rgba(255, 184, 77, 0.08))' }}>{children}</div> : children}
    </div>
  );
};

export default Dashboard3D;
