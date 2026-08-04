/**
 * 售后咨询面板
 * 功能：售后问题咨询、快捷回复、满意度评价、服务支持
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Input,
  Space,
  Avatar,
  Timeline,
  Badge,
  Empty,
  Rate,
  Modal,
  Form,
  Radio,
  message,
  Divider,
  Tooltip,
  Progress,
  Row,
  Col,
  Statistic,
  Typography,
  Popconfirm,
} from 'antd';
import {
  PhoneOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  RobotOutlined,
  SendOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface ChatMessage {
  id: number;
  from: 'user' | 'service';
  content: string;
  time: string;
  type?: 'text' | 'quick_reply' | 'satisfaction';
}

interface ConsultationItem {
  id: number;
  title: string;
  status: string;
  date: string;
  messages: ChatMessage[];
  satisfaction?: number;
  isSatisfied?: boolean;
  category: string;
}

const quickReplies = [
  '如何保存报告？',
  '工作台怎么用？',
  '如何导出数据？',
  '账号问题',
  '功能建议',
  '其他问题',
];

const serviceResponses: Record<string, string> = {
  '如何保存报告？': '保存报告非常简单：\n1. 在报告生成页面点击"保存到个人资料"按钮\n2. 给报告起一个名字\n3. 选择分类标签\n4. 点击确认保存\n\n保存后你可以在"个人资料"的"报告收藏"中查看所有报告。',
  '工作台怎么用？': '工作台使用指南：\n1. 点击左侧菜单"工匠AI"\n2. 选择"创业技能库"\n3. 点击你感兴趣的创业方向卡片\n4. 进入工作台后，按照四步流程操作：\n   - 项目设定\n   - 服务选择\n   - 任务管理\n   - 执行记录\n5. 完成任务后点击"完成并关闭"',
  '如何导出数据？': '导出数据步骤：\n1. 进入管家AI"成果展示"页面\n2. 选择你要导出的报告\n3. 点击"导出报告"按钮\n4. 选择导出格式（PDF/Word/Excel）\n5. 等待生成并下载',
  '账号问题': '关于账号问题，请详细描述你遇到的具体情况，比如：\n- 无法登录\n- 密码忘记\n- 账号异常\n- 权限问题\n\n我们的客服会尽快为你解决。',
  '功能建议': '非常感谢你的建议！请详细描述你希望增加或改进的功能，包括：\n- 功能名称\n- 使用场景\n- 预期效果\n\n我们会认真评估每一条建议。',
  '其他问题': '请详细描述你遇到的问题，我们的客服人员会尽快为你解答。',
};

const initialConsultations: ConsultationItem[] = [
  {
    id: 1,
    title: '创业规划报告解读',
    status: '进行中',
    date: '2024-03-10',
    category: '军师AI',
    messages: [
      { id: 1, from: 'user', content: '请问军师AI生成的报告中的融资规划部分，自有资金比例如何调整？', time: '10:30' },
      { id: 2, from: 'service', content: '您好！自有资金比例建议根据您的实际情况调整。一般来说，初创期建议保留30%作为应急资金。您可以点击报告中的"融资规划"部分进行修改。', time: '10:35' },
    ],
  },
  {
    id: 2,
    title: '工匠AI工作台使用指南',
    status: '已解决',
    date: '2024-03-08',
    category: '工匠AI',
    messages: [
      { id: 1, from: 'user', content: '工作台的任务管理功能如何使用？', time: '14:00' },
      { id: 2, from: 'service', content: '工作台的任务管理支持以下功能：\n1. 添加任务：输入任务名称并选择优先级\n2. 完成任务：点击任务前的复选框\n3. 删除任务：点击右侧的删除按钮\n4. 切换视图：支持列表视图和看板视图', time: '14:05' },
      { id: 3, from: 'user', content: '明白了，谢谢！', time: '14:10' },
      { id: 4, from: 'service', content: '不客气！如果还有其他问题，随时联系我们。祝您创业顺利！', time: '14:12', type: 'satisfaction' },
    ],
    satisfaction: 5,
    isSatisfied: true,
  },
];

const AfterSalesPanel: React.FC = () => {
  const [consultations, setConsultations] = useState<ConsultationItem[]>(initialConsultations);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationItem | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [satisfactionComment, setSatisfactionComment] = useState('');
  const [isSatisfactionModalOpen, setIsSatisfactionModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConsultation?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConsultation) return;

    const updatedConsultations = consultations.map(c => {
      if (c.id === activeConsultation.id) {
        return {
          ...c,
          messages: [
            ...c.messages,
            { id: Date.now(), from: 'user' as const, content: newMessage, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
          ],
        };
      }
      return c;
    });

    setConsultations(updatedConsultations);
    setActiveConsultation({
      ...activeConsultation,
      messages: [
        ...activeConsultation.messages,
        { id: Date.now(), from: 'user', content: newMessage, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
      ],
    });
    setNewMessage('');

    // 模拟客服回复
    setTimeout(() => {
      const replyContent = serviceResponses[newMessage] || '感谢您的咨询，我们的客服人员会尽快为您处理。如需紧急帮助，请拨打客服热线：400-xxx-xxxx';
      const replyMessage: ChatMessage = {
        id: Date.now() + 1,
        from: 'service',
        content: replyContent,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setConsultations(prev => prev.map(c => {
        if (c.id === activeConsultation.id) {
          return {
            ...c,
            messages: [...c.messages, replyMessage],
          };
        }
        return c;
      }));

      setActiveConsultation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, replyMessage],
        };
      });
    }, 1500);
  };

  const handleQuickReply = (reply: string) => {
    if (!activeConsultation) return;
    
    const userMessage: ChatMessage = {
      id: Date.now(),
      from: 'user',
      content: reply,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      type: 'quick_reply',
    };

    setConsultations(prev => prev.map(c => {
      if (c.id === activeConsultation.id) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
        };
      }
      return c;
    }));

    setActiveConsultation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
      };
    });

    // 自动回复
    setTimeout(() => {
      const serviceReply: ChatMessage = {
        id: Date.now() + 1,
        from: 'service',
        content: serviceResponses[reply] || '感谢您的咨询，我们会尽快为您处理。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };

      setConsultations(prev => prev.map(c => {
        if (c.id === activeConsultation.id) {
          return {
            ...c,
            messages: [...c.messages, serviceReply],
          };
        }
        return c;
      }));

      setActiveConsultation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, serviceReply],
        };
      });
    }, 1000);
  };

  const handleSubmitSatisfaction = () => {
    if (!activeConsultation) return;
    
    const updatedConsultations = consultations.map(c => {
      if (c.id === activeConsultation.id) {
        return {
          ...c,
          satisfaction: satisfactionRating,
          isSatisfied: satisfactionRating >= 4,
          status: '已解决',
        };
      }
      return c;
    });

    setConsultations(updatedConsultations);
    setActiveConsultation({
      ...activeConsultation,
      satisfaction: satisfactionRating,
      isSatisfied: satisfactionRating >= 4,
      status: '已解决',
    });
    
    setIsSatisfactionModalOpen(false);
    setSatisfactionRating(0);
    setSatisfactionComment('');
    message.success('感谢你的评价！');
  };

  const handleEndConsultation = () => {
    setIsSatisfactionModalOpen(true);
  };

  const statusColors: Record<string, string> = {
    '进行中': 'processing',
    '已解决': 'success',
    '待处理': 'default',
  };

  const categoryColors: Record<string, string> = {
    '探路者AI': '#3b82f6',
    '军师AI': '#a855f7',
    '工匠AI': '#f59e0b',
    '管家AI': '#10b981',
    '通用': '#666',
  };

  // 统计信息
  const totalConsultations = consultations.length;
  const resolvedCount = consultations.filter(item => item.status === '已解决').length;
  const avgSatisfaction = consultations.filter(item => item.satisfaction).reduce((sum, item) => sum + (item.satisfaction || 0), 0) / (consultations.filter(item => item.satisfaction).length || 1);

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      {/* 标题区域 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
          <PhoneOutlined style={{ marginRight: 8, color: '#ef4444' }} />
          售后咨询
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>获取专业的售后支持和服务指导</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="咨询总数"
              value={totalConsultations}
              prefix={<MessageOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="已解决"
              value={resolvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              styles={{ content: { color: '#10b981', fontWeight: 600 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="平均满意度"
              value={avgSatisfaction}
              precision={1}
              prefix={<StarOutlined style={{ color: '#f59e0b' }} />}
              styles={{ content: { color: '#f59e0b', fontWeight: 600 } }}
              suffix="/5"
            />
          </Card>
        </Col>
      </Row>

      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        {/* 咨询列表 */}
        {!activeConsultation ? (
          <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} title="咨询记录">
            {consultations.length === 0 ? (
              <Empty description="暂无咨询记录" />
            ) : (
              <List
                dataSource={consultations}
                renderItem={item => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveConsultation(item)}
                  >
                    <Card style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} hoverable>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>{item.title}</div>
                          <Space>
                            <Badge status={statusColors[item.status] as any} text={item.status} />
                            <Tag color={categoryColors[item.category] || '#666'} style={{ fontSize: 11 }}>
                              {item.category}
                            </Tag>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.date}</span>
                          </Space>
                          {item.satisfaction && (
                            <div style={{ marginTop: 8 }}>
                              <Rate disabled defaultValue={item.satisfaction} style={{ fontSize: 14 }} />
                              {item.isSatisfied ? (
                                <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>
                                  <SmileOutlined /> 满意
                                </Tag>
                              ) : (
                                <Tag color="warning" style={{ marginLeft: 8, fontSize: 11 }}>
                                  <FrownOutlined /> 待改进
                                </Tag>
                              )}
                            </div>
                          )}
                        </div>
                        <Button type="primary" size="small" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                          查看
                        </Button>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        ) : (
          /* 聊天界面 */
          <Card
            style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <span>{activeConsultation.title}</span>
                  <Badge status={statusColors[activeConsultation.status] as any} text={activeConsultation.status} />
                </Space>
                <Space>
                  {activeConsultation.status === '进行中' && (
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<CheckOutlined />}
                      onClick={handleEndConsultation}
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                    >
                      结束咨询
                    </Button>
                  )}
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setActiveConsultation(null)}>
                    返回列表
                  </Button>
                </Space>
              </div>
            }
          >
            {/* 快捷回复 */}
            {activeConsultation.status === '进行中' && (
              <div style={{ marginBottom: 16, padding: '12px', background: '#f8f9fa', borderRadius: 8 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                  <ThunderboltOutlined style={{ marginRight: 4, color: '#f59e0b' }} />
                  快捷回复
                </Text>
                <Space wrap>
                  {quickReplies.map((reply, idx) => (
                    <Button 
                      key={idx} 
                      size="small" 
                      onClick={() => handleQuickReply(reply)}
                      style={{ borderRadius: 12 }}
                    >
                      {reply}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            {/* 消息列表 */}
            <div style={{ height: 400, overflow: 'auto', padding: '16px', background: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
              {activeConsultation.messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: msg.from === 'user' ? '#a855f7' : '#fff',
                      color: msg.from === 'user' ? '#fff' : '#333',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {msg.from === 'service' ? <RobotOutlined /> : <UserOutlined />}
                      <span style={{ fontWeight: 600, fontSize: 12 }}>
                        {msg.from === 'user' ? '我' : '客服'}
                      </span>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            {activeConsultation.status === '进行中' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onPressEnter={handleSendMessage}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                  发送
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px', background: '#f0f9ff', borderRadius: 8 }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} />
                <Text type="secondary">此咨询已结束，如有其他问题请新建咨询</Text>
              </div>
            )}
          </Card>
        )}

        {/* 服务信息 */}
        <Card style={{ borderRadius: 12, border: '1px solid #f0f0f0' }} title="服务支持">
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <PhoneOutlined style={{ fontSize: 32, color: '#ef4444', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>客服热线</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>400-xxx-xxxx</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>工作时间 9:00-18:00</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <MessageOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>在线客服</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>7x24小时在线</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>平均响应时间5分钟</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <CustomerServiceOutlined style={{ fontSize: 32, color: '#3b82f6', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>服务承诺</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>24小时内响应</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>72小时内解决</div>
              </div>
            </Col>
          </Row>
        </Card>
      </Space>

      {/* 满意度评价弹窗 */}
      <Modal
        title="服务满意度评价"
        open={isSatisfactionModalOpen}
        onCancel={() => setIsSatisfactionModalOpen(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <SmileOutlined style={{ fontSize: 48, color: '#f59e0b', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>请评价本次服务</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            你的评价将帮助我们提供更好的服务
          </Paragraph>

          <div style={{ marginBottom: 24 }}>
            <Rate
              value={satisfactionRating}
              onChange={setSatisfactionRating}
              style={{ fontSize: 32 }}
            />
            <div style={{ marginTop: 8 }}>
              {satisfactionRating === 5 && <Tag color="success"><SmileOutlined /> 非常满意</Tag>}
              {satisfactionRating === 4 && <Tag color="processing"><SmileOutlined /> 满意</Tag>}
              {satisfactionRating === 3 && <Tag color="warning"><MehOutlined /> 一般</Tag>}
              {satisfactionRating === 2 && <Tag color="error"><FrownOutlined /> 不满意</Tag>}
              {satisfactionRating === 1 && <Tag color="error"><FrownOutlined /> 非常不满意</Tag>}
            </div>
          </div>

          <TextArea
            placeholder="请输入你的意见和建议（可选）..."
            rows={4}
            value={satisfactionComment}
            onChange={e => setSatisfactionComment(e.target.value)}
            style={{ marginBottom: 24 }}
          />

          <Space>
            <Button onClick={() => setIsSatisfactionModalOpen(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmitSatisfaction}
              disabled={satisfactionRating === 0}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
            >
              提交评价
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default AfterSalesPanel;
