/**
 * Sage（军师）- 文档预览页
 * 只读视图，支持打印/导出
 */

import React, { useEffect } from 'react';
import { Layout, Button, Typography, Card, Divider, Spin, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useSageStore } from '../store/sageStore';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BPPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentDocument, currentDocumentLoading, fetchDocument } = useSageStore();

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id, fetchDocument]);

  const handlePrint = () => {
    window.print();
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
          <Empty description="文档不存在" />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/templates')}
          >
            返回模板列表
          </Button>
        </Content>
      </Layout>
    );
  }

  const hasContent = currentDocument.sections.some((s) => s.content);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        className="no-print"
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
          onClick={() => navigate(`/editor/${id}`)}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          预览 - {currentDocument.title}
        </Title>
        <div style={{ flex: 1 }} />
        <Button
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          style={{ marginRight: 8 }}
        >
          打印/导出
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/editor/${id}`)}
        >
          返回编辑
        </Button>
      </Header>
      <Content style={{ padding: '40px', background: '#f5f5f5' }}>
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center' }}>
            {currentDocument.title}
          </Title>
          <Paragraph
            type="secondary"
            style={{ textAlign: 'center', marginBottom: 24 }}
          >
            {currentDocument.description || ''}
          </Paragraph>
          <Divider />

          {!hasContent ? (
            <Empty description="文档暂无内容，请在编辑器中填写" />
          ) : (
            currentDocument.sections.map((section, index) => (
              <div key={section.id} style={{ marginBottom: 32 }}>
                <Title level={3}>
                  {section.order}. {section.title}
                </Title>
                {section.content ? (
                  <div
                    style={{
                      color: '#333',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      fontSize: 14,
                    }}
                  >
                    {section.content}
                  </div>
                ) : (
                  <Text type="secondary">
                    （此章节暂无内容）
                  </Text>
                )}
                {index < currentDocument.sections.length - 1 && <Divider />}
              </div>
            ))
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default BPPreview;
