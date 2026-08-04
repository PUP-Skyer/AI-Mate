/**
 * 项目管理面板 - 管家AI功能组件
 * 功能：投资进度跟踪、专家指导意见、资源推荐、阶段总结上传
 */

import React, { useState } from 'react';
import {
  Card,
  Steps,
  Button,
  Tag,
  Timeline,
  Badge,
  Empty,
  Space,
  Typography,
  Divider,
  Progress,
  Row,
  Col,
  Statistic,
  Alert,
  Avatar,
  Upload,
  message,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  ProjectOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  UserOutlined,
  BankOutlined,
  FileSearchOutlined,
  AuditOutlined,
  TeamOutlined,
  DollarOutlined,
  SolutionOutlined,
  BulbOutlined,
  BookOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 投资进度阶段
const investmentStages = [
  { title: '背调', description: '投资方进行背景调查', icon: <FileSearchOutlined /> },
  { title: '审核', description: '初步审核项目资料', icon: <AuditOutlined /> },
  { title: '复审', description: '深度复审与评估', icon: <SolutionOutlined /> },
  { title: '合作谈判', description: '投资条款谈判', icon: <TeamOutlined /> },
  { title: '敲定打款', description: '签署协议并打款', icon: <DollarOutlined /> },
];

// 模拟项目数据
interface ProjectData {
  id: string;
  name: string;
  status: 'pending' | 'investigating' | 'reviewing' | 're_reviewing' | 'negotiating' | 'completed';
  investorEmail: string;
  currentStage: number;
  startDate: string;
  notes: string;
}

const mockProjects: ProjectData[] = [
  {
    id: '1',
    name: '智创未来 - AI教育平台',
    status: 'reviewing',
    investorEmail: 'investor@vc-firm.com',
    currentStage: 2,
    startDate: '2026-04-15',
    notes: '项目资料已提交，等待审核结果',
  },
  {
    id: '2',
    name: '绿能动力 - 新能源方案',
    status: 'negotiating',
    investorEmail: 'partner@greenfund.com',
    currentStage: 4,
    startDate: '2026-03-20',
    notes: '进入合作谈判阶段，预计下周签署意向书',
  },
];

// 专家指导意见
interface ExpertAdvice {
  id: string;
  expertName: string;
  expertTitle: string;
  date: string;
  content: string;
  type: 'guidance' | 'resource' | 'review';
}

const mockExpertAdvice: ExpertAdvice[] = [
  {
    id: '1',
    expertName: '王教授',
    expertTitle: 'AI领域资深专家',
    date: '2026-05-10',
    content: '建议在技术架构中增加大模型微调模块，提升产品竞争力。同时注意数据合规性问题。',
    type: 'guidance',
  },
  {
    id: '2',
    expertName: '李总监',
    expertTitle: '产业投资顾问',
    date: '2026-05-08',
    content: '推荐关注教育科技赛道最新政策，建议申请高新技术企业认证，可获得税收优惠。',
    type: 'resource',
  },
];

// 阶段总结
interface StageSummary {
  id: string;
  title: string;
  date: string;
  content: string;
  attachments: string[];
}

const ProjectManagementPanel: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(mockProjects[0]);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryForm] = Form.useForm();
  const [summaries, setSummaries] = useState<StageSummary[]>([
    {
      id: '1',
      title: '项目启动阶段总结',
      date: '2026-04-20',
      content: '已完成市场调研和竞品分析，确定了产品核心功能模块。团队组建完毕，技术架构已设计完成。',
      attachments: ['市场调研报告.pdf', '技术架构图.png'],
    },
    {
      id: '2',
      title: '产品开发中期汇报',
      date: '2026-05-10',
      content: 'MVP版本开发进度达到70%，核心AI对话功能已完成测试。用户内测反馈良好，下一步准备进行公测。',
      attachments: ['测试报告.pdf'],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'investigating': return 'processing';
      case 'reviewing': return 'warning';
      case 're_reviewing': return 'warning';
      case 'negotiating': return 'success';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待启动';
      case 'investigating': return '背调中';
      case 'reviewing': return '审核中';
      case 're_reviewing': return '复审中';
      case 'negotiating': return '谈判中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  const handleSummarySubmit = async () => {
    try {
      const values = await summaryForm.validateFields();
      const newSummary: StageSummary = {
        id: Date.now().toString(),
        title: values.title,
        date: new Date().toISOString().split('T')[0],
        content: values.content,
        attachments: [],
      };
      setSummaries([newSummary, ...summaries]);
      setIsSummaryModalOpen(false);
      summaryForm.resetFields();
      message.success('阶段总结上传成功');
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      {/* 标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: '0 0 8px' }}>
          <ProjectOutlined style={{ marginRight: 8, color: '#a855f7' }} />
          项目管理
        </Title>
        <Text type="secondary">跟踪投资进度，查看专家指导，上传阶段总结</Text>
      </div>

      {/* 项目选择 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {mockProjects.map((project) => (
          <Col span={12} key={project.id}>
            <Card
              hoverable
              onClick={() => setSelectedProject(project)}
              style={{
                borderRadius: 12,
                border: selectedProject?.id === project.id ? '2px solid #a855f7' : '1px solid var(--border-light)',
                background: selectedProject?.id === project.id ? (isDarkMode ? 'rgba(168,85,247,0.1)' : '#f3e8ff') : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text strong style={{ fontSize: 15 }}>{project.name}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={getStatusColor(project.status)}>{getStatusText(project.status)}</Tag>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>开始于 {project.startDate}</Text>
                  </div>
                </div>
                <Badge count={project.currentStage} style={{ backgroundColor: '#a855f7' }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedProject && (
        <>
          {/* 投资进度 */}
          <Card
            title={
              <Space>
                <BankOutlined style={{ color: '#a855f7' }} />
                <span>投资进度</span>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 12 }}
          >
            <Steps
              current={selectedProject.currentStage}
              items={investmentStages.map((stage, index) => ({
                title: stage.title,
                content: stage.description,
                icon: index < selectedProject.currentStage ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : stage.icon,
              }))}
            />
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary">当前阶段：</Text>
                <Text strong>{investmentStages[selectedProject.currentStage]?.title || '已完成'}</Text>
              </div>
              <div>
                <MailOutlined style={{ marginRight: 8, color: '#a855f7' }} />
                <Text type="secondary">联系邮箱：</Text>
                <Text copyable style={{ color: '#a855f7' }}>{selectedProject.investorEmail}</Text>
              </div>
            </div>
            {selectedProject.notes && (
              <Alert
                title="进度备注"
                description={selectedProject.notes}
                type="info"
                showIcon
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            )}
          </Card>

          {/* 专家指导意见 */}
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#f59e0b' }} />
                <span>专家指导意见</span>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 12 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mockExpertAdvice.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <Avatar icon={<UserOutlined />} style={{ background: item.type === 'guidance' ? '#a855f7' : '#3b82f6' }} />
                      <div>
                        <Text strong>{item.expertName}</Text>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{item.expertTitle}</Text>
                      </div>
                    </Space>
                    <Tag color={item.type === 'guidance' ? 'purple' : 'blue'}>
                      {item.type === 'guidance' ? '指导意见' : '资源推荐'}
                    </Tag>
                  </div>
                  <Paragraph style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>
                    {item.content}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                </div>
              ))}
            </div>
          </Card>

          {/* 阶段总结 */}
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#10b981' }} />
                <span>阶段总结</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setIsSummaryModalOpen(true)}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                上传总结
              </Button>
            }
            style={{ marginBottom: 16, borderRadius: 12 }}
          >
            <Timeline
              items={summaries.map((summary) => ({
                icon: <FileTextOutlined style={{ color: '#10b981' }} />,
                content: (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>{summary.title}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{summary.date}</Text>
                    </div>
                    <Paragraph style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {summary.content}
                    </Paragraph>
                    {summary.attachments.length > 0 && (
                      <Space size="small">
                        {summary.attachments.map((file, idx) => (
                          <Tag key={idx} icon={<LinkOutlined />} color="success">
                            {file}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </>
      )}

      {/* 上传总结弹窗 */}
      <Modal
        title="上传阶段总结"
        open={isSummaryModalOpen}
        onOk={handleSummarySubmit}
        onCancel={() => setIsSummaryModalOpen(false)}
        okText="提交"
        cancelText="取消"
      >
        <Form form={summaryForm} layout="vertical">
          <Form.Item
            name="title"
            label="总结标题"
            rules={[{ required: true, message: '请输入总结标题' }]}
          >
            <Input placeholder="例如：项目启动阶段总结" />
          </Form.Item>
          <Form.Item
            name="content"
            label="总结内容"
            rules={[{ required: true, message: '请输入总结内容' }]}
          >
            <TextArea rows={6} placeholder="请详细描述本阶段的进展、成果和下一步计划..." />
          </Form.Item>
          <Form.Item label="附件">
            <Upload.Dragger
              name="files"
              multiple
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p>点击或拖拽文件到此区域上传</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectManagementPanel;
