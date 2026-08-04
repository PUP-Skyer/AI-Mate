/**
 * 任务看板 - 三列看板视图（待处理/进行中/已完成）
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Layout,
  Button,
  Typography,
  Card,
  Tag,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMakerStore } from '../store/makerStore';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface Task {
  id: number;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

const statusConfig: Record<string, { title: string; color: string }> = {
  todo: { title: '待处理', color: '#d9d9d9' },
  in_progress: { title: '进行中', color: '#1890ff' },
  done: { title: '已完成', color: '#52c41a' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'red' },
};

// 本地模拟任务数据（MVP 阶段）
const MOCK_TASKS: Task[] = [
  { id: 1, title: '撰写产品介绍文案', assignee: '张三', priority: 'high', status: 'todo', createdAt: '2025-01-15' },
  { id: 2, title: '设计社交媒体海报', assignee: '李四', priority: 'medium', status: 'in_progress', createdAt: '2025-01-14' },
  { id: 3, title: '录制短视频脚本', assignee: '王五', priority: 'high', status: 'todo', createdAt: '2025-01-13' },
  { id: 4, title: '审核品牌故事初稿', assignee: '张三', priority: 'medium', status: 'done', createdAt: '2025-01-12' },
  { id: 5, title: '优化产品描述页面', assignee: '赵六', priority: 'low', status: 'in_progress', createdAt: '2025-01-11' },
];

const TaskBoard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleCreateTask = async (values: any) => {
    setCreating(true);
    try {
      // MVP: 本地添加
      const newTask: Task = {
        id: Date.now(),
        title: values.title,
        assignee: values.assignee || '未分配',
        priority: values.priority || 'medium',
        status: 'todo',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setTasks((prev) => [newTask, ...prev]);
      message.success('任务创建成功');
      setModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    message.success('任务已删除');
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = useCallback((e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = Number(e.dataTransfer.getData('taskId'));
    if (!taskId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    );
    message.success('任务状态已更新');
  }, []);

  const columns = (['todo', 'in_progress', 'done'] as const).map((status) => ({
    key: status,
    title: statusConfig[status].title,
    color: statusConfig[status].color,
    items: tasks.filter((t) => t.status === status),
  }));

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
          任务看板
        </Title>
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          新建任务
        </Button>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5', overflowX: 'auto' }}>
        <Row gutter={16} style={{ minWidth: 900 }}>
          {columns.map((col) => (
            <Col xs={24} sm={8} key={col.key}>
              <div
                style={{
                  background: dragOverColumn === col.key ? '#e6f7ff' : '#f5f5f5',
                  borderRadius: 8,
                  padding: '12px',
                  minHeight: 400,
                  transition: 'background 0.2s',
                  border: `2px dashed ${dragOverColumn === col.key ? '#1890ff' : 'transparent'}`,
                }}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${col.color}`,
                  }}
                >
                  <Text strong style={{ flex: 1 }}>
                    {col.title}
                  </Text>
                  <Tag>{col.items.length}</Tag>
                </div>
                {col.items.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    style={{
                      marginBottom: 8,
                      cursor: 'grab',
                      borderLeft: `3px solid ${
                        priorityConfig[task.priority]?.color === 'red'
                          ? '#ff4d4f'
                          : priorityConfig[task.priority]?.color === 'blue'
                          ? '#1890ff'
                          : '#d9d9d9'
                      }`,
                    }}
                    hoverable
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <Text strong>{task.title}</Text>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {task.assignee}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag
                          color={priorityConfig[task.priority]?.color || 'default'}
                          style={{ fontSize: 11 }}
                        >
                          {priorityConfig[task.priority]?.label || task.priority}
                        </Tag>
                        <Button
                          type="link"
                          danger
                          size="small"
                          style={{ padding: 0, fontSize: 11 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Col>
          ))}
        </Row>
      </Content>

      <Modal
        title="新建任务"
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
        <Form form={form} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" maxLength={200} />
          </Form.Item>
          <Form.Item name="assignee" label="负责人">
            <Input placeholder="请输入负责人（可选）" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default TaskBoard;
