/**
 * Scout 面板标题区组件
 * 支持三种变体：command（指挥舱）/ library（图书馆）/ workbench（工作台）
 */
import React from 'react';
import { Avatar, Row, Col } from 'antd';
import { useTheme } from '../../../contexts/ThemeContext';
import { panelThemes } from './scout-panel-theme';
import './scout-animations.css';

interface ScoutPanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  variant: 'command' | 'library' | 'workbench';
  stats: Array<{ label: string; value: string | number }>;
  themeKey: string;
  children?: React.ReactNode;
  extra?: React.ReactNode;
}

const ScoutPanelHeader: React.FC<ScoutPanelHeaderProps> = ({
  icon,
  title,
  subtitle,
  variant,
  stats,
  themeKey,
  children,
  extra,
}) => {
  const { isDarkMode } = useTheme();
  const theme = panelThemes[themeKey] || panelThemes.market;

  const headerBg = isDarkMode ? theme.gradient : theme.gradientLight;
  const textColor = isDarkMode ? '#fff' : '#1E293B';
  const subColor = isDarkMode ? 'rgba(255,255,255,0.75)' : '#64748B';
  const statBg = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)';
  const statValueColor = isDarkMode ? '#fff' : theme.accentDark;
  const statLabelColor = isDarkMode ? 'rgba(255,255,255,0.75)' : '#64748B';

  if (variant === 'library') {
    return (
      <div style={{ background: headerBg, padding: '24px 20px 20px', position: 'relative' }}>
        <div style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <Avatar
              size={36}
              style={{ background: isDarkMode ? 'rgba(255,255,255,0.15)' : theme.accentColor, color: '#fff' }}
              icon={icon}
            />
            <div style={{ marginLeft: 12 }}>
              <div style={{ color: textColor, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
            </div>
          </div>
          <div style={{
            width: 48, height: 3, borderRadius: 2,
            background: theme.accentColor, margin: '8px 0 6px 0',
          }} />
          <div style={{ color: subColor, fontSize: 13, marginBottom: 16 }}>{subtitle}</div>
          <Row gutter={12}>
            {stats.map((s, i) => (
              <Col span={Math.floor(24 / stats.length)} key={i}>
                <div style={{
                  background: statBg, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                  backdropFilter: 'blur(8px)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
                }}>
                  <div style={{ color: statValueColor, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: statLabelColor, fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
        {children}
      </div>
    );
  }

  if (variant === 'workbench') {
    return (
      <div style={{ background: headerBg, padding: '20px 20px 16px', position: 'relative', overflow: 'hidden' }}>
        {/* 装饰性背景圆 */}
        <div style={{
          position: 'absolute', top: -30, right: -20, width: 120, height: 120,
          borderRadius: '50%', background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.06)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                size={38}
                style={{ background: isDarkMode ? 'rgba(255,255,255,0.15)' : theme.accentColor, color: '#fff' }}
                icon={icon}
              />
              <div style={{ marginLeft: 12 }}>
                <div style={{ color: textColor, fontSize: 18, fontWeight: 700 }}>{title}</div>
                <div style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{subtitle}</div>
              </div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {extra}
          </div>
        </div>
        <Row gutter={12}>
          {stats.map((s, i) => (
            <Col span={Math.floor(24 / stats.length)} key={i}>
            <div style={{
              background: statBg, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
              backdropFilter: 'blur(8px)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
            }}>
              <div style={{ color: statValueColor, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: statLabelColor, fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          </Col>
            ))}
          </Row>
        {children}
      </div>
    );
  }

  // command variant (default)
  return (
    <div style={{ background: headerBg, padding: '20px 20px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* 网格背景纹理 */}
      <div className="grid-bg" style={{
        position: 'absolute', inset: 0, opacity: isDarkMode ? 0.15 : 0.05, pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <Avatar
            size={40}
            style={{ background: isDarkMode ? 'rgba(255,255,255,0.15)' : theme.accentColor, color: '#fff' }}
            icon={icon}
          />
          <div style={{ marginLeft: 12, flex: 1 }}>
            <div style={{ color: textColor, fontSize: 18, fontWeight: 700 }}>{title}</div>
            <div style={{ color: subColor, fontSize: 13 }}>{subtitle}</div>
          </div>
          {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
        </div>
        {children}
        <Row gutter={12} style={{ marginTop: 14 }}>
          {stats.map((s, i) => (
            <Col span={Math.floor(24 / stats.length)} key={i}>
              <div style={{
                background: statBg, borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                backdropFilter: 'blur(8px)', border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
              }}>
                <div style={{ color: statValueColor, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: statLabelColor, fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default ScoutPanelHeader;
