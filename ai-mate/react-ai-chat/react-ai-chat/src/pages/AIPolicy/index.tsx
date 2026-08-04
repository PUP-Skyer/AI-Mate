/**
 * AI 创业政策页面容器
 * master-detail：list ⇄ detail 页内切换 + 区块锚点滚动（来自 3D 卡片）+ API 加载
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { ROLE_TO_PAGE } from '../../types';
import { fetchAIPolicies, POLICIES } from './data';
import type { AIPolicy } from './types';
import PolicyListPanel from './components/PolicyListPanel';
import PolicyDetailPanel from './components/PolicyDetailPanel';
import './AIPolicy.css';

const { Text } = Typography;

const AIPolicyPage: React.FC = () => {
  const currentRole = useAIStore((s) => s.currentRole);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [policies, setPolicies] = useState<AIPolicy[]>(POLICIES);
  const [loading, setLoading] = useState(true);

  // 3D 卡片底部入口带入的滚动目标（仅列表视图生效）
  const scrollTarget = useRef<'support' | 'official' | null>(
    typeof window !== 'undefined' ? (window.__AI_POLICY_SCROLL_TO__ ?? null) : null
  );

  // API 预留：mock 兜底加载
  useEffect(() => {
    let alive = true;
    fetchAIPolicies().then((list) => {
      if (!alive) return;
      setPolicies(list);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 进入列表视图后滚动到对应区块并清除标记
  useEffect(() => {
    if (view === 'list' && scrollTarget.current) {
      const target = scrollTarget.current;
      scrollTarget.current = null;
      if (typeof window !== 'undefined') window.__AI_POLICY_SCROLL_TO__ = undefined;
      setTimeout(() => {
        document
          .getElementById(target === 'support' ? 'ai-policy-support' : 'ai-policy-official')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [view]);

  // 政策索引（详情相关跳转用）
  const policiesMap = useMemo(() => {
    const map: Record<string, AIPolicy> = {};
    policies.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [policies]);

  // 全局索引注入（供详情面板"相关政策"跳转，副作用放 effect）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__AP_POLICIES__ = policiesMap;
    }
  }, [policiesMap]);

  const selected = selectedId ? policiesMap[selectedId] : null;

  const openDetail = (policy: AIPolicy) => {
    setSelectedId(policy.id);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const backToDashboard = () => {
    setCurrentPage(ROLE_TO_PAGE[currentRole]);
  };

  return (
    <div className="ai-policy-page">
      {/* 页头 */}
      <div className="ap-head-row">
        <div>
          <h2 className="ap-serif-title ap-main">AI 创业政策</h2>
          <Text type="secondary" style={{ fontSize: 12, color: '#6b7280' }}>
            覆盖 {policies.length}+ 项政策 · 数据来自公开渠道聚合，申报以官方公告为准
          </Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={backToDashboard}>
          返回看板
        </Button>
      </div>
      <div className="ap-rule" />

      {/* 主从视图 */}
      {view === 'list' ? (
        <PolicyListPanel policies={policies} loading={loading} onOpen={openDetail} />
      ) : selected ? (
        <PolicyDetailPanel policy={selected} onBack={backToList} onOpenRelated={openDetail} />
      ) : (
        <PolicyListPanel policies={policies} loading={loading} onOpen={openDetail} />
      )}
    </div>
  );
};

export default AIPolicyPage;
