/**
 * 模型列表组件
 * 显示已配置的模型列表
 */

import React from 'react';
import {
  Button,
  Card,
  Empty,
  Space,
  Switch,
  Tag,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAIStore } from '../store/aiStore';
import { useI18n } from '../i18n';
import type { ModelConfig } from '../types';

const { Text, Title } = Typography;

interface ModelListProps {
  onAddModel: () => void;
  onEditModel: (config: ModelConfig) => void;
}

const ModelList: React.FC<ModelListProps> = ({ onAddModel, onEditModel }) => {
  const { t } = useI18n();
  const { modelConfigs, deleteModelConfig, toggleModelConfig } = useAIStore();

  // 按 provider 分组
  const groupedModels = modelConfigs.reduce((acc, config) => {
    if (!acc[config.provider]) {
      acc[config.provider] = [];
    }
    acc[config.provider].push(config);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>
          {t('model.title')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddModel}>
          {t('model.add')}
        </Button>
      </div>

      {modelConfigs.length === 0 ? (
        <Empty
          description={t('model.empty')}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {Object.entries(groupedModels).map(([provider, configs]) => (
            <Card
              key={provider}
              size="small"
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#1677ff' }} />
                  <Text strong>{provider}</Text>
                  <Tag color="blue">{t('model.count', { count: configs.length })}</Tag>
                </Space>
              }
              style={{ background: '#fafafa' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {configs.map((config) => (
                  <div
                    key={config.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Space>
                      <Text style={{ fontSize: 13 }}>{config.name}</Text>
                      {config.isCustom && <Tag color="orange">{t('model.custom')}</Tag>}
                      {config.multimodal && <Tag color="green">{t('model.multimodal')}</Tag>}
                    </Space>
                    <Space>
                      <Switch
                        size="small"
                        checked={config.isEnabled}
                        onChange={() => toggleModelConfig(config.id)}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEditModel(config)}
                      />
                      <Popconfirm
                        title={t('model.deleteConfirm')}
                        onConfirm={() => deleteModelConfig(config.id)}
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
};

export default ModelList;
