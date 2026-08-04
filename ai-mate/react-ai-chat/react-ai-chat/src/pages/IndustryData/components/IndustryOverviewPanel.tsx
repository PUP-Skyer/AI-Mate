/**
 * 行业数据总览面板：KPI 条 + 7 行业卡片网格
 */
import React from 'react';
import { Card, Col, Row, Tag, Typography } from 'antd';
import type { IndustryDatum } from '../types';

const { Text } = Typography;

interface Props {
  industries: IndustryDatum[];
  onOpen: (ind: IndustryDatum) => void;
}

const IndustryOverviewPanel: React.FC<Props> = ({ industries, onOpen }) => {
  const totalReports = industries.reduce((s, i) => s + i.reportCount, 0);
  return (
    <div className="id-enter">
      {/* KPI 条 */}
      <div className="id-kpi-row">
        <div className="id-kpi-item"><div className="id-kpi-label">覆盖行业</div><div className="id-kpi-value">{industries.length}</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">报告总量</div><div className="id-kpi-value">{totalReports.toLocaleString()}</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">平均增速</div><div className="id-kpi-value id-green">{(industries.reduce((s, i) => s + i.growthRate, 0) / industries.length).toFixed(1)}%</div></div>
        <div className="id-kpi-item"><div className="id-kpi-label">数据源状态</div><div className="id-kpi-value" style={{ fontSize: 16 }}>聚合/定时更新</div></div>
      </div>
      {/* 7 行业卡片网格 */}
      <Row gutter={[12, 12]}>
        {industries.map((ind) => (
          <Col xs={24} sm={12} lg={8} key={ind.industry}>
            <Card
              hoverable
              size="small"
              onClick={() => onOpen(ind)}
              styles={{ body: { padding: '14px 16px', cursor: 'pointer' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 15, color: ind.color }}>{ind.industry}</Text>
                <Tag color={ind.color} style={{ fontSize: 10, borderRadius: 4 }}>热度 {ind.hotIndex}</Tag>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 20 }}>
                <div>
                  <Text style={{ fontSize: 11, color: '#888' }}>市场规模</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{ind.marketSize}</div>
                </div>
                <div>
                  <Text style={{ fontSize: 11, color: '#888' }}>同比增长</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#28a745' }}>↑ {ind.growthRate}%</div>
                </div>
                <div>
                  <Text style={{ fontSize: 11, color: '#888' }}>报告数</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>{ind.reportCount.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Text style={{ fontSize: 10, color: ind.color, fontWeight: 600 }}>查看数据报告与图表 →</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default IndustryOverviewPanel;
