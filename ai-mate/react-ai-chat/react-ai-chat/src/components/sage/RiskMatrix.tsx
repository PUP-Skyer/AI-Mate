/**
 * 军师AI - 风险矩阵面板（案三 · 朱红）
 * 分区式结构：推演输入（需求报告+BMC来源）+ 2×2象限矩阵 + 风险卡片清单 + 应对策略报告
 * 动画：象限交错入场 / 高风险格脉动 / 印章CTA
 * 导出：PDF（打印）/ Word / Markdown
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button, Spin, Typography, Row, Col, Tag, Alert, Space } from 'antd';
import {
  SendOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';
import { SAGE_THEMES, SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import './sage-animations.css';
import './risk-print.css';
import { SageSection } from './shared';
import {
  RISK_SYSTEM_PROMPT,
  buildRiskUserContent,
  parseRiskMarkdown,
  type RiskLevel,
  type RiskMatrixData,
} from './risk-utils';
import {
  loadRequirementsReport,
  loadBMCData,
  loadRiskData,
  saveRiskData,
  type RequirementsReport,
} from './sage-storage';
import type { BMCData } from './bmc-utils';
import { BMC_DIMENSIONS } from './bmc-utils';
import RiskQuadrant from './RiskQuadrant';
import RiskCardList from './RiskCardList';
import { exportRiskPDF, exportRiskWord, exportRiskMarkdown, buildRiskReportHTML } from './risk-export';

const { Text } = Typography;

const RiskMatrix: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [riskData, setRiskData] = useState<RiskMatrixData | null>(() => {
    try { return loadRiskData(); } catch { return null; }
  });
  const [error, setError] = useState('');
  const [reportVersion, setReportVersion] = useState(0);
  const [activeLevel, setActiveLevel] = useState<RiskLevel | null>(null);

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme: SageTheme = SAGE_THEMES.risk;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  // 读取上游数据（reportVersion 变化时重新读取）
  const report: RequirementsReport | null = useMemo(() => {
    void reportVersion;
    return loadRequirementsReport();
  }, [reportVersion]);

  const bmcData: BMCData | null = useMemo(() => {
    void reportVersion;
    return loadBMCData();
  }, [reportVersion]);

  // 持久化
  useEffect(() => {
    if (riskData) saveRiskData(riskData);
  }, [riskData]);

  // 生成风险评估
  const handleGenerate = async () => {
    if (!report) {
      setError('请先在「需求分析」面板生成需求分析报告');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: buildRiskUserContent(report, bmcData) }],
        { system_prompt: RISK_SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      const parsed = parseRiskMarkdown(content, report.inputs.projectName || '未命名项目');
      setRiskData(parsed);
    } catch {
      setError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // BMC维度完成度
  const bmcCompletion = useMemo(() => {
    if (!bmcData) return 0;
    const filled = BMC_DIMENSIONS.filter(d => {
      const dim = bmcData.dimensions[d.key];
      return dim && dim.children.length > 0;
    }).length;
    return filled;
  }, [bmcData]);

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
      {/* 面板头部 */}
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
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: theme.sealColor, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: SAGE_FONT_SERIF, fontSize: 14, fontWeight: 700, letterSpacing: 2,
          boxShadow: `0 0 12px ${theme.glowColor}`, flexShrink: 0,
        }}>
          {theme.caseNo}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 18, fontWeight: 700, color: textColor, letterSpacing: 2 }}>
            {theme.title}
          </div>
          <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 11, color: theme.accentColor, letterSpacing: 3, opacity: 0.85 }}>
            RISK MATRIX
          </div>
        </div>
        {riskData && (
          <Space className="risk-no-print">
            <Button type="text" icon={<FilePdfOutlined />} onClick={exportRiskPDF}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              导出 PDF
            </Button>
            <Button type="text" icon={<FileWordOutlined />} onClick={() => exportRiskWord(riskData)}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              导出 Word
            </Button>
            <Button type="text" icon={<DownloadOutlined />} onClick={() => exportRiskMarkdown(riskData)}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              Markdown
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {/* 分区1：推演输入 */}
        <Col xs={24} lg={riskData ? 8 : 24}>
          <SageSection title="推演输入" subtitle="RISK INPUT" theme={theme} isDark={isDark} stagger={1}>
            {/* 需求分析来源卡 */}
            {report ? (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                marginBottom: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, fontWeight: 700, color: textColor }}>
                    需求分析来源
                  </span>
                  <Button type="text" size="small" icon={<ReloadOutlined />}
                    onClick={() => setReportVersion(v => v + 1)}
                    style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                    刷新
                  </Button>
                </div>
                <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12, color: textColor, lineHeight: 1.7 }}>
                  <div>项目名称：{report.inputs.projectName || '—'}</div>
                  <div>目标用户：{report.inputs.targetUser || '—'}</div>
                  <div>当前阶段：{report.inputs.stage || '—'}</div>
                  <div style={{ opacity: 0.6, fontSize: 11 }}>
                    核心想法：{String(report.inputs.ideaContent || '').slice(0, 50)}
                    {(report.inputs.ideaContent || '').length > 50 ? '…' : ''}
                  </div>
                </div>
                <Tag color="red" style={{ marginTop: 6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  已就绪 · {new Date(report.updatedAt).toLocaleString()}
                </Tag>
              </div>
            ) : (
              <Alert type="warning" showIcon style={{ marginBottom: 14 }}
                message="尚未生成需求分析报告"
                description="请先切换到「需求分析」面板完成生成，本面板将自动基于该报告与商业模式画布进行风险评估。"
              />
            )}

            {/* BMC来源卡 */}
            {bmcData ? (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                marginBottom: 14,
              }}>
                <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, fontWeight: 700, color: textColor, marginBottom: 4 }}>
                  商业模式画布来源
                </div>
                <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12, color: textColor, lineHeight: 1.7 }}>
                  <div>项目名称：{bmcData.projectName}</div>
                  <div>维度完成度：{bmcCompletion} / 9</div>
                </div>
                <Tag color="cyan" style={{ marginTop: 6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  画布已就绪
                </Tag>
              </div>
            ) : (
              <Alert type="info" showIcon style={{ marginBottom: 14 }}
                message="商业模式画布未生成"
                description="建议先完成商业模式画布以获得更精准的前瞻性风险评估。"
              />
            )}

            {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />}

            <Button
              className="sage-seal-btn"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleGenerate}
              loading={loading}
              block
              disabled={!report}
              style={{
                marginTop: 14,
                background: theme.sealColor,
                border: 'none',
                borderRadius: 8,
                height: 40,
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
                boxShadow: `0 4px 14px ${theme.glowColor}`,
              }}
            >
              生成风险评估
            </Button>
          </SageSection>
        </Col>

        {/* 分区2-4：风险评估结果 */}
        {riskData && (
          <Col xs={24} lg={16}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <RiskQuadrant
                risks={riskData.risks}
                theme={theme}
                isDark={isDark}
                activeLevel={activeLevel}
                onSelectLevel={setActiveLevel}
              />
              <RiskCardList
                risks={riskData.risks}
                theme={theme}
                isDark={isDark}
                activeLevel={activeLevel}
                onSelectLevel={setActiveLevel}
              />
              <SageSection title="应对策略报告" subtitle="RESPONSE REPORT" theme={theme} isDark={isDark} stagger={4}>
                <Text style={{
                  color: textColor,
                  whiteSpace: 'pre-wrap',
                  fontFamily: SAGE_FONT_SERIF,
                  lineHeight: 1.9,
                  fontSize: 13,
                }}>
                  {riskData.summary || riskData.rawMarkdown}
                </Text>
              </SageSection>
            </div>
          </Col>
        )}
      </Row>

      {/* 加载态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <Text style={{ display: 'block', marginTop: 12, color: textColor, fontFamily: SAGE_FONT_SERIF }}>
            AI 正在进行前瞻性风险评估...
          </Text>
        </div>
      )}

      {/* 隐藏打印容器（PDF导出用） */}
      <div id="sage-risk-print-root" style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: riskData ? buildRiskReportHTML(riskData) : '' }} />
    </div>
  );
};

export default RiskMatrix;
