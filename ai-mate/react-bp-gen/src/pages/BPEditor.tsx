/**
 * Sage（军师）- 文档编辑器
 * 左侧章节导航 + 中间内容编辑 + 右侧 AI 助手面板
 */

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Button,
  Typography,
  Input,
  Menu,
  Space,
  message,
  Spin,
  Tooltip,
  Card,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  RobotOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useSageStore } from '../store/sageStore';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const BPEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentDocument,
    currentDocumentLoading,
    fetchDocument,
    activeSectionId,
    setActiveSectionId,
    updateSectionContent,
    generatingSectionId,
    generateSectionAI,
    saveCurrentDocument,
    updateDocumentTitle,
  } = useSageStore();
  const [aiContext, setAiContext] = useState('');
  const [saving, setSaving] = useState(false);

  // 加载文档
  useEffect(() => {
    if (id && id !== 'new') {
      fetchDocument(id);
    }
    return () => {
      // 离开时重置
      useSageStore.setState({ activeSectionId: null });
    };
  }, [id, fetchDocument]);

  // 默认选中第一个章节
  useEffect(() => {
    if (currentDocument && !activeSectionId && currentDocument.sections.length > 0) {
      setActiveSectionId(currentDocument.sections[0].id);
    }
  }, [currentDocument, activeSectionId, setActiveSectionId]);

  const activeSection = currentDocument?.sections.find(
    (s) => s.id === activeSectionId
  );

  const handleSave = async () => {
    if (!currentDocument) return;
    setSaving(true);
    try {
      await saveCurrentDocument();
      message.success('保存成功');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!currentDocument || !activeSectionId || generatingSectionId) return;
    try {
      const context = aiContext || '请根据文档类型和章节标题生成专业内容。';
      await generateSectionAI(currentDocument.id, activeSectionId, context);
      message.success('AI 生成完成');
    } catch (err: any) {
      message.error(err.message || 'AI 生成失败');
    }
  };

  if (currentDocumentLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="加载文档中..." />
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Title level={4}>请先从模板列表创建文档</Title>
          <Button type="primary" onClick={() => navigate('/templates')}>
            前往模板列表
          </Button>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部栏 */}
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
          onClick={() => navigate('/templates')}
          style={{ marginRight: 16 }}
        />
        <Input
          value={currentDocument.title}
          onChange={(e) => updateDocumentTitle(e.target.value)}
          style={{
            maxWidth: 300,
            border: 'none',
            boxShadow: 'none',
            fontWeight: 'bold',
            fontSize: 16,
          }}
        />
        <div style={{ flex: 1 }} />
        <Space>
          <Button
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/preview/${currentDocument.id}`)}
          >
            预览
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={() => navigate(`/review/${currentDocument.id}`)}
          >
            AI 评审
          </Button>
        </Space>
      </Header>

      <Layout>
        {/* 左侧：章节导航 */}
        <Sider
          width={240}
          style={{
            background: '#fafafa',
            borderRight: '1px solid #f0f0f0',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text strong>章节目录</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {currentDocument.sections.length} 章
            </Text>
          </div>
          <Menu
            mode="inline"
            selectedKeys={activeSectionId ? [activeSectionId] : []}
            onClick={({ key }) => setActiveSectionId(key)}
            style={{ border: 'none', background: 'transparent' }}
            items={currentDocument.sections.map((section) => ({
              key: section.id,
              label: (
                <span>
                  {section.order}. {section.title}
                  {section.content && (
                    <CheckCircleOutlined
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color:
                          section.status === 'ai_generated'
                            ? '#1890ff'
                            : '#52c41a',
                      }}
                    />
                  )}
                </span>
              ),
            }))}
          />
        </Sider>

        {/* 中间：内容编辑区 */}
        <Content style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {activeSection ? (
            <>
              {/* 章节标题栏 */}
              <div
                style={{
                  padding: '16px 32px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Title level={4} style={{ margin: 0 }}>
                  {activeSection.order}. {activeSection.title}
                </Title>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activeSection.content.length} 字
                  </Text>
                </Space>
              </div>

              {/* 编辑区 */}
              <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <TextArea
                  placeholder="请输入内容，或使用右侧 AI 助手生成..."
                  value={activeSection.content}
                  onChange={(e) =>
                    updateSectionContent(activeSection.id, e.target.value)
                  }
                  style={{
                    minHeight: 500,
                    fontSize: 14,
                    lineHeight: 1.8,
                    resize: 'vertical',
                  }}
                  disabled={generatingSectionId === activeSection.id}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              请从左侧选择一个章节开始编辑
            </div>
          )}
        </Content>

        {/* 右侧：AI 助手面板 */}
        <Sider
          width={300}
          style={{
            background: '#fafafa',
            borderLeft: '1px solid #f0f0f0',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <span>
                <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                AI 助手
              </span>
            }
          >
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              为当前章节提供背景信息，AI 将根据上下文生成专业内容。
            </Paragraph>
            <TextArea
              placeholder="输入背景信息（可选）&#10;例如：公司是一家做 AI SaaS 的创业公司，目标客户是中小企业..."
              value={aiContext}
              onChange={(e) => setAiContext(e.target.value)}
              style={{ marginBottom: 12, minHeight: 100 }}
              disabled={!!generatingSectionId}
            />
            <Button
              type="primary"
              block
              icon={
                generatingSectionId ? (
                  <LoadingOutlined />
                ) : (
                  <BulbOutlined />
                )
              }
              onClick={handleAIGenerate}
              loading={!!generatingSectionId}
              disabled={!activeSectionId}
            >
              {generatingSectionId ? 'AI 生成中...' : 'AI 生成'}
            </Button>
          </Card>

          {/* 章节完成进度 */}
          <Card size="small" title="章节进度">
            <div style={{ fontSize: 13 }}>
              {currentDocument.sections.map((section) => {
                const done = !!section.content;
                return (
                  <div
                    key={section.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: done ? '#333' : '#bbb',
                        textDecoration: done ? 'none' : 'none',
                      }}
                    >
                      {section.order}. {section.title}
                    </Text>
                    {done ? (
                      <CheckCircleOutlined
                        style={{ fontSize: 12, color: '#52c41a' }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          border: '1px solid #d9d9d9',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                已完成{' '}
                {currentDocument.sections.filter((s) => s.content).length} /{' '}
                {currentDocument.sections.length} 章
              </Text>
            </div>
          </Card>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default BPEditor;
