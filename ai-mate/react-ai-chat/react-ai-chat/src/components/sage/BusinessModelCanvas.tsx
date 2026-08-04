/**
 * 军师AI - 商业模式画布面板（案二 · 靛青）
 * 分区式结构：推演输入（需求分析来源 + 用户画像锁定）+ 9宫格可编辑画布 + 幕布式思维导图 + 商业模式说明标签
 * 动画：9 宫格交错入场 / 印章 CTA / 维度切换过渡
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Button,
  Spin,
  Typography,
  Row,
  Col,
  Tag,
  Alert,
  Space,
} from 'antd';
import {
  SendOutlined,
  DownloadOutlined,
  ApartmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';
import { SAGE_THEMES, SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import './sage-animations.css';
import { SageSection } from './shared';
import BMCCanvas from './BMCCanvas';
import PersonaTags from './PersonaTags';
import {
  BMC_DIMENSIONS,
  BMC_SYSTEM_PROMPT,
  buildBMCUserContent,
  parseSummaryTags,
  treeToMarkdown,
  EMPTY_PERSONA,
  generateId,
  parseMarkdownToTree,
  type TreeNode,
  type BMCData,
  type PersonaData,
} from './bmc-utils';
import { loadRequirementsReport, type RequirementsReport } from './sage-storage';
import { loadBMCData, saveBMCData } from './sage-storage';
import MindMapEditor from '../mindmap/MindMapEditor';
import ExportMenu from '../mindmap/ExportMenu';
import { useMindMapStore } from '../mindmap/useMindMapStore';

const { Text } = Typography;

const BusinessModelCanvas: React.FC = () => {
  const [loading, setLoading] = useState(false);
 const [bmcData, setBmcData] = useState<BMCData | null>(() => {
   try { return loadBMCData() } catch { return null }
 });
  const [activeDimension, setActiveDimension] = useState<string>(BMC_DIMENSIONS[0].key);
  const [summaryTags, setSummaryTags] = useState<string[]>([]);
  const [persona, setPersona] = useState<PersonaData>(EMPTY_PERSONA);
  const [error, setError] = useState('');
  const [reportVersion, setReportVersion] = useState(0);

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme: SageTheme = SAGE_THEMES.canvas;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  const loadFromBMC = useMindMapStore((s) => s.loadFromBMC);

  // 当 BMC 数据生成后，加载到思维导图 store
  useEffect(() => {
    if (bmcData) {
      loadFromBMC(bmcData.dimensions, bmcData.projectName);
    }
  }, [bmcData, loadFromBMC]);

  // BMC 数据持久化到 localStorage
  useEffect(() => {
    if (bmcData) {
      saveBMCData(bmcData);
    }
  }, [bmcData]);

  // 需求分析报告：reportVersion 变化时重新读取 localStorage（供"刷新"按钮使用）
  const report: RequirementsReport | null = useMemo(() => {
    void reportVersion;
    return loadRequirementsReport();
  }, [reportVersion]);

  const handleGenerate = async () => {
    if (!report) {
      setError('请先在「需求分析」面板生成需求分析报告');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: buildBMCUserContent(report, persona) }],
        { system_prompt: BMC_SYSTEM_PROMPT }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setBmcData({
        projectName: report.inputs.projectName || '未命名项目',
        dimensions: parseMarkdownToTree(content),
      });
      setSummaryTags(parseSummaryTags(content));
    } catch {
      setError('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateText = useCallback((dimKey: string, nodeId: string, text: string) => {
    setBmcData((prev) => {
      if (!prev) return prev;
      const newDims = { ...prev.dimensions };

      const updateNode = (node: TreeNode): TreeNode => {
        if (node.id === nodeId) {
          return { ...node, text };
        }
        return { ...node, children: node.children.map(updateNode) };
      };

      newDims[dimKey] = updateNode(newDims[dimKey]);
      return { ...prev, dimensions: newDims };
    });
  }, []);

  // 9 宫格添加要点（根节点一级子节点）
  const handleAddBullet = useCallback((dimKey: string) => {
    setBmcData((prev) => {
      if (!prev) return prev;
      const newDims = { ...prev.dimensions };
      const root = newDims[dimKey];
      root.children = [...root.children, { id: generateId(), text: '新要点', children: [], expanded: true }];
      return { ...prev, dimensions: newDims };
    });
  }, []);

  // 9 宫格删除要点
  const handleRemoveBullet = useCallback((dimKey: string, nodeId: string) => {
    setBmcData((prev) => {
      if (!prev) return prev;
      const newDims = { ...prev.dimensions };
      const removeFrom = (node: TreeNode): TreeNode => ({
        ...node,
        children: node.children.filter((c) => c.id !== nodeId).map(removeFrom),
      });
      newDims[dimKey] = removeFrom(newDims[dimKey]);
      return { ...prev, dimensions: newDims };
    });
  }, []);

  // 导出：树序列化（含手动编辑）
  const handleDownload = () => {
    if (!bmcData) return;
    const blob = new Blob([treeToMarkdown(bmcData.dimensions, bmcData.projectName)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bmcData.projectName || '商业模式画布'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <div style={{ flex: 1 }}>
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
            BUSINESS MODEL CANVAS
          </div>
        </div>
        {bmcData && (
          <Space>
            <ExportMenu projectName={bmcData.projectName} />
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
            >
              导出 BMC Markdown
            </Button>
          </Space>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {/* 分区1：推演输入（原"画布设定"已删除） */}
        <Col xs={24} lg={bmcData ? 8 : 24}>
          <SageSection title="推演输入" subtitle="PERSONA LOCK" theme={theme} isDark={isDark} stagger={1}>
            {/* 需求分析来源卡 */}
            {report ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${borderColor}`,
                  background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, fontWeight: 700, color: textColor }}>
                    需求分析来源
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => setReportVersion((v) => v + 1)}
                    style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}
                  >
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
                <Tag color="cyan" style={{ marginTop: 6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  已就绪 · {new Date(report.updatedAt).toLocaleString()}
                </Tag>
              </div>
            ) : (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 14 }}
                message="尚未生成需求分析报告"
                description="请先切换到「需求分析」面板完成生成，本面板将自动基于该报告与用户画像生成画布。"
              />
            )}

            {/* 用户画像锁定（标签式） */}
            <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 10 }}>
              用户画像锁定
            </div>
            <PersonaTags value={persona} onChange={setPersona} theme={theme} isDark={isDark} />

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
              生成画布 + 思维导图 + 商业模式说明
            </Button>
          </SageSection>
        </Col>

        {/* 分区2：画布推演（9宫格 + 幕布树 + 说明标签） */}
        {bmcData && (
          <Col xs={24} lg={16}>
            <SageSection
              title="画布推演"
              subtitle="CANVAS SIMULATION"
              theme={theme}
              isDark={isDark}
              stagger={2}
              style={{ overflow: 'visible' }}
            >
              {/* 产出1：9 宫格可编辑画布 */}
              <BMCCanvas
                dimensions={bmcData.dimensions}
                isDark={isDark}
                theme={theme}
                activeDimension={activeDimension}
                onSelectDimension={setActiveDimension}
                onUpdateText={(dimKey, nodeId, text) => handleUpdateText(dimKey, nodeId, text)}
                onAddBullet={handleAddBullet}
                onRemoveBullet={handleRemoveBullet}
              />

              {/* 产出2：幕布式思维导图（升级为完整 MindMapEditor） */}
              <div
                style={{
                  marginTop: 16,
                  background: isDark ? 'rgba(0,0,0,0.25)' : '#FAF6EF',
                  borderRadius: 8,
                  padding: 12,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: textColor, opacity: 0.6, fontFamily: SAGE_FONT_SERIF, fontSize: 11 }}>
                  <ApartmentOutlined />
                  幕布式思维导图 - {bmcData.projectName}
                </div>
                <MindMapEditor
                  isDark={isDark}
                  theme={theme}
                />
              </div>

              {/* 产出3：商业模式说明（标签式） */}
              {summaryTags.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 8 }}>
                    商业模式说明
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {summaryTags.map((t, i) => (
                      <Tag
                        key={i}
                        closable
                        onClose={() => setSummaryTags((prev) => prev.filter((_, j) => j !== i))}
                        style={{
                          fontFamily: SAGE_FONT_SERIF,
                          fontSize: 12,
                          borderRadius: 4,
                          background: `${theme.chartColors[i % theme.chartColors.length]}14`,
                          borderColor: `${theme.chartColors[i % theme.chartColors.length]}66`,
                          color: textColor,
                          marginInlineEnd: 0,
                        }}
                      >
                        {t}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </SageSection>
          </Col>
        )}
      </Row>

      {/* 加载态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <Text style={{ display: 'block', marginTop: 12, color: textColor, fontFamily: SAGE_FONT_SERIF }}>
            AI 正在生成商业模式画布...
          </Text>
        </div>
      )}
    </div>
  );
};

export default BusinessModelCanvas;
