/**
 * 协作编辑器 - 内容类型选择 + AI 生成 + 版本管理
 */

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Button,
  Typography,
  Input,
  Form,
  Select,
  Card,
  Tabs,
  Spin,
  message,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  SaveOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMakerStore } from '../store/makerStore';
import type { ContentPiece, ContentVersion } from '../services/makerService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const CONTENT_TYPES = [
  { value: 'marketing', label: '营销文案' },
  { value: 'social_media', label: '社交媒体' },
  { value: 'video_script', label: '短视频脚本' },
  { value: 'product_desc', label: '产品描述' },
  { value: 'brand_story', label: '品牌故事' },
];

const CollabEditor: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const spaceId = searchParams.get('spaceId');

  const {
    currentContent,
    currentContentLoading,
    versions,
    versionsLoading,
    generateContent,
    saveContent,
    fetchVersions,
    addVersion,
  } = useMakerStore();

  const [contentType, setContentType] = useState<ContentPiece['type']>('marketing');
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [editContent, setEditContent] = useState('');
  const [activeVersionKey, setActiveVersionKey] = useState('current');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // 当 currentContent 变化时，同步编辑区内容
  useEffect(() => {
    if (currentContent) {
      setEditContent(currentContent.content);
      setContentType(currentContent.type);
      setProductName(currentContent.productName);
      setFeatures(currentContent.features);
      setTargetAudience(currentContent.targetAudience);
      // 加载版本历史
      fetchVersions(currentContent.id);
    }
  }, [currentContent, fetchVersions]);

  const handleGenerate = async () => {
    if (!productName) {
      message.warning('请输入产品名称');
      return;
    }
    setGenerating(true);
    try {
      const content = await generateContent({
        spaceId: spaceId ? Number(spaceId) : undefined,
        type: contentType,
        productName,
        features,
        targetAudience,
      });
      setEditContent(content.content);
      setActiveVersionKey('current');
      message.success('AI 内容生成成功');
    } catch (err: any) {
      message.error(err.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentContent) {
      message.warning('请先生成内容');
      return;
    }
    setSaving(true);
    try {
      await saveContent(currentContent.id, { content: editContent });
      message.success('保存成功');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleVersionClick = async (version: ContentVersion) => {
    setEditContent(version.content);
    setActiveVersionKey(`v${version.id}`);
  };

  const handleCreateVersion = async () => {
    if (!currentContent) return;
    try {
      await addVersion(currentContent.id, editContent);
      message.success('版本已保存');
      fetchVersions(currentContent.id);
    } catch (err: any) {
      message.error(err.message || '保存版本失败');
    }
  };

  const versionTabs = [
    {
      key: 'current',
      label: '当前版本',
      children: null,
    },
    ...versions.map((v) => ({
      key: `v${v.id}`,
      label: `v${v.version} (${new Date(v.createdAt).toLocaleString('zh-CN')})`,
      children: null,
    })),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          {currentContent?.title || '内容编辑器'}
        </Title>
        <div style={{ flex: 1 }} />
        <Space>
          <Button
            icon={<HistoryOutlined />}
            onClick={handleCreateVersion}
            disabled={!currentContent}
          >
            保存版本
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            disabled={!currentContent}
          >
            保存
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* 内容类型选择 */}
          <Card title="内容类型" style={{ marginBottom: 16 }}>
            <Select
              value={contentType}
              onChange={setContentType}
              style={{ width: '100%' }}
              options={CONTENT_TYPES}
              size="large"
            />
          </Card>

          {/* 产品信息表单 */}
          <Card title="产品信息" style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Form.Item label="产品名称" required>
                <Input
                  placeholder="请输入产品名称"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="产品特点">
                <TextArea
                  placeholder="请输入产品特点（可选）"
                  rows={2}
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="目标受众">
                <Input
                  placeholder="请输入目标受众（可选）"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={generating}
                onClick={handleGenerate}
                block
                size="large"
              >
                AI 生成内容
              </Button>
            </Form>
          </Card>

          {/* 内容展示与编辑区 */}
          <Card title="内容编辑" style={{ marginBottom: 16 }}>
            <Spin spinning={currentContentLoading}>
              {versions.length > 0 && (
                <Tabs
                  activeKey={activeVersionKey}
                  onChange={(key) => {
                    setActiveVersionKey(key);
                    if (key !== 'current') {
                      const versionId = Number(key.replace('v', ''));
                      const version = versions.find((v) => v.id === versionId);
                      if (version) handleVersionClick(version);
                    } else if (currentContent) {
                      setEditContent(currentContent.content);
                    }
                  }}
                  items={versionTabs}
                  style={{ marginBottom: 16 }}
                />
              )}
              <TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="AI 生成的内容将显示在这里，你也可以直接编辑..."
                style={{ minHeight: 300, fontSize: 14, lineHeight: 1.8 }}
              />
            </Spin>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default CollabEditor;
