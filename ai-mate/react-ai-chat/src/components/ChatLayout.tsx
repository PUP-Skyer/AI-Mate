/**
 * 通用AI对话布局组件（无中间栏版本）
 * 赛博玻璃态设计 + Lucide 图标 + SSE 流式输出
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Typography, Avatar } from 'antd';
import {
  Send,
  Plus,
  User,
  Eraser,
} from 'lucide-react';
import { useAIStore, type AIRole, type Message } from '../store/aiStore';
import { chatWithZhipuStream, getSystemPrompt } from '../services/aiService';
import { addMessage as addMessageToBackend } from '../services/conversationService';
import { useTheme } from '../contexts/ThemeContext';
import { TypingIndicator, NeonButton } from './ui';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatLayoutProps {
  role: AIRole;
  title: string;
  icon: React.ReactNode;
  description: string;
  featurePanel?: React.ReactNode;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ChatLayout: React.FC<ChatLayoutProps> = ({ role, title, icon, description, featurePanel }) => {
  const {
    activeConversationId,
    conversations,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateMessage,
    createConversation,
    clearMessages,
    createAndSync,
    syncMessageToBackend,
  } = useAIStore();

  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);
  const { isDarkMode } = useTheme();

  const activeConvId = activeConversationId?.[role];
  const activeConv = activeConvId ? conversations?.[role]?.find((c) => c.id === activeConvId) : null;
  const messages = activeConv?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isGenerating) return;

    setInputValue('');
    setIsGenerating(true);

    const currentConvId = useAIStore.getState().activeConversationId?.[role];
    const currentConv = useAIStore.getState().conversations?.[role]?.find((c) => c.id === currentConvId);

    if (currentConv && !currentConv.backendId) {
      try { await useAIStore.getState().createAndSync(role); } catch {}
    }

    const userMsg: Message = { id: generateId(), role: 'user', content, timestamp: Date.now() };
    addMessage(role, userMsg);

    const updatedConvId = useAIStore.getState().activeConversationId?.[role];
    const updatedConv = useAIStore.getState().conversations?.[role]?.find((c) => c.id === updatedConvId);
    if (updatedConv?.backendId && updatedConvId) {
      syncMessageToBackend(updatedConvId, role, content, 0).catch(() => {});
    }

    const assistantMsgId = generateId();
    const assistantMsg: Message = {
      id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now(), loading: true,
    };
    addMessage(role, assistantMsg);

    try {
      const allConvId = useAIStore.getState().activeConversationId?.[role];
      const allConv = useAIStore.getState().conversations?.[role]?.find((c) => c.id === allConvId);
      const allMessages = (allConv?.messages || [])
        .filter((m) => m.id !== assistantMsgId)
        .map((m) => ({ role: m.role, content: m.content }));

      const systemPrompt = getSystemPrompt(role);
      const token = localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token') || undefined;

      let fullContent = '';
      await chatWithZhipuStream(allMessages, (chunk) => {
        fullContent += chunk;
        updateMessage(role, allConvId!, assistantMsgId, fullContent);
      }, { system_prompt: systemPrompt, token });

      if (!fullContent) {
        updateMessage(role, allConvId!, assistantMsgId, '抱歉，未能获取到回复内容。');
      }

      const finalConv = useAIStore.getState().conversations?.[role]?.find((c) => c.id === allConvId);
      if (finalConv?.backendId && fullContent) {
        try { await addMessageToBackend(finalConv.backendId, 'assistant', fullContent, 0); } catch {}
      }
    } catch {
      const errorConvId = useAIStore.getState().activeConversationId?.[role];
      updateMessage(role, errorConvId!, assistantMsgId, '抱歉，服务暂时不可用，请稍后重试。');
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, role, addMessage, updateMessage, setIsGenerating, syncMessageToBackend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = useCallback(async () => {
    try { await createAndSync(role); } catch { createConversation(role); }
  }, [role, createAndSync, createConversation]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* ====== 顶部工具栏 ====== */}
      <div style={{
        padding: '10px 20px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} icon={icon} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', flexShrink: 0 }} />
          <div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-heading)' }}>{title}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 8 }}>{description}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => clearMessages(role)}
            disabled={true}
            title="清空当前对话"
            aria-label="清空当前对话"
            className="cursor-pointer"
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              opacity: 0.4,
            }}
          >
            <Eraser size={16} />
          </button>
          <NeonButton size="sm" icon={<Plus size={14} />} onClick={handleNewConversation}>
            新对话
          </NeonButton>
        </div>
      </div>

      {/* ====== 消息列表 ====== */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        background: 'var(--bg-page)',
      }}>
        {featurePanel && (
          <div style={{ width: 640, minWidth: 560, marginRight: 16, flexShrink: 0, overflow: 'auto' }}>
            {featurePanel}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  {msg.role === 'assistant' && (
                    <Avatar size={32} icon={icon} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', flexShrink: 0 }} />
                  )}
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--gradient-primary)' : 'var(--bg-glass)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.loading && !msg.content ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>思考中...</span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar size={32} icon={<User size={16} />} style={{ background: 'var(--bg-glass-hover)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ====== 输入区域 ====== */}
      <div style={{
        padding: '14px 20px 18px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-light)',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '6px 6px 6px 18px',
            borderRadius: 18,
            background: 'var(--bg-input)',
            border: inputFocused ? '1px solid var(--neon-primary)' : '1px solid var(--border-light)',
            boxShadow: inputFocused ? '0 0 14px var(--border-glow)' : 'none',
            transition: 'all var(--transition-normal)',
          }}>
            <TextArea
              ref={textAreaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={`输入消息，开始${title}对话... (Enter发送)`}
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isGenerating}
              aria-label="消息输入框"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'none',
                padding: 0,
                outline: 'none',
                boxShadow: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              aria-label="发送消息"
              className="cursor-pointer"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: 'none',
                background: (!inputValue.trim() || isGenerating) ? 'var(--bg-glass-hover)' : 'var(--gradient-primary)',
                color: (!inputValue.trim() || isGenerating) ? 'var(--text-muted)' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
                opacity: (!inputValue.trim() || isGenerating) ? 0.5 : 1,
              }}
            >
              {isGenerating ? (
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>青宸智汇 创业护航 · 内容由AI生成，仅供参考</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 16,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, #667eea20, #764ba220)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border-glow)',
      }}>
        <User size={36} color="#a855f7" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
          开始对话吧
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          AI 将为你提供专业的创业护航服务
        </div>
      </div>

      {/* 快捷提示 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, maxWidth: 500 }}>
        {['帮我分析创业方向', '如何找到投资人', '推荐合适的供应商', '解释商业模式'].map((suggestion) => (
          <button
            key={suggestion}
            className="cursor-pointer"
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid var(--border-light)',
              background: 'var(--bg-glass)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatLayout;
