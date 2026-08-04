/**
 * 通用AI对话布局组件
 * 包含：侧边栏 + 消息列表 + 输入框
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout, Input, Button, Typography, Space, Avatar, Tooltip, Dropdown, Empty, Spin } from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  UserOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAIStore, type AIRole, type Message } from '../store/aiStore';
import { chatWithZhipu, getSystemPrompt } from '../services/aiService';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatLayoutProps {
  role: AIRole;
  title: string;
  icon: React.ReactNode;
  description: string;
  menuItems?: MenuProps['items'];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ChatLayout: React.FC<ChatLayoutProps> = ({ role, title, icon, description, menuItems }) => {
  const {
    conversations,
    activeConversationId,
    sidebarCollapsed,
    toggleSidebar,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateMessage,
    createConversation,
    deleteConversation,
    setActiveConversation,
    clearMessages,
  } = useAIStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  const activeConvId = activeConversationId[role];
  const activeConv = conversations[role].find((c) => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isGenerating) return;

    setInputValue('');
    setIsGenerating(true);

    // 添加用户消息
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(role, userMsg);

    // 添加AI占位消息
    const assistantMsgId = generateId();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      loading: true,
    };
    addMessage(role, assistantMsg);

    try {
      // 获取当前对话的所有消息
      const currentConvId = useAIStore.getState().activeConversationId[role];
      const currentConv = useAIStore.getState().conversations[role].find(
        (c) => c.id === currentConvId
      );
      const allMessages = (currentConv?.messages || [])
        .filter((m) => m.id !== assistantMsgId) // 排除占位消息
        .map((m) => ({ role: m.role, content: m.content }));

      const systemPrompt = getSystemPrompt(role);

      // 调用智谱API
      const result = await chatWithZhipu(allMessages, {
        system_prompt: systemPrompt,
        token: localStorage.getItem('ai_mate_token') || undefined,
      });

      if (result.error) {
        updateMessage(role, currentConvId!, assistantMsgId, `抱歉，请求出错：${result.error}`);
      } else if (result.data?.choices?.[0]?.message?.content) {
        updateMessage(role, currentConvId!, assistantMsgId, result.data.choices[0].message.content);
      } else {
        updateMessage(role, currentConvId!, assistantMsgId, '抱歉，未能获取到回复内容。');
      }
    } catch (error) {
      updateMessage(
        role,
        useAIStore.getState().activeConversationId[role]!,
        assistantMsgId,
        '抱歉，服务暂时不可用，请稍后重试。'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, role, addMessage, updateMessage, setIsGenerating]);

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 新建对话
  const handleNewConversation = () => {
    createConversation(role);
  };

  // 侧边栏对话列表
  const conversationItems: MenuProps['items'] = [
    {
      key: 'new',
      icon: <PlusOutlined />,
      label: '新建对话',
      onClick: handleNewConversation,
    },
    { type: 'divider' },
    ...conversations[role].map((conv) => ({
      key: conv.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Text ellipsis style={{ flex: 1, maxWidth: 140 }}>
            {conv.title}
          </Text>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    deleteConversation(role, conv.id);
                  },
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              onClick={(e) => e.stopPropagation()}
              style={{ opacity: 0.5 }}
            >
              ...
            </Button>
          </Dropdown>
        </div>
      ),
      onClick: () => setActiveConversation(role, conv.id),
    })),
  ];

  return (
    <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
      {/* 侧边栏 */}
      <Sider
        width={260}
        collapsedWidth={0}
        collapsed={sidebarCollapsed}
        trigger={null}
        collapsible
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 角色信息 */}
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Avatar size={48} icon={icon} style={{ backgroundColor: '#1677ff', marginBottom: 8 }} />
              <Title level={5} style={{ margin: 0 }}>
                {title}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {description}
              </Text>
            </div>

            {/* 功能菜单（如果有） */}
            {menuItems && menuItems.length > 0 && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                  功能菜单
                </Text>
                <Dropdown menu={{ items: menuItems }} trigger={['click']} style={{ width: '100%' }}>
                  <Button block>
                    快捷功能
                  </Button>
                </Dropdown>
              </div>
            )}

            {/* 对话历史 */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  对话历史
                </Text>
                <Tooltip title="新建对话">
                  <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleNewConversation} />
                </Tooltip>
              </div>
              <Dropdown menu={{ items: conversationItems }} trigger={['contextMenu']}>
                <div>
                  <List
                    size="small"
                    dataSource={conversations[role]}
                    style={{ maxHeight: 'calc(100vh - 380px)', overflow: 'auto' }}
                    renderItem={(conv) => (
                      <List.Item
                        onClick={() => setActiveConversation(role, conv.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: 6,
                          background: conv.id === activeConvId ? '#e6f4ff' : 'transparent',
                          marginBottom: 2,
                        }}
                      >
                        <Text ellipsis style={{ fontSize: 13 }}>
                          {conv.title}
                        </Text>
                      </List.Item>
                    )}
                    locale={{ emptyText: '暂无对话' }}
                  />
                </div>
              </Dropdown>
            </div>
          </Space>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* 顶部工具栏 */}
          <div
            style={{
              padding: '12px 20px',
              background: '#fff',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <Button
                type="text"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleSidebar}
              />
              <Text strong>{title}</Text>
            </Space>
            <Space>
              <Tooltip title="清空当前对话">
                <Button
                  type="text"
                  icon={<ClearOutlined />}
                  onClick={() => clearMessages(role)}
                  disabled={messages.length === 0}
                />
              </Tooltip>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleNewConversation}>
                新对话
              </Button>
            </Space>
          </div>

          {/* 消息列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {messages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Empty
                  description={
                    <Space direction="vertical" align="center">
                      <Text type="secondary">开始与 {title} 对话吧</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {description}
                      </Text>
                    </Space>
                  }
                />
              </div>
            ) : (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar
                        icon={icon}
                        style={{
                          backgroundColor: '#1677ff',
                          marginRight: 12,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? '#1677ff' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.loading ? (
                        <Spin size="small" />
                      ) : (
                        <Text style={{ color: 'inherit', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <Avatar
                        icon={<UserOutlined />}
                        style={{
                          backgroundColor: '#87d068',
                          marginLeft: 12,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区域 */}
          <div
            style={{
              padding: '16px 20px',
              background: '#fff',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  ref={textAreaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`输入消息与${title}对话... (Enter发送, Shift+Enter换行)`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={isGenerating}
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={isGenerating}
                  disabled={!inputValue.trim()}
                  style={{ height: 'auto', borderRadius: '0 8px 8px 0', padding: '0 20px' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatLayout;
