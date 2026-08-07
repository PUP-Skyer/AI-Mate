/**
 * 通用 AI 生成表单组件
 * 输入表单 + 生成按钮 + 结果展示
 * variant="sage" 启用军师AI 分区布局；variant="maker" 启用工匠AI 分区布局（默认保持通用样式）
 */

import React, { useState, useRef } from 'react';
import { Input, Button, Form, Spin, Typography, Card } from 'antd';
import { SendOutlined, DownloadOutlined } from '@ant-design/icons';
import { chatWithZhipu } from '../services/aiService';
import { useAIStore } from '../store/aiStore';
import { useI18n } from '../i18n';
import { SAGE_THEMES, SAGE_FONT_SERIF, type SageTheme, type SageThemeKey } from './sage/sage-theme';
import './sage/sage-animations.css';
import { SageSection } from './sage/shared';
import { MAKER_THEMES, MAKER_FONT_SERIF, type MakerTheme, type MakerThemeKey } from './maker/maker-theme';
import './maker/maker-animations.css';
import { MakerSection } from './maker/shared';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface AIGeneratorFormProps {
  title: string;
  systemPrompt: string;
  fields: { name: string; label: string; placeholder: string; required?: boolean }[];
  resultTitle: string;
  generateLabel?: string;
  /** 'sage' 军师AI / 'maker' 工匠AI 分区布局；缺省为通用样式 */
  variant?: 'sage' | 'maker';
  /** 军师主题 key（variant="sage" 时生效） */
  sageTheme?: SageThemeKey;
  /** 工匠主题 key（variant="maker" 时生效） */
  makerTheme?: MakerThemeKey;
  /** 自定义结果渲染器：将 AI 返回的 Markdown 渲染为分区卡片 */
  resultRenderer?: (
    result: string,
    ctx: { theme: SageTheme; isDark: boolean; handleDownload: () => void }
  ) => React.ReactNode;
  /** 内置示例内容：提供时显示"查看示例"按钮，点击直接展示（无需调用 AI） */
  demoContent?: string;
  /** 示例按钮文字，默认"查看示例" */
  demoLabel?: string;
  /** 可选：生成成功后持久化到 localStorage 的 key（如 'ai-mate-sage-requirements-report'），不传则不持久化 */
  persistKey?: string;
  /** 额外内容：渲染在结果区域之后，独立于文档生成结果（如3D卡片堆） */
  extraContent?: React.ReactNode;
}

const AIGeneratorForm: React.FC<AIGeneratorFormProps> = ({
  title,
  systemPrompt,
  fields,
  resultTitle,
  generateLabel,
  variant,
  sageTheme = 'requirements',
  makerTheme = 'ppt',
  resultRenderer,
  demoContent,
  demoLabel,
  persistKey,
  extraContent,
}) => {
  const [form] = Form.useForm();
  const { t } = useI18n();
  const generateText = generateLabel ?? t('aiGen.generate');
  const demoText = demoLabel ?? t('aiGen.viewDemo');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const resultRef = useRef('');

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme: SageTheme = SAGE_THEMES[sageTheme];

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    setResult('');
    resultRef.current = '';

    const userContent = Object.entries(values)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: userContent }],
        { system_prompt: systemPrompt }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setResult(content);
      if (persistKey) {
        try {
          localStorage.setItem(
            persistKey,
            JSON.stringify({ inputs: values, result: content, updatedAt: Date.now() })
          );
        } catch {
          // 静默失败
        }
      }
    } catch {
      setResult(t('aiGen.generateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 军师AI 分区式渲染 ──────────────────────────────────

  if (variant === 'sage') {
    const textColor = isDark ? theme.textDark : theme.textLight;
    const borderColor = isDark ? theme.borderDark : theme.borderLight;

    return (
      <div
        className="sage-grid-bg sage-paper-noise"
        style={{
          padding: 16,
          background: isDark ? theme.bgDark : theme.bgLight,
          borderRadius: 12,
          minHeight: '100%',
          '--sage-grid-line': isDark ? theme.glowColor : 'rgba(120,100,60,0.05)',
        } as React.CSSProperties}
      >
        {/* 面板头部：案号徽章 + 标题 */}
        <div
          className="sage-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            background: isDark ? theme.gradient : theme.gradientLight,
            marginBottom: 16,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: theme.sealColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SAGE_FONT_SERIF,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              boxShadow: `0 0 12px ${theme.glowColor}`,
              flexShrink: 0,
            }}
          >
            {theme.caseNo}
          </div>
          <div>
            <div
              style={{
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: isDark ? theme.textDark : theme.textLight,
                letterSpacing: 2,
              }}
            >
              {theme.title}
            </div>
            <div
              style={{
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 11,
                color: theme.accentColor,
                letterSpacing: 3,
                opacity: 0.85,
              }}
            >
              STRATEGY SANDBOX
            </div>
          </div>
        </div>

        {/* 分区1：军情设定 */}
        <SageSection title={t('aiGen.intelSetup')} subtitle="INTEL SETUP" theme={theme} isDark={isDark} stagger={1}>
          <Form form={form} layout="vertical">
            {fields.map((f) => (
              <Form.Item
                key={f.name}
                name={f.name}
                label={
                  <span style={{ fontFamily: SAGE_FONT_SERIF, color: textColor, fontSize: 13 }}>
                    {f.label}
                  </span>
                }
                rules={f.required !== false ? [{ required: true, message: t('aiGen.required', { label: f.label }) }] : []}
              >
                {f.name.includes('desc') || f.name.includes('content') || f.name.includes('intro') ? (
                  <TextArea
                    rows={3}
                    placeholder={f.placeholder}
                    style={{
                      background: isDark ? theme.surfaceDark : '#fff',
                      borderColor: borderColor,
                      color: textColor,
                      borderRadius: 8,
                      fontFamily: SAGE_FONT_SERIF,
                    }}
                  />
                ) : (
                  <Input
                    placeholder={f.placeholder}
                    style={{
                      background: isDark ? theme.surfaceDark : '#fff',
                      borderColor: borderColor,
                      color: textColor,
                      borderRadius: 8,
                      height: 36,
                      fontFamily: SAGE_FONT_SERIF,
                    }}
                  />
                )}
              </Form.Item>
            ))}
            <Form.Item style={{ marginBottom: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                className="sage-seal-btn"
                type="primary"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={loading}
                style={{
                  background: theme.sealColor,
                  border: 'none',
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontFamily: SAGE_FONT_SERIF,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 3,
                  boxShadow: `0 4px 14px ${theme.glowColor}`,
                }}
              >
                {generateText}
              </Button>
            </Form.Item>
          </Form>
        </SageSection>

        {/* 分区2：推演结果 */}
        {result && (
          <div style={{ marginTop: 16 }}>
            {resultRenderer ? (
              resultRenderer(result, { theme, isDark, handleDownload })
            ) : (
              <SageSection
                title={resultTitle}
                subtitle="RESULT"
                theme={theme}
                isDark={isDark}
                stagger={2}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 8,
                  }}
                >
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    size="small"
                    style={{
                      color: theme.accentColor,
                      fontFamily: SAGE_FONT_SERIF,
                      fontSize: 12,
                    }}
                  >
                    {t('aiGen.exportMarkdown')}
                  </Button>
                </div>
                <div
                  style={{
                    background: isDark ? 'rgba(0,0,0,0.25)' : '#FAF6EF',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    padding: '14px 16px',
                    maxHeight: 420,
                    overflow: 'auto',
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      whiteSpace: 'pre-wrap',
                      fontFamily: SAGE_FONT_SERIF,
                      lineHeight: 1.9,
                      fontSize: 13.5,
                    }}
                  >
                    {result}
                  </Text>
                </div>
              </SageSection>
            )}
          </div>
        )}

        {/* 加载态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
            <Text style={{ display: 'block', marginTop: 12, color: textColor, fontFamily: SAGE_FONT_SERIF }}>
              {t('aiGen.sageLoading')}
            </Text>
          </div>
        )}
      </div>
    );
  }

  // ─── 工匠AI 分区式渲染 ──────────────────────────────────

  if (variant === 'maker') {
    const mTheme: MakerTheme = MAKER_THEMES[makerTheme];
    const mText = isDark ? mTheme.textDark : mTheme.textLight;
    const mBorder = isDark ? mTheme.borderDark : mTheme.borderLight;

    return (
      <div
        className="maker-grid-bg maker-paper-noise"
        style={{
          padding: 16,
          background: isDark ? mTheme.bgDark : mTheme.bgLight,
          borderRadius: 12,
          minHeight: '100%',
          '--maker-grid-line': isDark ? mTheme.glowColor : 'rgba(90,90,80,0.05)',
        } as React.CSSProperties}
      >
        {/* 面板头部：案号徽章 + 标题 */}
        <div
          className="maker-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            background: isDark ? mTheme.gradient : mTheme.gradientLight,
            marginBottom: 16,
            border: `1px solid ${mBorder}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: mTheme.sealColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MAKER_FONT_SERIF,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              boxShadow: `0 0 12px ${mTheme.glowColor}`,
              flexShrink: 0,
            }}
          >
            {mTheme.caseNo}
          </div>
          <div>
            <div
              style={{
                fontFamily: MAKER_FONT_SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: isDark ? mTheme.textDark : mTheme.textLight,
                letterSpacing: 2,
              }}
            >
              {mTheme.title}
            </div>
            <div
              style={{
                fontFamily: MAKER_FONT_SERIF,
                fontSize: 11,
                color: mTheme.accentColor,
                letterSpacing: 3,
                opacity: 0.85,
              }}
            >
              MAKER WORKSHOP
            </div>
          </div>
        </div>

        {/* 分区1：设定 */}
        <MakerSection title={t('aiGen.makerSection')} subtitle="SETUP" theme={mTheme} isDark={isDark} stagger={1}>
          <Form form={form} layout="vertical">
            {fields.map((f) => (
              <Form.Item
                key={f.name}
                name={f.name}
                label={
                  <span style={{ fontFamily: MAKER_FONT_SERIF, color: mText, fontSize: 13 }}>
                    {f.label}
                  </span>
                }
                rules={f.required !== false ? [{ required: true, message: t('aiGen.required', { label: f.label }) }] : []}
              >
                {f.name.includes('desc') || f.name.includes('content') || f.name.includes('intro') ? (
                  <TextArea
                    rows={3}
                    placeholder={f.placeholder}
                    style={{
                      background: isDark ? mTheme.surfaceDark : '#fff',
                      borderColor: mBorder,
                      color: mText,
                      borderRadius: 8,
                      fontFamily: MAKER_FONT_SERIF,
                    }}
                  />
                ) : (
                  <Input
                    placeholder={f.placeholder}
                    style={{
                      background: isDark ? mTheme.surfaceDark : '#fff',
                      borderColor: mBorder,
                      color: mText,
                      borderRadius: 8,
                      height: 36,
                      fontFamily: MAKER_FONT_SERIF,
                    }}
                  />
                )}
              </Form.Item>
            ))}
            <Form.Item style={{ marginBottom: 0, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {demoContent && (
                <Button
                  onClick={() => {
                    setResult(demoContent);
                    resultRef.current = demoContent;
                  }}
                  style={{
                    borderColor: mTheme.accentColor,
                    color: mTheme.accentColor,
                    borderRadius: 8,
                    height: 40,
                    paddingLeft: 18,
                    paddingRight: 18,
                    fontFamily: MAKER_FONT_SERIF,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {demoText}
                </Button>
              )}
              <Button
                className="maker-seal-btn"
                type="primary"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={loading}
                style={{
                  background: mTheme.sealColor,
                  border: 'none',
                  borderRadius: 8,
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontFamily: MAKER_FONT_SERIF,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 3,
                  boxShadow: `0 4px 14px ${mTheme.glowColor}`,
                }}
              >
                {generateText}
              </Button>
            </Form.Item>
          </Form>
        </MakerSection>

        {/* 分区2：结果 */}
        {result && (
          <div style={{ marginTop: 16 }}>
            {resultRenderer ? (
              resultRenderer(result, { theme: mTheme as unknown as SageTheme, isDark, handleDownload })
            ) : (
              <MakerSection title={resultTitle} subtitle="RESULT" theme={mTheme} isDark={isDark} stagger={2}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 8,
                  }}
                >
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    size="small"
                    style={{
                      color: mTheme.accentColor,
                      fontFamily: MAKER_FONT_SERIF,
                      fontSize: 12,
                    }}
                  >
                    {t('aiGen.exportMarkdown')}
                  </Button>
                </div>
                <div
                  style={{
                    background: isDark ? 'rgba(0,0,0,0.25)' : '#F7F7F5',
                    borderRadius: 8,
                    border: `1px solid ${mBorder}`,
                    padding: '14px 16px',
                    maxHeight: 420,
                    overflow: 'auto',
                  }}
                >
                  <Text
                    style={{
                      color: mText,
                      whiteSpace: 'pre-wrap',
                      fontFamily: MAKER_FONT_SERIF,
                      lineHeight: 1.9,
                      fontSize: 13.5,
                    }}
                  >
                    {result}
                  </Text>
                </div>
              </MakerSection>
            )}
          </div>
        )}

        {/* 加载态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
            <Text style={{ display: 'block', marginTop: 12, color: mText, fontFamily: MAKER_FONT_SERIF }}>
              {t('aiGen.makerLoading')}
            </Text>
          </div>
        )}

        {/* 额外内容（独立于生成结果，如3D卡片堆） */}
        {extraContent && (
          <div style={{ marginTop: 16 }}>
            {extraContent}
          </div>
        )}
      </div>
    );
  }

  // ─── 通用渲染（默认，maker/butler 保持原样） ─────────────

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        {title}
      </Title>
      <Form form={form} layout="vertical">
        {fields.map((f) => (
          <Form.Item
            key={f.name}
            name={f.name}
            label={f.label}
            rules={f.required !== false ? [{ required: true, message: t('aiGen.required', { label: f.label }) }] : []}
          >
            {f.name.includes('desc') || f.name.includes('content') || f.name.includes('intro') ? (
              <TextArea rows={3} placeholder={f.placeholder} />
            ) : (
              <Input placeholder={f.placeholder} />
            )}
          </Form.Item>
        ))}
        <Form.Item>
          <Button type="primary" icon={<SendOutlined />} onClick={handleGenerate} loading={loading}>
            {generateText}
          </Button>
        </Form.Item>
      </Form>

      {result && (
        <Card
          title={resultTitle}
          extra={
            <Button type="link" icon={<DownloadOutlined />} onClick={handleDownload}>
              {t('aiGen.exportMarkdown')}
            </Button>
          }
          style={{ marginTop: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Text style={{ whiteSpace: 'pre-wrap' }}>{result}</Text>
        </Card>
      )}
    </div>
  );
};

export default AIGeneratorForm;
