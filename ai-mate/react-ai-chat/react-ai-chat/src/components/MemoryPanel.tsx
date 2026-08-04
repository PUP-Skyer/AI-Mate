/**
 * 记忆管理面板
 * 参考 EvoFlow Memory System：
 *   - 展示已记忆的事实（按置信度排序）
 *   - 支持手动添加、删除、清空
 * 记忆自动从对话中提取（后端 extractMemoryAsync），此处提供可视化管控入口。
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Input,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  ClearOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { fetchMemory, addMemoryFact, deleteMemoryFact, clearMemory, type MemoryData } from '../services/memoryService';
import { useI18n } from '../i18n';

const { Text, Title } = Typography;

interface MemoryPanelProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  preference: 'magenta',
  knowledge: 'blue',
  context: 'green',
  behavior: 'orange',
  goal: 'purple',
};

const MemoryPanel: React.FC<MemoryPanelProps> = ({ open, onClose }) => {
  const { t } = useI18n();

  const categoryLabels: Record<string, string> = {
    preference: t('memory.cat.preference'),
    knowledge: t('memory.cat.knowledge'),
    context: t('memory.cat.context'),
    behavior: t('memory.cat.behavior'),
    goal: t('memory.cat.goal'),
  };

  const [memory, setMemory] = useState<MemoryData>({ workContext: '', personalContext: '', topOfMind: '', facts: [] });
  const [loading, setLoading] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<string>('context');

  const loadMemory = useCallback(async () => {
    setLoading(true);
    const data = await fetchMemory(50);
    setMemory(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadMemory();
  }, [open, loadMemory]);

  const handleAdd = async () => {
    if (!newFact.trim()) return;
    const ok = await addMemoryFact(newFact.trim(), newCategory);
    if (ok) {
      message.success(t('memory.addSuccess'));
      setNewFact('');
      loadMemory();
    } else {
      message.error(t('memory.addFailed'));
    }
  };

  const handleDelete = async (factId: string) => {
    const ok = await deleteMemoryFact(factId);
    if (ok) {
      message.success(t('memory.deleteSuccess'));
      loadMemory();
    }
  };

  const handleClear = async () => {
    const ok = await clearMemory();
    if (ok) {
      message.success(t('memory.clearSuccess'));
      loadMemory();
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <BulbOutlined style={{ color: '#722ed1' }} />
          <span>{t('memory.title')}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={440}
    >
      {/* 顶部说明 */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('memory.desc')}
        </Text>
      </div>

      {/* 上下文概要 */}
      {(memory.workContext || memory.personalContext || memory.topOfMind) && (
        <div
          style={{
            background: '#f9f0ff',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <Title level={5} style={{ margin: '0 0 8px', fontSize: 13 }}>{t('memory.context')}</Title>
          {memory.workContext && <Text style={{ fontSize: 12, display: 'block' }}>{t('memory.work')}：{memory.workContext}</Text>}
          {memory.personalContext && <Text style={{ fontSize: 12, display: 'block' }}>{t('memory.personal')}：{memory.personalContext}</Text>}
          {memory.topOfMind && <Text style={{ fontSize: 12, display: 'block' }}>{t('memory.topOfMind')}：{memory.topOfMind}</Text>}
        </div>
      )}

      {/* 手动添加 */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          {t('memory.addFact')}
        </Text>
        <Space.Compact style={{ width: '100%' }}>
          <Select
            value={newCategory}
            onChange={setNewCategory}
            style={{ width: 90 }}
            options={Object.keys(categoryLabels).map((k) => ({
              value: k,
              label: categoryLabels[k],
            }))}
          />
          <Input
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            placeholder={t('memory.placeholder')}
            onPressEnter={handleAdd}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!newFact.trim()}>
            {t('memory.record')}
          </Button>
        </Space.Compact>
      </div>

      {/* 事实列表 */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text strong style={{ fontSize: 13 }}>
            {t('memory.facts', { count: memory.facts.length })}
          </Text>
          {memory.facts.length > 0 && (
            <Popconfirm title={t('memory.clearConfirm')} onConfirm={handleClear}>
              <Button size="small" icon={<ClearOutlined />} danger type="text">
                {t('memory.clearAll')}
              </Button>
            </Popconfirm>
          )}
        </div>

        {memory.facts.length === 0 ? (
          <Empty
            description={t('memory.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 20 }}
          />
        ) : (
          <List
            loading={loading}
            dataSource={memory.facts}
            renderItem={(fact) => (
              <List.Item
                key={fact.id}
                actions={[
                  <Popconfirm
                    key="del"
                    title={t('memory.deleteConfirm')}
                    onConfirm={() => handleDelete(fact.id)}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 2 }}>
                    <Tag color={CATEGORY_COLORS[fact.category] || 'default'} style={{ fontSize: 11 }}>
                      {categoryLabels[fact.category] || fact.category}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {t('memory.confidence', { percent: (fact.confidence * 100).toFixed(0) })}
                    </Text>
                  </div>
                  <Text style={{ fontSize: 13 }}>{fact.content}</Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  );
};

export default MemoryPanel;
