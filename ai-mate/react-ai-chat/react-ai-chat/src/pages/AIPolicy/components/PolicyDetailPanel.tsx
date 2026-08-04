/**
 * AI 创业政策详情面板
 */
import React from 'react';
import { Tag, Button, Space, Typography, Breadcrumb } from 'antd';
import { ArrowLeftOutlined, LinkOutlined, GlobalOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { POLICY_LEVEL_COLORS } from '../types';
import type { AIPolicy, PolicyStatus } from '../types';

const { Text } = Typography;

interface Props {
  policy: AIPolicy;
  onBack: () => void;
  onOpenRelated: (policy: AIPolicy) => void;
}

const STATUS_COLORS: Record<PolicyStatus, string> = {
  进行中: 'green',
  即将截止: 'orange',
  已结束: 'default',
};

const PolicyDetailPanel: React.FC<Props> = ({ policy, onBack, onOpenRelated }) => (
  <div className="ap-enter">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <Button icon={<ArrowLeftOutlined />} size="small" onClick={onBack}>返回列表</Button>
      <Breadcrumb items={[{ title: 'AI 创业政策' }, { title: policy.level }, { title: policy.id }]} />
    </div>

    <div className="ap-detail-head">
      <Space size={8} style={{ marginBottom: 6 }} wrap>
        <Tag color={POLICY_LEVEL_COLORS[policy.level] || 'default'}>{policy.level}</Tag>
        <Tag color={STATUS_COLORS[policy.status]}>{policy.status}</Tag>
        <Text style={{ fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{policy.id}</Text>
      </Space>
      <h1 className="ap-serif-title ap-detail">{policy.title}</h1>
      <div className="ap-rule" />
      <Space size={16} wrap>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          发布单位：<Text strong style={{ color: '#374151' }}>{policy.department}</Text>
        </Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />发布于 {policy.publishedAt}
        </Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>申报截止 {policy.deadline || '长期有效'}</Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>{policy.supportType} · {policy.amount}</Text>
      </Space>
    </div>

    <div className="ap-detail-section">
      <div className="ap-section-heading">政策摘要</div>
      <p className="ap-detail-body" style={{ marginBottom: 12 }}>{policy.summary}</p>
      <Space size={6} wrap>
        {policy.keywords.map((k) => <Tag key={k} style={{ borderRadius: 4 }}>{k}</Tag>)}
      </Space>
    </div>

    {policy.sections.map((sec, idx) => (
      <div className="ap-detail-section" key={sec.id}>
        <div className="ap-section-heading">
          <span className="ap-seq">{idx + 1}</span>
          {sec.heading}
        </div>
        {sec.type === 'points' && sec.points ? (
          <ul className="ap-detail-points">
            {sec.points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        ) : (
          <p className="ap-detail-body">{sec.content}</p>
        )}
      </div>
    ))}

    {/* 该政策关联的链接区块 */}
    {policy.supportLinks.length > 0 && (
      <div className="ap-detail-section">
        <div className="ap-section-heading"><span className="ap-seq"><LinkOutlined /></span>扶持政策链接</div>
        <div className="ap-link-grid">
          {policy.supportLinks.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="ap-link-item">
              <Text strong style={{ fontSize: 13, color: '#1e40af' }}>{l.label}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 12, flexShrink: 0 }}>{l.source}</Text>
            </a>
          ))}
        </div>
      </div>
    )}
    {policy.officialLinks.length > 0 && (
      <div className="ap-detail-section">
        <div className="ap-section-heading"><span className="ap-seq"><GlobalOutlined /></span>单位官网</div>
        <div className="ap-link-grid">
          {policy.officialLinks.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="ap-link-item">
              <Text strong style={{ fontSize: 13, color: '#1e40af' }}>{l.label}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 12, flexShrink: 0 }}>{l.source}</Text>
            </a>
          ))}
        </div>
      </div>
    )}

    {/* 相关政策 */}
    {policy.relatedIds.length > 0 && (
      <div className="ap-detail-section">
        <div className="ap-section-heading">相关政策</div>
        <div>
          {policy.relatedIds.map((rid) => {
            const rel = window.__AP_POLICIES__?.[rid];
            return rel ? (
              <div key={rid} className="ap-related-item" onClick={() => onOpenRelated(rel)}>
                <Text strong style={{ fontSize: 13, color: '#1e40af' }}>{rel.title}</Text>
                <Text style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, marginLeft: 12 }}>
                  {rel.level} · {rel.publishedAt}
                </Text>
              </div>
            ) : null;
          })}
        </div>
      </div>
    )}
  </div>
);

export default PolicyDetailPanel;
