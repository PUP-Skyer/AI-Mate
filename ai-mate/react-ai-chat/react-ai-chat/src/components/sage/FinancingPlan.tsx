/**
 * 军师AI - 融资规划面板（案四 · 财青）
 * 分区式结构：推演输入 + 基础体系四模块 + SVG折线时间轴 + 融资方网格卡片 + 策略总结
 * 动画：指标数字递增 / 折线绘制 / 卡片交错入场 / 印章CTA
 * 导出：PDF（打印）/ Word / Markdown
 * 融资方接口：financingService.ts（后端不可用时使用AI生成数据兜底）
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, Spin, Typography, Row, Col, Tag, Alert, Space } from 'antd';
import {
  SendOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DollarOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';
import { SAGE_THEMES, SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import './sage-animations.css';
import './finance-print.css';
import { SageSection } from './shared';
import {
  FINANCE_SYSTEM_PROMPT,
  buildFinanceUserContent,
  parseFinanceMarkdown,
  type FinancingData,
} from './finance-utils';
import {
  loadRequirementsReport,
  loadBMCData,
  loadRiskData,
  loadFinanceData,
  saveFinanceData,
  type RequirementsReport,
} from './sage-storage';
import type { BMCData } from './bmc-utils';
import type { RiskMatrixData } from './risk-utils';
import { BMC_DIMENSIONS } from './bmc-utils';
import FinancingTimeline from './FinancingTimeline';
import FinancingCards from './FinancingCards';
import FinancingCardStack from './FinancingCardStack';
import {
  loadFinancingCards,
  addFinancingCards,
  stageToCard,
  type FinancingCardData,
} from './financing-card-storage';
import { exportFinancePDF, exportFinanceWord, exportFinanceMarkdown, buildFinanceReportHTML } from './finance-export';

const { Text } = Typography;

const FinancingPlan: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState<FinancingData | null>(() => {
    try { return loadFinanceData(); } catch { return null; }
  });
  const [error, setError] = useState('');
  const [reportVersion, setReportVersion] = useState(0);
  const [finCardsVersion, setFinCardsVersion] = useState(0);

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme: SageTheme = SAGE_THEMES.finance;
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

  const riskData: RiskMatrixData | null = useMemo(() => {
    void reportVersion;
    return loadRiskData();
  }, [reportVersion]);

  // 融资阶段3D卡片
  const finCards: FinancingCardData[] = useMemo(() => {
    void finCardsVersion;
    return loadFinancingCards().cards;
  }, [finCardsVersion]);

  // 添加融资阶段到3D卡片堆
  const handleAddToCardStack = useCallback(() => {
    if (!financeData || financeData.stages.length === 0) return;
    const newCards = financeData.stages.map((stage) =>
      stageToCard(stage, financeData.projectName)
    );
    addFinancingCards(newCards);
    setFinCardsVersion((v) => v + 1);
  }, [financeData]);

  // 持久化
  useEffect(() => {
    if (financeData) saveFinanceData(financeData);
  }, [financeData]);

  // 生成融资规划
  const handleGenerate = async () => {
    if (!report) {
      setError('请先在「需求分析」面板生成需求分析报告');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: buildFinanceUserContent(report, bmcData, riskData) }],
        { system_prompt: FINANCE_SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      const parsed = parseFinanceMarkdown(content, report.inputs.projectName || '未命名项目');
      setFinanceData(parsed);
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

  // 基础体系模块配置
  const baseSystemModules = [
    { key: 'pricing', label: '定价体系', icon: '¥', items: financeData?.baseSystem.pricing || [] },
    { key: 'serviceProcess', label: '服务流程', icon: '▸', items: financeData?.baseSystem.serviceProcess || [] },
    { key: 'afterSales', label: '售后标准', icon: '◆', items: financeData?.baseSystem.afterSales || [] },
    { key: 'accountingRules', label: '财务记账规则', icon: '☰', items: financeData?.baseSystem.accountingRules || [] },
  ];

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
            FINANCING PLAN
          </div>
        </div>
        {financeData && (
          <Space className="finance-no-print">
            <Button type="text" icon={<FilePdfOutlined />} onClick={exportFinancePDF}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              导出 PDF
            </Button>
            <Button type="text" icon={<FileWordOutlined />} onClick={() => exportFinanceWord(financeData)}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              导出 Word
            </Button>
            <Button type="text" icon={<DownloadOutlined />} onClick={() => exportFinanceMarkdown(financeData)}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}>
              Markdown
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {/* 分区1：推演输入 */}
        <Col xs={24} lg={financeData ? 8 : 24}>
          <SageSection title="推演输入" subtitle="FINANCE INPUT" theme={theme} isDark={isDark} stagger={1}>
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
                </div>
                <Tag color="teal" style={{ marginTop: 6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  已就绪 · {new Date(report.updatedAt).toLocaleDateString()}
                </Tag>
              </div>
            ) : (
              <Alert type="warning" showIcon style={{ marginBottom: 14 }}
                message="尚未生成需求分析报告"
                description="请先切换到「需求分析」面板完成生成，本面板将自动基于该报告进行融资规划。"
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
                description="建议先完成商业模式画布以获得更精准的融资规划。"
              />
            )}

            {/* 风险矩阵来源卡 */}
            {riskData && riskData.risks.length > 0 ? (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                marginBottom: 14,
              }}>
                <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, fontWeight: 700, color: textColor, marginBottom: 4 }}>
                  风险矩阵来源
                </div>
                <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12, color: textColor, lineHeight: 1.7 }}>
                  <div>风险项数：{riskData.risks.length}</div>
                </div>
                <Tag color="red" style={{ marginTop: 6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  风险已就绪
                </Tag>
              </div>
            ) : (
              <Alert type="info" showIcon style={{ marginBottom: 14 }}
                message="风险矩阵未生成"
                description="建议先完成风险矩阵以在融资规划中纳入风险防范策略。"
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
              生成融资规划
            </Button>
          </SageSection>
        </Col>

        {/* 分区2-5：融资规划结果 */}
        {financeData && (
          <Col xs={24} lg={16}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 分区2：基础体系搭建 */}
              <SageSection title="基础体系搭建" subtitle="BASE SYSTEM" theme={theme} isDark={isDark} stagger={2}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {baseSystemModules.map((mod) => (
                    <div
                      key={mod.key}
                      style={{
                        background: isDark ? 'rgba(0,0,0,0.2)' : `${theme.accentColor}06`,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 8,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: `${theme.accentColor}15`,
                          color: theme.accentColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, fontFamily: SAGE_FONT_SERIF,
                        }}>
                          {mod.icon}
                        </span>
                        <span style={{
                          fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, fontWeight: 700,
                          color: textColor, letterSpacing: 0.5,
                        }}>
                          {mod.label}
                        </span>
                      </div>
                      {mod.items.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {mod.items.map((item, i) => (
                            <li key={i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 6,
                              marginBottom: 4,
                            }}>
                              <span style={{
                                width: 4, height: 4, borderRadius: '50%',
                                background: theme.accentColor,
                                marginTop: 7, flexShrink: 0, opacity: 0.6,
                              }} />
                              <span style={{
                                fontSize: 11.5, color: textColor,
                                fontFamily: SAGE_FONT_SERIF, lineHeight: 1.6,
                              }}>
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(128,128,128,0.5)', fontFamily: SAGE_FONT_SERIF }}>
                          暂无数据
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </SageSection>

              {/* 分区3：年度融资时间轴 */}
              <SageSection title="年度融资规划" subtitle="FINANCING TIMELINE" theme={theme} isDark={isDark} stagger={3}>
                <FinancingTimeline
                  stages={financeData.stages}
                  theme={theme}
                  isDark={isDark}
                />
              </SageSection>

              {/* 分区4：融资方推荐 */}
              <SageSection title="融资方推荐" subtitle="INVESTORS" theme={theme} isDark={isDark} stagger={4}>
                <FinancingCards
                  providers={financeData.providers}
                  theme={theme}
                  isDark={isDark}
                />
              </SageSection>

              {/* 分区5：融资策略总结 */}
              {financeData.summary && (
                <SageSection title="融资策略总结" subtitle="STRATEGY SUMMARY" theme={theme} isDark={isDark} stagger={5}>
                  <Text style={{
                    color: textColor,
                    whiteSpace: 'pre-wrap',
                    fontFamily: SAGE_FONT_SERIF,
                    lineHeight: 1.9,
                    fontSize: 13,
                  }}>
                    {financeData.summary}
                  </Text>
                </SageSection>
              )}

              {/* 分区6：3D融资阶段卡片堆 */}
              <SageSection title="融资阶段卡片堆" subtitle="3D CARD STACK" theme={theme} isDark={isDark} stagger={6}>
                <div style={{ marginBottom: 12 }} className="finance-no-print">
                  <Button
                    type="default"
                    icon={<PlusOutlined />}
                    onClick={handleAddToCardStack}
                    disabled={!financeData || financeData.stages.length === 0}
                    style={{
                      borderColor: theme.accentColor,
                      color: theme.accentColor,
                      fontFamily: SAGE_FONT_SERIF,
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  >
                    添加融资阶段到卡片堆
                  </Button>
                  {finCards.length > 0 && (
                    <Tag
                      color="teal"
                      style={{ marginLeft: 8, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}
                    >
                      已保存 {finCards.length} 张卡片
                    </Tag>
                  )}
                </div>
                <div className="finance-no-print">
                  <FinancingCardStack
                    cards={finCards}
                    onCardsChange={() => setFinCardsVersion((v) => v + 1)}
                  />
                </div>
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
            <DollarOutlined style={{ marginRight: 6 }} />
            AI 正在生成全生命周期融资规划...
          </Text>
        </div>
      )}

      {/* 隐藏打印容器（PDF导出用） */}
      <div id="sage-finance-print-root" style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: financeData ? buildFinanceReportHTML(financeData) : '' }} />
    </div>
  );
};

export default FinancingPlan;
