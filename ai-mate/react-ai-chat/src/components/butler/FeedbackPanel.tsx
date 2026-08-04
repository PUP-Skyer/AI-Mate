/**
 * 问题反馈面板
 * 功能：提交问题反馈、查看反馈历史、处理状态追踪、附件上传、客服回复
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  List,
  Tag,
  Timeline,
  Badge,
  Empty,
  Space,
  message,
  Upload,
  Steps,
  Divider,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic,
  Modal,
  Image,
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RobotOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  EyeOutlined,
  HistoryOutlined,
  SyncOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Dragger } = Upload;

interface FeedbackItem {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  status: string;
  date: string;
  attachments: UploadFile[];
  statusHistory: {
    status: string;
    time: string;
    note: string;
    operator: string;
  }[];
  replies: { from: string; content: string; date: string }[];
}

const initialFeedbacks: FeedbackItem[] = [
  {
    id: 1,
    title: '保存报告AI功能问题',
    content: '点击保存按钮后没有反应，报告没有保存到个人资料中。已尝试多次刷新页面，问题依旧存在。',
    type: '功能问题',
    priority: '高',
    status: '已解决',
    date: '2024-03-01',
    attachments: [],
    statusHistory: [
      { status: '已提交', time: '2024-03-01 10:30', note: '用户提交了问题反馈', operator: '用户' },
      { status: '已受理', time: '2024-03-01 11:00', note: '客服已受理，正在排查问题', operator: '客服小王' },
      { status: '处理中', time: '2024-03-01 13:00', note: '技术团队正在修复该问题', operator: '技术部' },
      { status: '已解决', time: '2024-03-01 14:30', note: '问题已修复，请刷新页面后重试', operator: '客服小王' },
    ],
    replies: [
      { from: '客服小王', content: '感谢您的反馈，该问题已经由技术团队修复完成。请您刷新页面后重试，如果还有问题请随时联系我们。', date: '2024-03-01 14:30' },
    ],
  },
  {
    id: 2,
    title: 'AI生成内容质量有待提升',
    content: '使用工匠AI生成的内容有时不够准确，特别是涉及专业技术领域时。建议加强AI模型的专业知识训练。',
    type: '内容质量',
    priority: '中',
    status: '处理中',
    date: '2024-03-05',
    attachments: [],
    statusHistory: [
      { status: '已提交', time: '2024-03-05 09:00', note: '用户提交了内容质量反馈', operator: '用户' },
      { status: '已受理', time: '2024-03-05 10:00', note: '内容团队已接收并开始评估', operator: '内容团队' },
      { status: '处理中', time: '2024-03-05 14:00', note: '正在优化AI模型参数', operator: '内容团队' },
    ],
    replies: [],
  },
];

const FeedbackPanel: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    setTimeout(() => {
      const newFeedback: FeedbackItem = {
        id: Date.now(),
        title: values.title,
        content: values.content,
        type: values.type,
        priority: values.priority,
        status: '已提交',
        date: new Date().toLocaleDateString('zh-CN'),
        attachments: [...fileList],
        statusHistory: [
          { status: '已提交', time: new Date().toLocaleString('zh-CN'), note: '用户提交了问题反馈', operator: '用户' },
        ],
        replies: [],
      };
      setFeedbacks([newFeedback, ...feedbacks]);
      form.resetFields();
      setFileList([]);
      message.success('问题反馈提交成功，我们将尽快处理');
      setSubmitting(false);
    }, 1000);
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleViewDetail = (item: FeedbackItem) => {
    setSelectedFeedback(item);
    setIsDetailModalOpen(true);
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedFeedback) return;
    
    const updatedFeedbacks = feedbacks.map(item => {
      if (item.id === selectedFeedback.id) {
        return {
          ...item,
          replies: [
            ...item.replies,
            { from: '用户', content: replyContent, date: new Date().toLocaleString('zh-CN') }
          ]
        };
      }
      return item;
    });
    
    setFeedbacks(updatedFeedbacks);
    setSelectedFeedback({
      ...selectedFeedback,
      replies: [
        ...selectedFeedback.replies,
        { from: '用户', content: replyContent, date: new Date().toLocaleString('zh-CN') }
      ]
    });
    setReplyContent('');
    message.success('回复发送成功');
  };

  const getStatusStep = (status: string) => {
    const statusMap: Record<string, number> = {
      '已提交': 0,
      '已受理': 1,
      '处理中': 2,
      '已解决': 3,
    };
    return statusMap[status] || 0;
  };

  const priorityColors: Record<string, string> = {
    '高': 'red',
    '中': 'orange',
    '低': 'green',
  };

  const statusColors: Record<string, string> = {
    '已提交': 'default',
    '已受理': 'processing',
    '处理中': 'warning',
    '已解决': 'success',
  };

  // 统计数据
  const totalFeedbacks = feedbacks.length;
  const resolvedCount = feedbacks.filter(item => item.status === '已解决').length;
  const processingCount = feedbacks.filter(item => item.status === '处理中').length;
  const pendingCount = feedbacks.filter(item => item.status === '已提交').length;

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          <MessageOutlined style={{ marginRight: 8, color: '#10b981' }} />
          问题反馈
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>提交你在使用过程中遇到的问题，我们将及时处理并回复</p>
      </div>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="全部反馈"
              value={totalFeedbacks}
              prefix={<InboxOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="已提交"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              styles={{ content: { color: '#f59e0b', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="处理中"
              value={processingCount}
              prefix={<SyncOutlined style={{ color: '#a855f7' }} />}
              styles={{ content: { color: '#a855f7', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="已解决"
              value={resolvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />
              }
              styles={{ content: { color: '#10b981', fontWeight: 600 } }}
            />
          </Card>
        </Col>
      </Row>

      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        {/* 提交反馈表单 */}
        <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="title" label="反馈标题" rules={[{ required: true, message: '请输入反馈标题' }]}>
                  <Input placeholder="简要描述你遇到的问题" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="type" label="反馈类型" rules={[{ required: true }]}>
                  <Select placeholder="选择类型">
                    <Option value="功能问题">功能问题</Option>
                    <Option value="内容质量">内容质量</Option>
                    <Option value="性能问题">性能问题</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                  <Select placeholder="选择优先级">
                    <Option value="高">高 - 严重影响使用</Option>
                    <Option value="中">中 - 一般性问题</Option>
                    <Option value="低">低 - 改进建议</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="content" label="详细描述" rules={[{ required: true, message: '请输入详细描述' }]}>
              <TextArea rows={4} placeholder="详细描述你遇到的问题和复现步骤..." />
            </Form.Item>
            
            {/* 附件上传 */}
            <Form.Item label="上传附件（截图或日志文件）">
              <Dragger
                fileList={fileList}
                onChange={handleUploadChange}
                multiple
                beforeUpload={() => false}
                style={{ borderRadius: 8 }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#3b82f6', fontSize: 48 }} />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">
                  支持图片、PDF、Word等格式，单个文件不超过10MB
                </p>
              </Dragger>
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting} 
                icon={<SendOutlined />} 
                style={{ background: '#10b981', borderColor: '#10b981' }}
                size="large"
              >
                提交反馈
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 反馈历史 */}
        <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} title="反馈历史">
          {feedbacks.length === 0 ? (
            <Empty description="暂无反馈记录" />
          ) : (
            <List
              dataSource={feedbacks}
              renderItem={item => (
                <List.Item>
                  <Card 
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                    hoverable
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
                        <Space>
                          <Tag color={priorityColors[item.priority]}>{item.priority}优先级</Tag>
                          <Tag color={statusColors[item.status]}>{item.status}</Tag>
                          <Tag>{item.type}</Tag>
                        </Space>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.date}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{item.content}</div>
                    
                    {/* 附件展示 */}
                    {item.attachments.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          <PaperClipOutlined style={{ marginRight: 4 }} />
                          附件 ({item.attachments.length}个)
                        </Text>
                        <Space wrap>
                          {item.attachments.map((file, idx) => (
                            <Tag key={idx} icon={<FileTextOutlined />} style={{ borderRadius: 4 }}>
                              {file.name}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* 状态进度 */}
                    <div style={{ marginBottom: 12 }}>
                      <Steps
                        size="small"
                        current={getStatusStep(item.status)}
                        items={[
                          { title: '已提交', icon: <CheckCircleOutlined /> },
                          { title: '已受理', icon: <UserOutlined /> },
                          { title: '处理中', icon: <SyncOutlined /> },
                          { title: '已解决', icon: <CheckCircleOutlined /> },
                        ]}
                      />
                    </div>

                    {/* 客服回复 */}
                    {item.replies.length > 0 && (
                      <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <RobotOutlined style={{ color: '#a855f7' }} />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>客服回复</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.replies[0].date}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, paddingLeft: 24 }}>
                          {item.replies[0].content}
                        </div>
                      </div>
                    )}

                    {/* 查看详情按钮 */}
                    <div style={{ textAlign: 'right' }}>
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(item)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>

      {/* 详情弹窗 */}
      <Modal
        title="反馈详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={null}
      >
        {selectedFeedback && (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            {/* 基本信息 */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>{selectedFeedback.title}</h4>
              <Space wrap>
                <Tag color={priorityColors[selectedFeedback.priority]}>{selectedFeedback.priority}优先级</Tag>
                <Tag color={statusColors[selectedFeedback.status]}>{selectedFeedback.status}</Tag>
                <Tag>{selectedFeedback.type}</Tag>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {selectedFeedback.date}
                </span>
              </Space>
            </div>

            <Divider />

            {/* 详细描述 */}
            <div>
              <h5 style={{ margin: '0 0 8px', fontWeight: 600 }}>问题描述</h5>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
                {selectedFeedback.content}
              </div>
            </div>

            {/* 附件 */}
            {selectedFeedback.attachments.length > 0 && (
              <div>
                <h5 style={{ margin: '0 0 8px', fontWeight: 600 }}>附件</h5>
                <Space wrap>
                  {selectedFeedback.attachments.map((file, idx) => (
                    <Card key={idx} size="small" style={{ width: 120, textAlign: 'center' }}>
                      {file.type?.startsWith('image/') ? (
                        <FileImageOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                      ) : file.name?.endsWith('.pdf') ? (
                        <FilePdfOutlined style={{ fontSize: 32, color: '#ef4444' }} />
                      ) : (
                        <FileTextOutlined style={{ fontSize: 32, color: 'var(--text-secondary)' }} />
                      )}
                      <div style={{ fontSize: 12, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                    </Card>
                  ))}
                </Space>
              </div>
            )}

            <Divider />

            {/* 处理进度时间线 */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontWeight: 600 }}>
                <HistoryOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
                处理进度
              </h5>
              <Timeline
                items={selectedFeedback.statusHistory.map((status, idx) => ({
                  color: idx === selectedFeedback.statusHistory.length - 1 ? 'green' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>{status.status}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{status.time}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{status.note}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>操作人：{status.operator}</div>
                    </div>
                  ),
                }))}
              />
            </div>

            <Divider />

            {/* 回复列表 */}
            <div>
              <h5 style={{ margin: '0 0 12px', fontWeight: 600 }}>
                <MessageOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                沟通记录
              </h5>
              {selectedFeedback.replies.length === 0 ? (
                <Empty description="暂无回复" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {selectedFeedback.replies.map((reply, idx) => (
                    <Card key={idx} size="small" style={{ background: reply.from === '用户' ? '#e6f7ff' : '#f8f9fa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {reply.from === '用户' ? (
                          <UserOutlined style={{ color: '#3b82f6' }} />
                        ) : (
                          <RobotOutlined style={{ color: '#a855f7' }} />
                        )}
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{reply.from}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{reply.date}</span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, paddingLeft: 24 }}>{reply.content}</div>
                    </Card>
                  ))}
                </Space>
              )}
            </div>

            {/* 回复输入框 */}
            <div>
              <h5 style={{ margin: '0 0 8px', fontWeight: 600 }}>补充回复</h5>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <TextArea
                  rows={3}
                  placeholder="输入你的补充信息..."
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleReply}>
                  发送回复
                </Button>
              </Space>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackPanel;
