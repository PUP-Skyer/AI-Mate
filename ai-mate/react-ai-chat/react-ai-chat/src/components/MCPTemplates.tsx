/**
 * MCP 市场模板组件
 * 展示热门 MCP 服务器模板，支持一键添加
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Row,
  Col,
  Tooltip,
  Badge,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  SearchOutlined,
  StarFilled,
  CodeOutlined,
  DatabaseOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useMCPStore } from '../store/mcpStore';
import { useI18n } from '../i18n';
import type { MCPServerTemplate, MCPCategory } from '../store/mcpStore';
import {
  MCP_TEMPLATES,
  MCP_CATEGORY_LABELS,
  MCP_CATEGORY_COLORS,
} from '../store/mcpStore';

const { Text, Paragraph } = Typography;

const CATEGORY_ICONS: Record<MCPCategory, React.ReactNode> = {
  development: <CodeOutlined />,
  data: <DatabaseOutlined />,
  communication: <MessageOutlined />,
  productivity: <ThunderboltOutlined />,
  ai: <RobotOutlined />,
  media: <VideoCameraOutlined />,
  finance: <DollarOutlined />,
  custom: <AppstoreOutlined />,
};

interface MCPTemplatesProps {
  onBack: () => void;
}

const MCPTemplates: React.FC<MCPTemplatesProps> = ({ onBack }) => {
  const { t } = useI18n();
  const { servers, addServerFromTemplate } = useMCPStore();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<MCPCategory | 'all'>('all');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // 已添加的模板名称集合（用于标记）
  const existingNames = new Set(servers.map((s) => s.name));

  // 过滤逻辑
  const filtered = MCP_TEMPLATES.filter((tpl) => {
    const matchSearch =
      !searchText ||
      tpl.name.toLowerCase().includes(searchText.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = activeCategory === 'all' || tpl.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const handleAdd = (tpl: MCPServerTemplate) => {
    addServerFromTemplate(tpl);
    setAddedIds((prev) => new Set(prev).add(tpl.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(tpl.id);
        return next;
      });
    }, 2000);
  };

  const categories: { key: MCPCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: t('mcp.categoryAll'), icon: <AppstoreOutlined /> },
    ...Object.entries(MCP_CATEGORY_LABELS).map(([key, label]) => ({
      key: key as MCPCategory,
      label,
      icon: CATEGORY_ICONS[key as MCPCategory],
    })),
  ];

  return (
    <div>
      {/* 顶部搜索栏 */}
      <div style={{ marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder={t('mcp.searchPlaceholder')}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Space wrap size={[8, 8]}>
          {categories.map((cat) => (
            <Tag
              key={cat.key}
              color={activeCategory === cat.key ? 'blue' : undefined}
              style={{
                cursor: 'pointer',
                padding: '4px 12px',
                fontSize: 13,
                border: activeCategory === cat.key ? undefined : '1px solid #d9d9d9',
              }}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.icon} {cat.label}
            </Tag>
          ))}
        </Space>
      </div>

      {/* 热门标记 */}
      {activeCategory === 'all' && !searchText && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <StarFilled style={{ color: '#faad14' }} />
            <Text strong style={{ fontSize: 14 }}>{t('mcp.hotRecommended')}</Text>
          </Space>
        </div>
      )}

      {/* 模板卡片网格 */}
      {filtered.length === 0 ? (
        <Empty description={t('mcp.noMatch')} style={{ padding: '40px 0' }} />
      ) : (
        <Row gutter={[12, 12]}>
          {filtered.map((tpl) => {
            const isAdded = addedIds.has(tpl.id);
            const isExisting = existingNames.has(tpl.name);

            return (
              <Col xs={24} sm={12} key={tpl.id}>
                <Card
                  size="small"
                  styles={{ body: { padding: 16 } }}
                  style={{
                    border: tpl.popular ? '1px solid #91caff' : '1px solid #f0f0f0',
                    background: tpl.popular ? '#f0f7ff' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: '#f0f5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1677ff',
                          fontSize: 16,
                        }}
                      >
                        {CATEGORY_ICONS[tpl.category]}
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {tpl.name}
                          {tpl.popular && <StarFilled style={{ color: '#faad14', fontSize: 12 }} />}
                        </Text>
                        <Tag
                          color={MCP_CATEGORY_COLORS[tpl.category]}
                          style={{ fontSize: 11, marginTop: 2 }}
                        >
                          {MCP_CATEGORY_LABELS[tpl.category]}
                        </Tag>
                      </div>
                    </div>
                    <Tooltip title={isExisting ? t('mcp.added') : t('mcp.oneClickAdd')}>
                      <Button
                        type={isAdded ? 'default' : 'primary'}
                        size="small"
                        icon={isAdded ? <CheckOutlined /> : <PlusOutlined />}
                        disabled={isAdded}
                        onClick={() => handleAdd(tpl)}
                      >
                        {isAdded ? t('mcp.added') : t('common.add')}
                      </Button>
                    </Tooltip>
                  </div>

                  <Paragraph
                    type="secondary"
                    style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {tpl.description}
                  </Paragraph>

                  {/* 工具列表 */}
                  <Space size="small" wrap>
                    {tpl.tools.slice(0, 4).map((tool) => (
                      <Tag key={tool.name} style={{ fontSize: 11 }}>
                        {tool.name}
                      </Tag>
                    ))}
                    {tpl.tools.length > 4 && (
                      <Tag style={{ fontSize: 11 }}>+{tpl.tools.length - 4}</Tag>
                    )}
                  </Space>

                  {/* 环境变量提示 */}
                  {tpl.envHints && tpl.envHints.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {t('mcp.requires')}: {tpl.envHints.map((h) => h.key).join(', ')}
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default MCPTemplates;
