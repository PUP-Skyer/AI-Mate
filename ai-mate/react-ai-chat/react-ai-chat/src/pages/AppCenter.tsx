/**
 * 应用中心页面
 * 集中展示平台能力（Skill / 工具 / 页面），一键跳转使用
 * 数据来源：skillStore 的技能库（按类别分组）
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Tag,
  Input,
  Empty,
  Space,
  Button,
  Segmented,
  message,
} from 'antd';
import {
  RocketOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useAIStore, type AIRole } from '../store/aiStore';
import { useSkillStore } from '../store/skillStore';
import { useI18n } from '../i18n';
import type { SkillCategory, AppPage } from '../types';

const { Title, Text, Paragraph } = Typography;

// 角色跳转映射
const ROLE_PAGE: Record<AIRole, AppPage> = {
  scout: 'ai-scout',
  sage: 'ai-sage',
  maker: 'ai-maker',
  butler: 'ai-butler',
};

const AppCenter: React.FC = () => {
  const { t, lang } = useI18n();

  // 类别元信息（标签跟随语言切换）
  const categoryMeta = useMemo<Record<SkillCategory, { label: string; color: string }>>(
    () => ({
      analysis: { label: t('appCenter.cat.analysis'), color: 'blue' },
      writing: { label: t('appCenter.cat.writing'), color: 'geekblue' },
      coding: { label: t('appCenter.cat.coding'), color: 'cyan' },
      marketing: { label: t('appCenter.cat.marketing'), color: 'magenta' },
      knowledge: { label: t('appCenter.cat.knowledge'), color: 'green' },
      office: { label: t('appCenter.cat.office'), color: 'orange' },
      design: { label: t('appCenter.cat.design'), color: 'purple' },
      finance: { label: t('appCenter.cat.finance'), color: 'gold' },
      product: { label: t('appCenter.cat.product'), color: 'red' },
      automation: { label: t('appCenter.cat.automation'), color: 'lime' },
      custom: { label: t('appCenter.cat.custom'), color: 'default' },
    }),
    [lang]
  );

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all');
  const skills = useSkillStore((s) => s.skills);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const currentRole = useAIStore((s) => s.currentRole);

  const filtered = skills.filter((s) => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory;
    const matchQ =
      !query.trim() ||
      s.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      s.description.toLowerCase().includes(query.trim().toLowerCase());
    return matchCat && matchQ;
  });

  const handleUse = (skill: (typeof skills)[number]) => {
    // 跳转到对应角色对话页，并提示使用触发命令
    setCurrentPage(ROLE_PAGE[currentRole]);
    message.success(
      t('appCenter.switchedMessage', {
        role: t(`roles.${currentRole}`),
        command: skill.triggerCommand,
        condition: skill.autoTriggers?.[0]?.condition || skill.name,
      })
    );
  };

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          <AppstoreOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          {t('appCenter.title')}
        </Title>
        <Text type="secondary">{t('appCenter.subtitle')}</Text>
      </div>

      {/* 搜索与分类 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('appCenter.searchPlaceholder')}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
          />
          <Segmented
            value={activeCategory}
            onChange={(v) => setActiveCategory(v as SkillCategory | 'all')}
            options={[
              { label: t('appCenter.cat.all'), value: 'all' },
              ...(Object.keys(categoryMeta) as SkillCategory[]).map((c) => ({
                label: categoryMeta[c].label,
                value: c,
              })),
            ]}
          />
        </Space>
      </Card>

      {/* 应用卡片 */}
      {filtered.length === 0 ? (
        <Empty description={t('appCenter.empty')} style={{ padding: 40 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map((skill) => (
            <Card
              key={skill.id}
              size="small"
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button
                  key="use"
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleUse(skill)}
                >
                  {t('appCenter.use')}
                </Button>,
              ]}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space>
                  <RocketOutlined style={{ color: categoryMeta[skill.category]?.color || '#1677ff', fontSize: 16 }} />
                  <Text strong style={{ fontSize: 14 }}>{skill.name}</Text>
                  <Tag color={categoryMeta[skill.category]?.color || 'default'} style={{ fontSize: 10 }}>
                    {categoryMeta[skill.category]?.label || skill.category}
                  </Tag>
                </Space>
                <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }} ellipsis={{ rows: 2 }}>
                  {skill.description}
                </Paragraph>
                <Space size={4}>
                  <Tag style={{ fontSize: 10, color: '#722ed1', borderColor: '#d3adf7', background: '#f9f0ff' }}>
                    {skill.triggerCommand}
                  </Tag>
                  {skill.autoTriggers && skill.autoTriggers.length > 0 && (
                    <Tag icon={<ThunderboltOutlined />} style={{ fontSize: 10 }} color="orange">
                      {t('appCenter.autoTrigger')}
                    </Tag>
                  )}
                  {!skill.isEnabled && <Tag style={{ fontSize: 10 }} color="default">{t('appCenter.disabled')}</Tag>}
                </Space>
              </Space>
            </Card>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ToolOutlined /> {t('appCenter.footer', { count: skills.length })}
        </Text>
      </div>
    </div>
  );
};

export default AppCenter;
