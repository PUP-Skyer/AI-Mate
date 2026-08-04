/**
 * 通用AI对话布局组件
 * 包含：侧边栏 + 消息列表 + 输入框
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout, Input, Button, List, Typography, Space, Avatar, Tooltip, Empty, Spin, Select, Upload, Image as AntImage, Switch } from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  ClearOutlined,
  PictureOutlined,
  CloseOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LinkOutlined,
  BranchesOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useAIStore, type AIRole, type Message } from '../store/aiStore';
import { usePlanStore } from '../store/planStore';
import { useSkillStore } from '../store/skillStore';
import { getSystemPrompt, type MultimodalMessage, type ContentPart, type ModelCallConfig } from '../services/aiService';
import { chatWithTools, getToolLabel } from '../services/agentChat';
import { generatePlan } from '../services/planService';
import { fetchMemory, buildMemoryInjection } from '../services/memoryService';
import { searchKnowledge, buildKnowledgeContext } from '../services/knowledgeService';
import { matchAutoTriggers, buildAutoTriggerPrompt } from '../services/autoTriggerService';
import { parseClarifyRequest, stripClarifyTags, CLARIFY_LABELS } from '../services/clarificationService';
import PlanWorkflow from './plan/PlanWorkflow';
import type { ModelConfig } from '../types';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface ChatLayoutProps {
  role: AIRole;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 文件转 base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ChatLayout: React.FC<ChatLayoutProps> = ({ role, title, icon, description }) => {
  const {
    conversations,
    activeConversationId,
    sidebarCollapsed,
    toggleSidebar,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateMessage,
    updateMessageMeta,
    updateToolCall,
    createConversation,
    deleteConversation,
    setActiveConversation,
    clearMessages,
    modelConfigs,
    activeModelId,
    setActiveModelId,
  } = useAIStore();

  const [inputValue, setInputValue] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [planMode, setPlanMode] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  // 澄清机制状态
  const [pendingClarify, setPendingClarify] = useState<{ questions: string[]; suggestions?: string[]; context: string } | null>(null);
  // 记忆/知识库开关
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  const activeModel = modelConfigs.find((m) => m.id === activeModelId && m.isEnabled);
  const enabledModels = modelConfigs.filter((m) => m.isEnabled);
  const isMultimodal = activeModel?.multimodal === true;
  // 技能库（用于自动触发）
  const allSkills = useSkillStore((s) => s.skills);

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
    if ((!content && pendingImages.length === 0) || isGenerating) return;

    if (pendingImages.length > 0 && !isMultimodal) {
      // 当前模型不支持多模态，阻止发送
      return;
    }

    setInputValue('');
    const images = [...pendingImages];
    setPendingImages([]);
    setIsGenerating(true);

    // 添加用户消息
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content,
      images: images.length > 0 ? images : undefined,
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
      const allMessages: MultimodalMessage[] = (currentConv?.messages || [])
        .filter((m) => m.id !== assistantMsgId && m.role !== 'tool')
        .map((m): MultimodalMessage => {
          const role = m.role as 'user' | 'assistant' | 'system';
          // 多模态消息：文本+图片
          if (m.images && m.images.length > 0) {
            const parts: ContentPart[] = [];
            if (m.content) {
              parts.push({ type: 'text', text: m.content });
            }
            m.images.forEach((url) => {
              parts.push({ type: 'image_url', image_url: { url } });
            });
            return { role, content: parts };
          }
          return { role, content: m.content };
        });

      const systemPrompt = getSystemPrompt(role);

      // 构建模型调用配置
      const modelConfig: ModelCallConfig | undefined = activeModel
        ? {
            modelId: activeModel.modelId || activeModel.name,
            baseUrl: activeModel.baseUrl || 'https://ark.cn-beijing.volces.com/api/plan/v3',
            apiKey: activeModel.apiKey,
            multimodal: activeModel.multimodal,
          }
        : undefined;

      // ============ 计划模式：生成可审阅计划 → 授权执行 ============
      if (planMode) {
        let planText = '';
        try {
          const generated = await generatePlan(content, {
            modelConfig,
            token: localStorage.getItem('ai_mate_token') || undefined,
            onChunk: (c) => {
              planText += c;
              const convId = useAIStore.getState().activeConversationId[role];
              updateMessageMeta(role, convId!, assistantMsgId, { content: planText });
            },
          });
          // 创建计划并打开工作流
          usePlanStore.getState().createPlan(generated.goal, generated.steps, role);
          setPlanOpen(true);
          updateMessageMeta(role, currentConvId!, assistantMsgId, {
            content: `已生成任务计划（${generated.steps.length} 个步骤），请在计划面板中审阅并授权执行。`,
            loading: false,
          });
        } catch (planErr) {
          updateMessage(
            role,
            currentConvId!,
            assistantMsgId,
            `计划生成失败：${planErr instanceof Error ? planErr.message : String(planErr)}`
          );
        }
        setIsGenerating(false);
        return;
      }

      // Agent 对话：流式 + 工具调用循环 + 记忆/知识库/技能/澄清增强
      const enhancePromise = (async () => {
        // 并行加载：记忆 + 知识库检索 + 技能自动触发
        const [memoryData, kbDocs] = await Promise.all([
          memoryEnabled ? fetchMemory(15) : Promise.resolve(null),
          knowledgeEnabled && content.trim().length >= 2
            ? searchKnowledge(content, 3)
            : Promise.resolve([]),
        ]);
        const memoryInjection = memoryData ? buildMemoryInjection(memoryData, 15) : '';
        const knowledgeInjection = buildKnowledgeContext(kbDocs, content);
        const skillMatches = matchAutoTriggers(content, allSkills);
        const skillInjection = buildAutoTriggerPrompt(skillMatches);
        return { memoryInjection, knowledgeInjection, skillInjection };
      })();

      const result = await chatWithTools(allMessages, {
        systemPrompt,
        modelConfig,
        token: localStorage.getItem('ai_mate_token') || undefined,
        // 记忆/知识库/技能注入
        memoryInjection: (await enhancePromise).memoryInjection,
        knowledgeInjection: (await enhancePromise).knowledgeInjection,
        skillInjection: (await enhancePromise).skillInjection,
        // 启用澄清机制
        enableClarify: true,
        onClarify: (clarify, rawContent) => {
          setPendingClarify({
            questions: clarify.questions,
            suggestions: clarify.suggestions,
            context: rawContent,
          });
          // 渲染时过滤 clarify 标签
          updateMessageMeta(role, currentConvId!, assistantMsgId, {
            content: stripClarifyTags(rawContent),
            loading: false,
          });
        },
        // 流式文本增量更新
        onChunk: (chunk) => {
          const convId = useAIStore.getState().activeConversationId[role];
          const msg = useAIStore.getState().conversations[role]
            .find((c) => c.id === convId)?.messages.find((m) => m.id === assistantMsgId);
          const next = (msg?.content || '') + chunk;
          updateMessageMeta(role, convId!, assistantMsgId, { content: next });
        },
        // 工具调用事件：同步到消息卡片
        onToolCall: (event) => {
          const convId = useAIStore.getState().activeConversationId[role];
          const msg = useAIStore.getState().conversations[role]
            .find((c) => c.id === convId)?.messages.find((m) => m.id === assistantMsgId);
          const toolCalls = msg?.toolCalls || [];
          const existing = toolCalls.find((t) => t.id === event.toolCallId);
          if (existing) {
            updateToolCall(role, convId!, assistantMsgId, event.toolCallId, {
              status: event.status,
              result: event.result,
            });
          } else {
            updateMessageMeta(role, convId!, assistantMsgId, {
              toolCalls: [
                ...toolCalls,
                {
                  id: event.toolCallId,
                  name: event.toolName,
                  arguments: event.args,
                  status: event.status,
                  result: event.result,
                },
              ],
            });
          }
        },
      });

      // 结束时保证 loading 关闭（onChunk 路径不会关闭 loading）
      updateMessageMeta(role, currentConvId!, assistantMsgId, { loading: false });
      if (!result.content) {
        updateMessageMeta(role, currentConvId!, assistantMsgId, {
          content: '抱歉，未能获取到回复内容。',
        });
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
  }, [inputValue, isGenerating, role, pendingImages, isMultimodal, activeModel, planMode, memoryEnabled, knowledgeEnabled, allSkills, addMessage, updateMessage, updateMessageMeta, updateToolCall, setIsGenerating]);

  // 图片选择处理
  const handleImageSelect = async (file: File) => {
    if (!isMultimodal) {
      return false;
    }
    const base64 = await fileToBase64(file);
    setPendingImages((prev) => [...prev, base64]);
    return false; // 阻止 antd 自动上传
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 提交澄清回答：把回答作为新用户消息发送（附带澄清上下文提示）
  const handleClarifyAnswer = (answer: string) => {
    if (!answer.trim() || isGenerating) return;
    setPendingClarify(null);
    // 携带澄清上下文：让模型基于之前的澄清请求继续
    const contextNote = '（这是对上一轮澄清问题的回答，请基于此继续完成之前的任务）';
    setInputValue(`${answer}${contextNote}`);
  };

  // 新建对话
  const handleNewConversation = () => {
    createConversation(role);
  };

  return (
    <Layout style={{ height: '100%', background: '#f5f5f5' }}>
      {/* 对话列表面板 */}
      <Sider
        width={220}
        collapsedWidth={0}
        collapsed={sidebarCollapsed}
        trigger={null}
        collapsible
        style={{
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          height: '100%',
        }}
      >
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              对话列表
            </Text>
            <Tooltip title="新建对话">
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleNewConversation} />
            </Tooltip>
          </div>
          <List
            size="small"
            dataSource={conversations[role]}
            style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
            renderItem={(conv) => (
              <List.Item
                onClick={() => setActiveConversation(role, conv.id)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 10px',
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
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ height: '100%' }}>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              {/* 计划模式开关 */}
              <Tooltip title="计划模式：先生成可审阅的多步骤计划，授权后由各角色协作执行">
                <Space size={6}>
                  <BranchesOutlined style={{ color: planMode ? '#1677ff' : '#999', fontSize: 14 }} />
                  <Switch
                    size="small"
                    checked={planMode}
                    onChange={setPlanMode}
                    checkedChildren="计划"
                    unCheckedChildren="对话"
                  />
                </Space>
              </Tooltip>
              {/* 记忆开关 */}
              <Tooltip title="记忆：跨会话记住你的偏好与背景">
                <Space size={4}>
                  <BulbOutlined style={{ color: memoryEnabled ? '#722ed1' : '#999', fontSize: 14 }} />
                  <Switch size="small" checked={memoryEnabled} onChange={setMemoryEnabled} checkedChildren="记忆" />
                </Space>
              </Tooltip>
              {/* 知识库开关 */}
              <Tooltip title="知识库：对话时自动检索内置创业资料作为参考">
                <Space size={4}>
                  <DatabaseOutlined style={{ color: knowledgeEnabled ? '#1677ff' : '#999', fontSize: 14 }} />
                  <Switch size="small" checked={knowledgeEnabled} onChange={setKnowledgeEnabled} checkedChildren="知识库" />
                </Space>
              </Tooltip>
              {/* 模型选择器 */}
              <Select
                size="small"
                style={{ minWidth: 200 }}
                placeholder="选择模型"
                value={activeModelId || undefined}
                onChange={(val) => setActiveModelId(val)}
                options={enabledModels.map((m) => ({
                  label: (
                    <Space size={4}>
                      <Text style={{ fontSize: 12 }}>{m.name}</Text>
                      {m.multimodal && <Text type="success" style={{ fontSize: 10 }}>视觉</Text>}
                    </Space>
                  ) as any,
                  value: m.id,
                }))}
                notFoundContent={<Text type="secondary" style={{ fontSize: 12 }}>请先在设置中添加模型</Text>}
              />
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
                      {msg.images && msg.images.length > 0 && (
                        <div style={{ marginBottom: msg.content ? 8 : 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {msg.images.map((img, idx) => (
                            <AntImage
                              key={idx}
                              src={img}
                              width={120}
                              style={{ borderRadius: 8 }}
                            />
                          ))}
                        </div>
                      )}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div style={{ marginBottom: msg.content || msg.loading ? 10 : 0 }}>
                          {msg.toolCalls.map((tc) => (
                            <div
                              key={tc.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 10px',
                                marginBottom: 6,
                                borderRadius: 8,
                                background: '#fafafa',
                                border: '1px solid #f0f0f0',
                                fontSize: 12,
                              }}
                            >
                              <ToolOutlined style={{ color: '#8c8c8c' }} />
                              <Text style={{ fontSize: 12, color: '#595959' }} ellipsis={{ tooltip: tc.name }}>
                                {getToolLabel(tc.name)}
                              </Text>
                              {tc.status === 'pending' || tc.status === 'running' ? (
                                <LoadingOutlined style={{ color: '#1677ff', fontSize: 12 }} />
                              ) : tc.status === 'success' ? (
                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                              ) : tc.status === 'error' ? (
                                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                              ) : null}
                              {tc.status === 'success' && tc.result && (
                                <Tooltip
                                  title={
                                    <div style={{ maxWidth: 480, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                      {tc.result.slice(0, 2000)}
                                    </div>
                                  }
                                >
                                  <LinkOutlined style={{ color: '#8c8c8c', fontSize: 12, cursor: 'pointer' }} />
                                </Tooltip>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
                {pendingClarify && (
                  <div
                    style={{
                      maxWidth: 700,
                      margin: '0 auto 16px',
                      padding: 16,
                      borderRadius: 12,
                      background: '#fffbe6',
                      border: '1px solid #ffe58f',
                    }}
                  >
                    <Space style={{ marginBottom: 8 }}>
                      <QuestionCircleOutlined style={{ color: '#faad14' }} />
                      <Text strong style={{ fontSize: 13, color: '#ad6800' }}>
                        需要你确认几个问题
                      </Text>
                    </Space>
                    {pendingClarify.questions.map((q, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <Text style={{ fontSize: 13 }}>{i + 1}. {q}</Text>
                      </div>
                    ))}
                    {pendingClarify.suggestions && pendingClarify.suggestions.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>建议方向：</Text>
                        <Space wrap size={4} style={{ marginTop: 4 }}>
                          {pendingClarify.suggestions.map((s) => (
                            <Button
                              key={s}
                              size="small"
                              onClick={() => handleClarifyAnswer(s)}
                              style={{ fontSize: 12 }}
                            >
                              {s}
                            </Button>
                          ))}
                        </Space>
                      </div>
                    )}
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleClarifyAnswer('我已经确认，请按你建议的方向继续')}
                      >
                        按建议继续
                      </Button>
                    </div>
                  </div>
                )}
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
              {/* 待发送图片预览 */}
              {pendingImages.length > 0 && (
                <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {pendingImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <AntImage
                        src={img}
                        width={72}
                        height={72}
                        style={{ borderRadius: 6, objectFit: 'cover' }}
                        preview={false}
                      />
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => removePendingImage(idx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          minWidth: 20,
                          padding: 0,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* 模型未配置或非多模态提示 */}
              {!activeModel && (
                <div style={{ marginBottom: 8, padding: '6px 12px', background: '#fff7e6', borderRadius: 6, fontSize: 12, color: '#fa8c16' }}>
                  请先在「设置 - 模型配置」中添加火山方舟模型并填入 API Key
                </div>
              )}
              {activeModel && !isMultimodal && pendingImages.length === 0 && (
                <div style={{ marginBottom: 8, fontSize: 12, color: '#999' }}>
                  当前模型「{activeModel.name}」为纯文本模型，如需图片识别请切换至 doubao-seed-2.0-lite
                </div>
              )}
              <Space.Compact style={{ width: '100%' }}>
                {isMultimodal && (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageSelect}
                  >
                    <Button
                      icon={<PictureOutlined />}
                      style={{ borderRadius: '8px 0 0 8px', height: 'auto' }}
                      disabled={isGenerating}
                    />
                  </Upload>
                )}
                <TextArea
                  ref={textAreaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`输入消息与${title}对话... (Enter发送, Shift+Enter换行)`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  disabled={isGenerating}
                  style={{ borderRadius: isMultimodal ? 0 : '8px 0 0 8px' }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={isGenerating}
                  disabled={!inputValue.trim() && pendingImages.length === 0}
                  style={{ height: 'auto', borderRadius: '0 8px 8px 0', padding: '0 20px' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </div>
        </Content>
      </Layout>

      {/* 计划工作流面板 */}
      <PlanWorkflow open={planOpen} onClose={() => setPlanOpen(false)} />
    </Layout>
  );
};

export default ChatLayout;
