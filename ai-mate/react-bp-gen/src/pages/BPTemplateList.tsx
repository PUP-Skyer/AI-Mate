/**
 * Sage（军师）- 模板列表页
 * 展示预设模板卡片，支持创建新文档
 */

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Input,
  Button,
  Spin,
  Empty,
  message,
  List,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSageStore } from '../store/sageStore';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TYPE_COLORS: Record<string, string> = {
  business_plan: 'blue',
  operation_strategy: 'green',
  marketing_plan: 'orange',
  growth_report: 'purple',
  industry_analysis: 'cyan',
};

const BPTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const {
    templates,
    fetchTemplates,
    documents,
    documentsLoading,
    fetchDocuments,
    createNewDocument,
    removeDocument,
  } = useSageStore();
  const [searchText, setSearchText] = useState('');
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchDocuments();
  }, [fetchTemplates, fetchDocuments]);

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.includes(searchText) ||
      t.description.includes(searchText) ||
      t.typeLabel.includes(searchText)
  );

  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setCreating(templateId);
    try {
      const doc = await createNewDocument({
        title: template.title,
        type: template.type,
        templateId: template.id,
      });
      message.success('文档创建成功');
      navigate(`/editor/${doc.id}`);
    } catch (err: any) {
      message.error(err.message || '创建文档失败');
    } finally {
      setCreating(null);
    }
  };

  const handleCreateBlank = async () => {
    setCreating('blank');
    try {
      const doc = await createNewDocument({
        title: '未命名文档',
        type: 'custom',
      });
      message.success('空白文档创建成功');
      navigate(`/editor/${doc.id}`);
    } catch (err: any) {
      message.error(err.message || '创建文档失败');
    } finally {
      setCreating(null);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await removeDocument(id);
      message.success('文档已删除');
    } catch (err: any) {
      message.error(err.message || '删除失败');
    }
  };

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
        <RobotOutlined style={{ fontSize: 24, marginRight: 12, color: '#1890ff' }} />
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          军师 - 智能文档生成
        </Title>
        <Input
          placeholder="搜索模板..."
          prefix={<SearchOutlined />}
          style={{ maxWidth: 300, marginRight: 16 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateBlank}
          loading={creating === 'blank'}
        >
          从空白创建
        </Button>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        {/* 我的文档 */}
        {documents.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Title level={5} style={{ marginBottom: 16 }}>
              我的文档
            </Title>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => navigate(`/editor/${doc.id}`)}
                    actions={[
                      <EditOutlined
                        key="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editor/${doc.id}`);
                        }}
                      />,
                      <Popconfirm
                        key="delete"
                        title="确定删除此文档？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                      >
                        <DeleteOutlined
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#ff4d4f' }}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <Card.Meta
                      title={
                        <Text ellipsis style={{ maxWidth: 180 }}>
                          {doc.title}
                        </Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {doc.updatedAt
                            ? new Date(doc.updatedAt).toLocaleDateString('zh-CN')
                            : ''}
                        </Text>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* 模板库 */}
        <Title level={5} style={{ marginBottom: 16 }}>
          模板库
        </Title>
        <Spin spinning={false}>
          {filteredTemplates.length === 0 ? (
            <Empty description="暂无匹配的模板" style={{ marginTop: 100 }} />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredTemplates.map((template) => (
                <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    cover={
                      <div
                        style={{
                          height: 140,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 36, marginBottom: 8 }}>
                          {template.icon}
                        </span>
                        <Title
                          level={4}
                          style={{ color: '#fff', margin: 0 }}
                        >
                          {template.title}
                        </Title>
                      </div>
                    }
                    actions={[
                      <Button
                        type="link"
                        key="use"
                        onClick={() => handleUseTemplate(template.id)}
                        loading={creating === template.id}
                      >
                        使用此模板
                      </Button>,
                    ]}
                  >
                    <Tag color={TYPE_COLORS[template.type] || 'default'}>
                      {template.typeLabel}
                    </Tag>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ marginTop: 8, color: '#666', fontSize: 13 }}
                    >
                      {template.description}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      包含 {template.sections.length} 个章节
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Content>
    </Layout>
  );
};

export default BPTemplateList;
