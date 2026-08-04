/**
 * 协作空间列表 - 空间卡片网格视图
 */

import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Row, Col, Button, Input, Modal, Form, Spin, Empty, message } from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMakerStore } from '../store/makerStore';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const CollabSpace: React.FC = () => {
  const navigate = useNavigate();
  const { spaces, spacesLoading, fetchSpaces, addSpace } = useMakerStore();
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const filteredSpaces = spaces.filter(
    (s) =>
      s.name.includes(searchText) ||
      (s.description && s.description.includes(searchText))
  );

  const handleCreate = async (values: { name: string; description?: string }) => {
    setCreating(true);
    try {
      const space = await addSpace(values.name, values.description);
      message.success('空间创建成功');
      setModalOpen(false);
      form.resetFields();
      navigate(`/editor?spaceId=${space.id}`);
    } catch (err: any) {
      message.error(err.message || '创建失败');
    } finally {
      setCreating(false);
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
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          协作空间
        </Title>
        <Input
          placeholder="搜索空间..."
          style={{ maxWidth: 300, marginRight: 16 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          新建空间
        </Button>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Spin spinning={spacesLoading}>
          {filteredSpaces.length === 0 && !spacesLoading ? (
            <Empty description="暂无空间，点击右上角创建" style={{ marginTop: 100 }} />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredSpaces.map((space) => (
                <Col xs={24} sm={12} md={8} lg={6} key={space.id}>
                  <Card
                    hoverable
                    style={{ height: '100%' }}
                    onClick={() => navigate(`/editor?spaceId=${space.id}`)}
                  >
                    <Card.Meta
                      title={space.name}
                      description={space.description || '暂无描述'}
                    />
                    <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <FileTextOutlined style={{ marginRight: 4 }} />
                        {space.contentCount} 个内容
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined style={{ marginRight: 4 }} />
                        {space.memberCount} 位成员
                      </Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        更新于{' '}
                        {space.updatedAt
                          ? new Date(space.updatedAt).toLocaleString('zh-CN')
                          : '-'}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Content>

      <Modal
        title="新建空间"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="空间名称"
            rules={[{ required: true, message: '请输入空间名称' }]}
          >
            <Input placeholder="请输入空间名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="空间描述">
            <Input.TextArea
              placeholder="请输入空间描述（可选）"
              rows={3}
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default CollabSpace;
