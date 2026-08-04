/**
 * 资源对比面板 - "智能工作台"
 * 雷达图 + 供应商选择卡片 + 对比表格 + 暗色/亮色双模式
 */

import React, { useState, useMemo, memo } from 'react';
import { Card, Checkbox, Button, Table, Empty, Spin, Space, Tag, Avatar, Row, Col, Badge, Divider, App, Tooltip, Typography } from 'antd';
import {
  SwapOutlined, CheckCircleOutlined, FileTextOutlined, CheckOutlined,
  CloseOutlined, ClearOutlined, BarChartOutlined, RadarChartOutlined,
  TrophyOutlined, StarOutlined,
} from '@ant-design/icons';
import { Radar } from '@ant-design/charts';
import { compareSuppliers, type Supplier, type CompareResult } from '../../services/scoutService';
import { useTheme } from '../../contexts/ThemeContext';
import ScoutPanelHeader from './shared/ScoutPanelHeader';
import ScoutSectionCard from './shared/ScoutSectionCard';
import { panelThemes } from './shared/scout-panel-theme';
import './shared/scout-animations.css';

const { Text } = Typography;
const theme = panelThemes.compare;

interface ResourceComparePanelProps {
  suppliers: Supplier[];
}

// 雷达图组件 - memo 优化
const CompareRadarChart = memo(({ compareResult, isDarkMode }: { compareResult: CompareResult; isDarkMode: boolean }) => {
  // 将维度数据转换为雷达图格式
  const radarData = useMemo(() => {
    const data: Array<{ dimension: string; supplier: string; score: number }> = [];
    compareResult.dimensions.forEach((dim) => {
      compareResult.suppliers.forEach((s) => {
        const value = dim.values[s.id];
        // 尝试提取数值，如果是字符串则取数字部分
        const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
        // 归一化到 0-100
        const normalizedScore = Math.min(100, Math.max(0, numValue));
        data.push({
          dimension: dim.name,
          supplier: s.name,
          score: normalizedScore,
        });
      });
    });
    return data;
  }, [compareResult]);

  const supplierColors = theme.chartColors.slice(0, compareResult.suppliers.length);

  return (
    <Radar
      data={radarData}
      xField="dimension"
      yField="score"
      colorField="supplier"
      scale={{ color: { range: supplierColors } }}
      style={{ lineWidth: 2, fillOpacity: 0.15 }}
      axis={{
        x: { gridStroke: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0', labelAutoRotate: false },
        y: { gridStroke: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f0f0f0' },
      }}
      legend={{
        color: { position: 'bottom' as const, layout: { justifyContent: 'center' } },
      }}
      theme={isDarkMode ? 'classicDark' : 'classic'}
      height={280}
      animate={{ enter: { type: 'fadeIn' as const, duration: 800 } }}
    />
  );
});

const ResourceComparePanelContent: React.FC<ResourceComparePanelProps> = ({ suppliers }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const { isDarkMode } = useTheme();
  const { message } = App.useApp();

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      }
      if (prev.length >= 4) {
        message.warning('最多选择4个供应商进行对比');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setCompareResult(null);
    message.success('已清空选择');
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      message.warning('请至少选择2个供应商');
      return;
    }
    setLoading(true);
    try {
      const result = await compareSuppliers(selectedIds);
      setCompareResult(result);
      message.success('对比完成');
    } catch (error) {
      console.error('对比失败:', error);
      message.error('对比失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 对比表格列
  const columns = compareResult
    ? [
        {
          title: '对比维度',
          dataIndex: 'name',
          key: 'name',
          width: 120,
          fixed: 'left' as const,
          render: (text: string) => (
            <span style={{ fontWeight: 600, color: isDarkMode ? 'var(--text-primary)' : '#1E293B' }}>{text}</span>
          ),
        },
        ...compareResult.suppliers.map((s, idx) => ({
          title: (
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={30}
                style={{
                  background: `linear-gradient(135deg, ${theme.chartColors[idx % theme.chartColors.length]}, ${theme.chartColors[idx % theme.chartColors.length]}cc)`,
                  fontSize: 14, marginBottom: 4,
                }}
              >
                {s.name.charAt(0)}
              </Avatar>
              <div style={{ fontSize: 12, color: isDarkMode ? 'var(--text-secondary)' : '#475569', marginTop: 4 }}>{s.name}</div>
            </div>
          ),
          dataIndex: s.id,
          key: s.id,
          width: 140,
          align: 'center' as const,
        })),
      ]
    : [];

  // 对比表格数据
  const dataSource = compareResult
    ? compareResult.dimensions.map((dim, idx) => {
        const row: Record<string, string | number | React.ReactNode> = { key: idx, name: dim.name };
        compareResult.suppliers.forEach((s) => {
          const value = dim.values[s.id];
          const isHighlight = dim.highlight === s.id;
          row[s.id] = (
            <span style={{
              color: isHighlight ? theme.accentColor : (isDarkMode ? 'var(--text-secondary)' : '#475569'),
              fontWeight: isHighlight ? 700 : 400,
              background: isHighlight ? `${theme.accentColor}15` : 'transparent',
              padding: isHighlight ? '3px 10px' : '3px 0',
              borderRadius: 6,
              display: 'inline-block',
            }}>
              {isHighlight && <TrophyOutlined style={{ marginRight: 4, fontSize: 11 }} />}
              {value || '-'}
            </span>
          );
        });
        return row;
      })
    : [];

  const selectedSuppliers = suppliers.filter(s => selectedIds.includes(s.id));

  return (
    <div style={{ background: 'var(--bg-page)', borderRadius: 12, overflow: 'hidden' }}>
      {/* 工作台标题区 */}
      <ScoutPanelHeader
        icon={<SwapOutlined />}
        title="资源对比工作台"
        subtitle="多维度对比，做出最优选择"
        variant="workbench"
        themeKey="compare"
        stats={[
          { label: '可选资源', value: suppliers.length },
          { label: '已选择', value: selectedIds.length },
          { label: '最大对比', value: 4 },
        ]}
        extra={
          selectedIds.length > 0 ? (
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClearSelection}
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#475569',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                border: 'none', borderRadius: 6,
              }}
            >
              清空
            </Button>
          ) : undefined
        }
      />

      <Divider style={{ margin: 0, borderColor: isDarkMode ? 'var(--border-light)' : '#f0f0f0' }} />

      {suppliers.length === 0 ? (
        <div style={{ padding: '60px 20px' }}>
          <Empty
            image={<RadarChartOutlined style={{ fontSize: 56, color: isDarkMode ? '#30363d' : '#d9d9d9' }} />}
            description={
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: isDarkMode ? 'var(--text-primary)' : '#1E293B', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
                  暂无供应商数据
                </div>
                <div style={{ color: isDarkMode ? 'var(--text-muted)' : '#94A3B8', fontSize: 13 }}>
                  请先搜索供应商，然后选择 2-4 个进行对比分析
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          {/* 选择供应商区域 */}
          <div className="scout-panel-section" style={{ marginBottom: 16 }}>
            <ScoutSectionCard
              title={
                <span>
                  <CheckOutlined style={{ marginRight: 6, color: theme.accentColor }} />
                  选择供应商
                  <Tag style={{
                    marginLeft: 8, fontSize: 11, borderRadius: 10,
                    background: `${theme.accentColor}15`, borderColor: `${theme.accentColor}40`,
                    color: theme.accentColor,
                  }}>
                    {selectedIds.length}/4
                  </Tag>
                </span>
              }
              accentColor={theme.accentColor}
              extra={
                selectedIds.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={handleClearSelection}
                    style={{ color: '#EF4444', fontSize: 12 }}
                  >
                    <CloseOutlined /> 清空
                  </Button>
                ) : undefined
              }
            >
              <Row gutter={[12, 12]}>
                {suppliers.map((s, idx) => {
                  const isSelected = selectedIds.includes(s.id);
                  const ratingColor = s.rating >= 4.5 ? '#EF4444' : s.rating >= 4.0 ? '#F59E0B' : theme.accentColor;
                  return (
                    <Col span={12} key={s.id}>
                      <div
                        onClick={() => handleToggle(s.id)}
                        className="scout-panel-section"
                        style={{
                          animationDelay: `${idx * 60}ms`,
                          padding: '12px 14px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          border: `1.5px solid ${isSelected ? theme.accentColor : (isDarkMode ? 'var(--border-light)' : '#E2E8F0')}`,
                          background: isSelected ? `${theme.accentColor}08` : (isDarkMode ? 'var(--bg-card)' : '#fff'),
                          boxShadow: isSelected ? `0 0 0 1px ${theme.accentColor}30, 0 4px 12px ${theme.accentColor}15` : 'none',
                          transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={isSelected}
                            style={{ transform: 'scale(1.1)' }}
                            onChange={() => {}}
                          />
                          <Avatar
                            size={36}
                            style={{
                              background: `linear-gradient(135deg, ${theme.chartColors[idx % theme.chartColors.length]}, ${theme.chartColors[idx % theme.chartColors.length]}bb)`,
                              marginLeft: 10, fontSize: 16,
                            }}
                          >
                            {s.name.charAt(0)}
                          </Avatar>
                          <div style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: 600, fontSize: 14,
                              color: isDarkMode ? 'var(--text-primary)' : '#1E293B',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 12, color: isDarkMode ? 'var(--text-muted)' : '#94A3B8', marginTop: 2 }}>
                              <StarOutlined style={{ color: '#faad14', marginRight: 3 }} />
                              {s.rating} · ¥{s.minPrice?.toLocaleString()}万
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircleOutlined style={{ color: theme.accentColor, fontSize: 18 }} />
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </ScoutSectionCard>
          </div>

          {/* 已选供应商预览 + 对比按钮 */}
          {selectedSuppliers.length > 0 && (
            <div className="scout-panel-section" style={{ marginBottom: 16 }}>
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: isDarkMode ? 'rgba(16,185,129,0.06)' : '#ECFDF5',
                border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.15)' : '#A7F3D0'}`,
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 12, color: isDarkMode ? 'var(--text-muted)' : '#64748B', marginBottom: 6, display: 'block' }}>
                  已选择 {selectedSuppliers.length} 个供应商
                </Text>
                <Space wrap>
                  {selectedSuppliers.map((s, idx) => (
                    <Tag
                      key={s.id}
                      closable
                      onClose={() => handleToggle(s.id)}
                      style={{
                        borderRadius: 6, padding: '3px 10px',
                        background: isDarkMode ? 'var(--bg-card)' : '#fff',
                        borderColor: theme.chartColors[idx % theme.chartColors.length],
                        color: isDarkMode ? 'var(--text-primary)' : '#1E293B',
                      }}
                    >
                      <Avatar size={14} style={{
                        marginRight: 4,
                        background: theme.chartColors[idx % theme.chartColors.length],
                        fontSize: 9,
                      }}>
                        {s.name.charAt(0)}
                      </Avatar>
                      {s.name}
                    </Tag>
                  ))}
                </Space>
              </div>

              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={handleCompare}
                loading={loading}
                disabled={selectedIds.length < 2}
                block
                size="large"
                style={{
                  borderRadius: 10, height: 46,
                  background: selectedIds.length >= 2 ? `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentDark})` : undefined,
                  border: 'none', fontSize: 15, fontWeight: 600,
                  boxShadow: selectedIds.length >= 2 ? `0 4px 16px ${theme.glowColor}` : 'none',
                }}
              >
                {selectedIds.length >= 2 ? `开始对比 ${selectedIds.length} 个供应商` : '请至少选择2个供应商'}
              </Button>
            </div>
          )}

          {/* 对比结果 */}
          <Spin spinning={loading}>
            {compareResult && (
              <>
                {/* 雷达图 */}
                <div className="scout-panel-section" style={{ marginBottom: 16 }}>
                  <ScoutSectionCard
                    title={
                      <span>
                        <RadarChartOutlined style={{ marginRight: 6, color: theme.accentColor }} />
                        多维对比雷达图
                      </span>
                    }
                    accentColor={theme.accentColor}
                    extra={
                      <Tag color="success" style={{ fontSize: 11, borderRadius: 10 }}>
                        <TrophyOutlined style={{ marginRight: 3 }} />
                        推荐: {compareResult.recommended}
                      </Tag>
                    }
                  >
                    <CompareRadarChart compareResult={compareResult} isDarkMode={isDarkMode} />
                  </ScoutSectionCard>
                </div>

                {/* 对比表格 */}
                <div className="scout-panel-section">
                  <ScoutSectionCard
                    title={
                      <span>
                        <FileTextOutlined style={{ marginRight: 6, color: theme.accentColor }} />
                        详细对比结果
                      </span>
                    }
                    accentColor={theme.accentColor}
                  >
                    <Table
                      columns={columns}
                      dataSource={dataSource}
                      pagination={false}
                      size="middle"
                      bordered
                      scroll={{ x: 'max-content' }}
                      style={{ borderRadius: 8 }}
                      rowClassName={() => isDarkMode ? 'dark-table-row' : ''}
                    />
                  </ScoutSectionCard>
                </div>
              </>
            )}
          </Spin>
        </div>
      )}
    </div>
  );
};

const ResourceComparePanel: React.FC<ResourceComparePanelProps> = (props) => (
  <App>
    <ResourceComparePanelContent {...props} />
  </App>
);

export default ResourceComparePanel;
