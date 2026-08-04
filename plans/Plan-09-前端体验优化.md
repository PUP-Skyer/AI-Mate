# 前端体验优化 实施计划

> **目标：** 优化对话交互体验，包括流式打字机效果、多会话管理、错误处理和 Token 消耗展示，全面提升大学生智能体的用户体验。
> **依赖：** Plan-02（真实 AI 对话流式接口）、Plan-03（对话持久化）
> **技术栈：** React 19、TypeScript、Ant Design 6、Zustand + Immer、react-markdown、AbortController

---

## 前置说明

本计划在已有的 `aiStore.ts`（Zustand 状态管理）、`aiService.ts`（智谱流式调用）基础上优化。所有前端文件使用 TypeScript + React 19 + Ant Design 6。

需要新增依赖：`react-markdown`、`react-syntax-highlighter`、`remark-gfm`。

---

### 任务 1：优化 aiStore.ts 状态管理

**文件：** Modify `ai-mate/react-ai-chat/src/store/aiStore.ts`

- [ ] 步骤 1：安装新依赖

```bash
cd ai-mate/react-ai-chat
npm install react-markdown react-syntax-highlighter remark-gfm
npm install -D @types/react-syntax-highlighter
```

- [ ] 步骤 2：在 `aiStore.ts` 中添加多会话管理、历史搜索、会话重命名功能

在现有 `AIStore` interface 中新增以下方法（添加到 `syncMessageToBackend` 之后）：

```typescript
// ai-mate/react-ai-chat/src/store/aiStore.ts
// 在 AIStore interface 中添加：

  // 会话管理增强
  renameConversation: (role: AIRole, conversationId: string, title: string) => void;
  pinConversation: (role: AIRole, conversationId: string) => void;
  searchConversations: (role: AIRole, keyword: string) => Conversation[];
  archiveConversation: (role: AIRole, conversationId: string) => void;

  // Token 统计
  tokenUsage: Record<AIRole, { prompt: number; completion: number; total: number }>;
  updateTokenUsage: (role: AIRole, usage: { prompt: number; completion: number; total: number }) => void;

  // 错误状态
  lastError: string | null;
  setLastError: (error: string | null) => void;
```

在 `create<AIStore>()` 实现中添加对应方法（在 `syncMessageToBackend` 实现之后、`// UI状态` 之前添加）：

```typescript
  // ========== 会话管理增强 ==========

  // 重命名对话
  renameConversation: (role, conversationId, title) => {
    set((draft) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      if (conv) {
        conv.title = title;
        conv.updatedAt = Date.now();
      }
    });
  },

  // 置顶/取消置顶对话
  pinConversation: (role, conversationId) => {
    set((draft) => {
      const convs = draft.conversations[role];
      const conv = convs.find((c) => c.id === conversationId);
      if (conv) {
        // 使用 Conversation 的 isPinned 字段（需在 interface 中添加）
        (conv as Conversation & { isPinned?: boolean }).isPinned =
          !(conv as Conversation & { isPinned?: boolean }).isPinned;
        // 置顶的排到前面
        convs.sort((a, b) => {
          const aPinned = (a as Conversation & { isPinned?: boolean }).isPinned ? 1 : 0;
          const bPinned = (b as Conversation & { isPinned?: boolean }).isPinned ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          return b.updatedAt - a.updatedAt;
        });
      }
    });
  },

  // 搜索对话（按标题和消息内容）
  searchConversations: (role, keyword) => {
    const state = get();
    const lowerKey = keyword.toLowerCase();
    return state.conversations[role].filter((conv) => {
      if (conv.title.toLowerCase().includes(lowerKey)) return true;
      return conv.messages.some((m) => m.content.toLowerCase().includes(lowerKey));
    });
  },

  // 归档对话
  archiveConversation: (role, conversationId) => {
    set((draft) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      if (conv) {
        (conv as Conversation & { archived?: boolean }).archived = true;
      }
    });
  },

  // ========== Token 统计 ==========

  tokenUsage: {
    scout: { prompt: 0, completion: 0, total: 0 },
    sage: { prompt: 0, completion: 0, total: 0 },
    maker: { prompt: 0, completion: 0, total: 0 },
    butler: { prompt: 0, completion: 0, total: 0 },
  },

  updateTokenUsage: (role, usage) => {
    set((draft) => {
      draft.tokenUsage[role].prompt += usage.prompt;
      draft.tokenUsage[role].completion += usage.completion;
      draft.tokenUsage[role].total += usage.total;
    });
  },

  // ========== 错误状态 ==========

  lastError: null,
  setLastError: (err) => set({ lastError: err }),
```

同时更新 `Conversation` interface，添加可选的 `isPinned` 和 `archived` 字段：

```typescript
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  backendId?: number;
  isPinned?: boolean;  // 新增：是否置顶
  archived?: boolean;  // 新增：是否归档
}
```

- [ ] 步骤 3：验证状态管理逻辑

```bash
cd ai-mate/react-ai-chat
npx tsc --noEmit
# 预期：无类型错误

# 编写测试验证
# 创建 src/store/__tests__/aiStore.test.ts
```

```typescript
// ai-mate/react-ai-chat/src/store/__tests__/aiStore.test.ts
import { useAIStore } from '../aiStore';

describe('AIStore 会话管理', () => {
  beforeEach(() => {
    useAIStore.setState({
      conversations: { scout: [], sage: [], maker: [], butler: [] },
      activeConversationId: { scout: null, sage: null, maker: null, butler: null },
    });
  });

  it('创建对话后应出现在列表首位', () => {
    const id = useAIStore.getState().createConversation('scout');
    const convs = useAIStore.getState().conversations.scout;
    expect(convs).toHaveLength(1);
    expect(convs[0].id).toBe(id);
  });

  it('重命名对话应更新标题', () => {
    const id = useAIStore.getState().createConversation('scout');
    useAIStore.getState().renameConversation('scout', id, '新标题');
    const conv = useAIStore.getState().conversations.scout[0];
    expect(conv.title).toBe('新标题');
  });

  it('搜索对话应返回匹配结果', () => {
    const id = useAIStore.getState().createConversation('scout');
    useAIStore.getState().addMessage('scout', {
      id: 'msg-1', role: 'user', content: '创业融资渠道', timestamp: Date.now(),
    });
    const results = useAIStore.getState().searchConversations('scout', '融资');
    expect(results).toHaveLength(1);
  });

  it('Token 统计应累加', () => {
    useAIStore.getState().updateTokenUsage('sage', { prompt: 100, completion: 50, total: 150 });
    useAIStore.getState().updateTokenUsage('sage', { prompt: 200, completion: 100, total: 300 });
    const usage = useAIStore.getState().tokenUsage.sage;
    expect(usage.prompt).toBe(300);
    expect(usage.total).toBe(450);
  });
});
```

---

### 任务 2：创建通用消息组件 ChatMessage.tsx

**文件：** Create `ai-mate/react-ai-chat/src/components/chat/ChatMessage.tsx`

- [ ] 步骤 1：创建支持 Markdown 渲染、代码高亮、流式打字机效果的消息组件

```tsx
// ai-mate/react-ai-chat/src/components/chat/ChatMessage.tsx
import React, { useState, useEffect, useRef, memo } from 'react';
import { Avatar, Typography, Tooltip, Button, Space } from 'antd';
import {
  UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined,
  ReloadOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../store/aiStore';

const { Text } = Typography;

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
}

// 代码块渲染组件
const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '8px 0', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#282c34', padding: '4px 12px', fontSize: 12, color: '#abb2bf',
      }}>
        <span>{language || 'text'}</span>
        <Button type="text" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy} style={{ color: '#abb2bf' }}>
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={oneDark} customStyle={{ margin: 0 }}>
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// 流式打字机光标
const StreamingCursor: React.FC = () => (
  <span className="streaming-cursor" style={{
    display: 'inline-block', width: 8, height: 16,
    background: 'linear-gradient(90deg, #1890ff, #52c41a)',
    marginLeft: 2, animation: 'blink 1s infinite', borderRadius: 1,
    verticalAlign: 'text-bottom',
  }}>
    <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
  </span>
);

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, isStreaming, onRetry }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [message.content]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={messageRef} style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 12,
      padding: '12px 16px',
      marginBottom: 8,
    }}>
      {/* 头像 */}
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? '#1890ff' : '#52c41a',
          flexShrink: 0,
        }}
      />

      {/* 消息内容 */}
      <div style={{
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        {/* 消息气泡 */}
        <div style={{
          background: isUser ? '#1890ff' : '#f5f5f5',
          color: isUser ? '#fff' : '#333',
          padding: '10px 16px',
          borderRadius: 12,
          borderTopRightRadius: isUser ? 4 : 12,
          borderTopLeftRadius: isUser ? 12 : 4,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          wordBreak: 'break-word',
        }}>
          {/* 错误消息特殊样式 */}
          {message.loading && message.content === '' ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#999' }}>思考中</span>
              <span className="typing-dots" style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#999',
                    animation: `typing 1.4s ${i * 0.2}s infinite`,
                  }}>
                    <style>{`
                      @keyframes typing {
                        0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
                        30% { opacity: 1; transform: scale(1); }
                      }
                    `}</style>
                  </span>
                ))}
              </span>
            </div>
          ) : isUser ? (
            <Text style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{message.content}</Text>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const value = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return <CodeBlock language={match[1]} value={value} />;
                    }
                    return (
                      <code style={{
                        background: '#f0f0f0', padding: '2px 6px',
                        borderRadius: 3, fontSize: 13,
                      }} {...props}>
                        {children}
                      </code>
                    );
                  },
                  // 表格样式
                  table({ children }) {
                    return (
                      <table style={{
                        borderCollapse: 'collapse', width: '100%',
                        margin: '8px 0', border: '1px solid #ddd',
                      }}>
                        {children}
                      </table>
                    );
                  },
                  th({ children }) {
                    return (
                      <th style={{
                        border: '1px solid #ddd', padding: '8px 12px',
                        background: '#f5f5f5', textAlign: 'left',
                      }}>
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td style={{ border: '1px solid #ddd', padding: '8px 12px' }}>
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* 流式光标 */}
              {isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 4,
          fontSize: 12, color: '#999',
        }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {formatTime(message.timestamp)}
          </Text>
          {!isUser && !isStreaming && message.content && (
            <Space size={4}>
              <Tooltip title="复制">
                <Button type="text" size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={handleCopyMessage} style={{ fontSize: 11 }} />
              </Tooltip>
              {onRetry && (
                <Tooltip title="重新生成">
                  <Button type="text" size="small" icon={<ReloadOutlined />}
                    onClick={onRetry} style={{ fontSize: 11 }} />
                </Tooltip>
              )}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
};

// 使用 memo 优化重渲染
export default memo(ChatMessageComponent);
```

- [ ] 步骤 2：在全局 CSS 中添加 Markdown 样式

在 `ai-mate/react-ai-chat/src/index.css` 末尾追加：

```css
/* Markdown 渲染样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
}
.markdown-body p { margin: 8px 0; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 {
  margin: 16px 0 8px; font-weight: 600;
}
.markdown-body ul, .markdown-body ol { padding-left: 20px; margin: 8px 0; }
.markdown-body blockquote {
  border-left: 3px solid #1890ff;
  padding-left: 12px; margin: 8px 0;
  color: #666; background: #f6f8fa;
}
.markdown-body a { color: #1890ff; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body img { max-width: 100%; border-radius: 8px; }
```

- [ ] 步骤 3：验证组件渲染

```bash
cd ai-mate/react-ai-chat
npm run dev
# 在对话页面发送消息，验证：
# [ ] 用户消息显示在右侧，蓝色气泡
# [ ] AI 消息显示在左侧，灰色气泡，支持 Markdown 渲染
# [ ] 代码块有语法高亮和复制按钮
# [ ] 流式输出时有打字机光标闪烁
# [ ] 消息下方有时间和复制按钮
```

---

### 任务 3：创建对话列表侧边栏 ChatSidebar.tsx

**文件：** Create `ai-mate/react-ai-chat/src/components/chat/ChatSidebar.tsx`

- [ ] 步骤 1：创建侧边栏组件，支持会话切换、搜索、删除

```tsx
// ai-mate/react-ai-chat/src/components/chat/ChatSidebar.tsx
import React, { useState, useMemo } from 'react';
import {
  List, Input, Button, Dropdown, Empty, Tooltip, Tag, Popconfirm,
  Typography, Badge, Divider,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, MessageOutlined,
  MoreOutlined, PushpinOutlined, PushpinFilled, EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAIStore, type AIRole, type Conversation } from '../../store/aiStore';

const { Text } = Typography;

interface ChatSidebarProps {
  role: AIRole;
  onSelectConversation?: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ role, onSelectConversation }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    deleteAndSync,
    renameConversation,
    pinConversation,
    createAndSync,
  } = useAIStore();

  // 搜索过滤
  const filteredConversations = useMemo(() => {
    if (!searchKeyword.trim()) return conversations[role];
    return useAIStore.getState().searchConversations(role, searchKeyword);
  }, [conversations[role], searchKeyword, role]);

  // 处理选择会话
  const handleSelect = (id: string) => {
    setActiveConversation(role, id);
    // 加载消息
    useAIStore.getState().loadMessages(role, id);
    onSelectConversation?.(id);
  };

  // 处理新建会话
  const handleCreate = async () => {
    await createAndSync(role);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    await deleteAndSync(role, id);
  };

  // 处理重命名
  const handleRenameStart = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleRenameConfirm = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(role, editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  // 格式化时间
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  // 右键菜单项
  const getMenuItems = (conv: Conversation) => [
    {
      key: 'rename',
      label: '重命名',
      icon: <EditOutlined />,
      onClick: () => handleRenameStart(conv),
    },
    {
      key: 'pin',
      label: conv.isPinned ? '取消置顶' : '置顶',
      icon: conv.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      onClick: () => pinConversation(role, conv.id),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(conv.id),
    },
  ];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#fafafa', borderRight: '1px solid #f0f0f0',
    }}>
      {/* 顶部：新建按钮 */}
      <div style={{ padding: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} block onClick={handleCreate}>
          新建对话
        </Button>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '0 12px 12px' }}>
        <Input
          placeholder="搜索对话..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
      </div>

      <Divider style={{ margin: '0 0 8px' }} />

      {/* 对话列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {filteredConversations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchKeyword ? '未找到匹配对话' : '暂无对话'}
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(conv) => (
              <List.Item
                key={conv.id}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  marginBottom: 4,
                  background: activeConversationId[role] === conv.id ? '#e6f7ff' : 'transparent',
                  border: activeConversationId[role] === conv.id ? '1px solid #91d5ff' : '1px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onClick={() => editingId !== conv.id && handleSelect(conv.id)}
              >
                <div style={{ width: '100%' }}>
                  {/* 重命名模式 */}
                  {editingId === conv.id ? (
                    <Input
                      size="small"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onPressEnter={handleRenameConfirm}
                      onBlur={handleRenameConfirm}
                      autoFocus
                      suffix={
                        <Button size="small" type="link" onClick={handleRenameConfirm}>
                          确定
                        </Button>
                      }
                    />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {conv.isPinned && <PushpinFilled style={{ color: '#1890ff', fontSize: 12 }} />}
                          <Text ellipsis style={{ fontSize: 14, fontWeight: 500 }}>
                            {conv.title}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined /> {formatRelativeTime(conv.updatedAt)}
                          </Text>
                          {conv.messages.length > 0 && (
                            <Badge count={conv.messages.length} style={{ fontSize: 10 }} size="small" />
                          )}
                        </div>
                      </div>

                      {/* 更多操作 */}
                      <Dropdown menu={{ items: getMenuItems(conv) }} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {/* 底部统计 */}
      <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <MessageOutlined /> 共 {conversations[role].length} 个对话
        </Text>
      </div>
    </div>
  );
};

export default ChatSidebar;
```

- [ ] 步骤 2：在对话布局中使用侧边栏

修改 `ai-mate/react-ai-chat/src/components/ChatLayout.tsx`，引入 `ChatSidebar`：

```tsx
// 在 ChatLayout.tsx 中
import ChatSidebar from './chat/ChatSidebar';

// 在布局中添加侧边栏
<div style={{ display: 'flex', height: '100%' }}>
  {!sidebarCollapsed && (
    <div style={{ width: 280, flexShrink: 0 }}>
      <ChatSidebar role={currentRole} />
    </div>
  )}
  <div style={{ flex: 1 }}>
    {/* 对话主区域 */}
  </div>
</div>
```

- [ ] 步骤 3：验证侧边栏功能

```bash
cd ai-mate/react-ai-chat
npm run dev
# 验证清单：
# [ ] 点击"新建对话"按钮，创建新会话并自动选中
# [ ] 在搜索框输入关键词，列表实时过滤
# [ ] 点击对话项切换活跃会话
# [ ] 点击"更多"按钮弹出菜单（重命名、置顶、删除）
# [ ] 重命名后标题更新
# [ ] 置顶的对话排在列表顶部
# [ ] 删除对话后有确认提示，删除后列表更新
# [ ] 底部显示对话总数
```

---

### 任务 4：创建错误处理组件 ErrorBoundary.tsx

**文件：** Create `ai-mate/react-ai-chat/src/components/chat/ErrorBoundary.tsx`

- [ ] 步骤 1：创建支持自动重试的错误边界组件

```tsx
// ai-mate/react-ai-chat/src/components/chat/ErrorBoundary.tsx
import React, { Component, type ReactNode } from 'react';
import { Result, Button, Typography, Space, Alert } from 'antd';
import { ReloadOutlined, WarningOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface ErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;        // 最大重试次数，默认 3
  onRetry?: () => void;      // 重试回调
  fallback?: ReactNode;      // 自定义错误 UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  errorHistory: Error[];
}

class ChatErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      errorHistory: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorHistory: [...(this as unknown as ErrorBoundaryState).errorHistory || [], error].slice(-5),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ChatErrorBoundary] 捕获错误:', error, errorInfo);

    // 可以在这里上报错误到后端
    // reportErrorToBackend(error, errorInfo);
  }

  // 手动重试
  handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('[ChatErrorBoundary] 已达最大重试次数');
      return;
    }

    // 调用外部重试回调
    onRetry?.();

    // 重置状态
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  // 完全重置
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      errorHistory: [],
    });
  };

  render() {
    const { hasError, error, retryCount, errorHistory } = this.state;
    const { maxRetries = 3, fallback, children } = this.props;

    if (hasError && error) {
      // 自定义 fallback
      if (fallback) return <>{fallback}</>;

      const canRetry = retryCount < maxRetries;

      return (
        <div style={{ padding: 24 }}>
          <Result
            status="error"
            icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
            title="对话出现错误"
            subTitle={
              <Space direction="vertical" size={4}>
                <Text type="secondary">{error.message || '未知错误'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  已重试 {retryCount}/{maxRetries} 次
                </Text>
              </Space>
            }
            extra={[
              <Button
                key="retry"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
                disabled={!canRetry}
              >
                {canRetry ? `重试 (${maxRetries - retryCount} 次剩余)` : '已达最大重试次数'}
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                重置
              </Button>,
            ]}
          >
            {/* 错误详情（可折叠） */}
            {errorHistory.length > 0 && (
              <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
                <Alert
                  type="warning"
                  message="错误历史记录"
                  description={
                    <div>
                      {errorHistory.map((err, i) => (
                        <Paragraph key={i} style={{ fontSize: 12, margin: '4px 0' }}>
                          <WarningOutlined style={{ color: '#faad14' }} />
                          {' '}
                          [{new Date().toLocaleTimeString()}] {err.message}
                        </Paragraph>
                      ))}
                    </div>
                  }
                  style={{ marginTop: 16 }}
                />
              </div>
            )}
          </Result>
        </div>
      );
    }

    return <>{children}</>;
  }
}

/**
 * 函数式错误提示组件（用于非 ErrorBoundary 场景）
 * 如流式请求失败时的内联提示
 */
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  message, onRetry, retryCount = 0, maxRetries = 3,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <Alert
      type="error"
      message="请求失败"
      description={
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text>{message}</Text>
          {canRetry ? (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              重试 ({maxRetries - retryCount} 次剩余)
            </Button>
          ) : (
            <Text type="secondary">已达最大重试次数，请检查网络后刷新页面</Text>
          )}
        </Space>
      }
      showIcon
      style={{ margin: '8px 0' }}
    />
  );
};

export default ChatErrorBoundary;
```

- [ ] 步骤 2：在对话页面中包裹 ErrorBoundary

修改 `ai-mate/react-ai-chat/src/pages/ScoutAI.tsx`（其他页面同理）：

```tsx
import ChatErrorBoundary, { InlineError } from '../components/chat/ErrorBoundary';

// 在组件中使用
const ScoutAI = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);

  const handleSend = async () => {
    setStreamError(null);
    try {
      // ... 流式调用逻辑
    } catch (err) {
      setStreamError((err as Error).message);
      setRetryCount((c) => c + 1);
    }
  };

  const handleRetry = () => {
    setStreamError(null);
    handleSend();
  };

  return (
    <ChatErrorBoundary maxRetries={3} onRetry={handleRetry}>
      <div>
        {/* 消息列表 */}
        {streamError && (
          <InlineError
            message={streamError}
            onRetry={handleRetry}
            retryCount={retryCount}
            maxRetries={3}
          />
        )}
        {/* 输入框 */}
      </div>
    </ChatErrorBoundary>
  );
};
```

- [ ] 步骤 3：验证错误处理

```bash
cd ai-mate/react-ai-chat
npm run dev

# 测试场景：
# [ ] 模拟组件渲染错误 -> 显示错误界面，含重试按钮
# [ ] 点击重试按钮 -> 重新渲染组件
# [ ] 连续重试 3 次后 -> 按钮禁用，显示"已达最大重试次数"
# [ ] 点击"重置"按钮 -> 清空错误状态和历史
# [ ] 流式请求失败 -> 显示内联错误提示，可重试
# [ ] 错误历史记录正确显示
```

---

### 任务 5：创建 Token 消耗展示组件 TokenUsage.tsx

**文件：** Create `ai-mate/react-ai-chat/src/components/chat/TokenUsage.tsx`

- [ ] 步骤 1：创建 Token 消耗展示组件

```tsx
// ai-mate/react-ai-chat/src/components/chat/TokenUsage.tsx
import React, { useMemo } from 'react';
import { Tooltip, Progress, Typography, Space, Statistic, Card, Tag } from 'antd';
import {
  ThunderboltOutlined, FireOutlined, DollarOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useAIStore, type AIRole } from '../../store/aiStore';

const { Text } = Typography;

interface TokenUsageProps {
  role?: AIRole;           // 指定角色，不传则显示全部
  compact?: boolean;       // 紧凑模式
  currentUsage?: {         // 当前消息的 Token 用量
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Token 成本估算（智谱 GLM-4-Flash 价格）
const COST_PER_1K = {
  prompt: 0.001,      // 输入：0.001 元/千Token
  completion: 0.001,  // 输出：0.001 元/千Token
};

// 角色颜色映射
const ROLE_COLORS: Record<string, string> = {
  scout: '#1890ff',
  sage: '#722ed1',
  maker: '#13c2c2',
  butler: '#fa8c16',
};

const TokenUsage: React.FC<TokenUsageProps> = ({ role, compact = false, currentUsage }) => {
  const tokenUsage = useAIStore((s) => s.tokenUsage);

  // 计算总用量
  const stats = useMemo(() => {
    if (role) {
      return tokenUsage[role];
    }
    // 汇总所有角色
    return Object.values(tokenUsage).reduce(
      (acc, u) => ({
        prompt: acc.prompt + u.prompt,
        completion: acc.completion + u.completion,
        total: acc.total + u.total,
      }),
      { prompt: 0, completion: 0, total: 0 }
    );
  }, [tokenUsage, role]);

  // 估算成本
  const estimatedCost = useMemo(() => {
    const promptCost = (stats.prompt / 1000) * COST_PER_1K.prompt;
    const completionCost = (stats.completion / 1000) * COST_PER_1K.completion;
    return (promptCost + completionCost).toFixed(4);
  }, [stats]);

  // 进度条百分比（假设上限 100000 Token）
  const maxTokens = 100000;
  const percentage = Math.min((stats.total / maxTokens) * 100, 100);

  if (compact) {
    // 紧凑模式：仅显示图标和数字
    return (
      <Tooltip title={`输入: ${stats.prompt} | 输出: ${stats.completion} | 总计: ${stats.total}`}>
        <Space size={4}>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <Text style={{ fontSize: 12 }}>{stats.total}</Text>
        </Space>
      </Tooltip>
    );
  }

  return (
    <Card size="small" style={{ borderRadius: 8 }}>
      {/* 标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Space>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <Text strong>Token 消耗</Text>
          {role && <Tag color={ROLE_COLORS[role]}>{role}</Tag>}
        </Space>
        <Tooltip title="Token 是 AI 模型处理文本的基本单位，1 个中文字约等于 2 个 Token">
          <InfoCircleOutlined style={{ color: '#999' }} />
        </Tooltip>
      </div>

      {/* 当前消息用量（如果有） */}
      {currentUsage && (
        <div style={{ marginBottom: 12, padding: 8, background: '#f6f8fa', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>本次对话</Text>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Statistic
              title="输入"
              value={currentUsage.prompt_tokens}
              prefix={<FireOutlined style={{ color: '#fa541c' }} />}
              valueStyle={{ fontSize: 16 }}
            />
            <Statistic
              title="输出"
              value={currentUsage.completion_tokens}
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ fontSize: 16 }}
            />
            <Statistic
              title="合计"
              value={currentUsage.total_tokens}
              valueStyle={{ fontSize: 16, color: '#1890ff' }}
            />
          </div>
        </div>
      )}

      {/* 累计统计 */}
      <Space size={24} style={{ marginBottom: 12 }}>
        <Statistic
          title="累计输入"
          value={stats.prompt}
          prefix={<FireOutlined style={{ color: '#fa541c' }} />}
        />
        <Statistic
          title="累计输出"
          value={stats.completion}
          prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
        />
        <Statistic
          title="累计总量"
          value={stats.total}
          valueStyle={{ color: '#1890ff', fontWeight: 600 }}
        />
      </Space>

      {/* 进度条 */}
      <div style={{ marginBottom: 8 }}>
        <Progress
          percent={percentage}
          strokeColor={{
            '0%': '#1890ff',
            '100%': percentage > 80 ? '#ff4d4f' : '#52c41a',
          }}
          format={(p) => `${p?.toFixed(1)}%`}
          size="small"
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          额度使用：{stats.total} / {maxTokens} Token
        </Text>
      </div>

      {/* 成本估算 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <DollarOutlined style={{ color: '#faad14' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>预估成本</Text>
        </Space>
        <Text strong style={{ color: '#fa541c' }}>¥{estimatedCost}</Text>
      </div>

      {/* 按角色细分（仅在不指定 role 时显示） */}
      {!role && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>按角色细分：</Text>
          <div style={{ marginTop: 4 }}>
            {(Object.keys(tokenUsage) as AIRole[]).map((r) => (
              <div key={r} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <Tag color={ROLE_COLORS[r]} style={{ margin: 0 }}>{r}</Tag>
                <Text style={{ fontSize: 12 }}>{tokenUsage[r].total} Token</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TokenUsage;
```

- [ ] 步骤 2：在对话页面中集成 Token 展示

```tsx
// 在对话页面侧边栏或顶部栏中添加
import TokenUsage from '../components/chat/TokenUsage';

// 紧凑模式（在输入框旁边）
<TokenUsage role="scout" compact />

// 完整模式（在侧边面板中）
<TokenUsage role="scout" currentUsage={lastUsage} />

// 全局汇总（在设置页面）
<TokenUsage />
```

- [ ] 步骤 3：在 aiStore 的流式调用中更新 Token 用量

```tsx
// 在发送消息的流式回调完成后，调用 updateTokenUsage
// 例如在 ScoutAI.tsx 中：
try {
  await chatWithRagStream(
    messages,
    (content) => { /* 流式更新 */ },
    (sources) => { /* 处理来源 */ },
    { role: 'scout' }
  );

  // 流式结束后，更新 Token 统计（从后端响应中获取）
  // 假设后端在流式结束时返回 usage 数据
  updateTokenUsage('scout', {
    prompt: usage.prompt_tokens,
    completion: usage.completion_tokens,
    total: usage.total_tokens,
  });
} catch (err) {
  // 错误处理
}
```

- [ ] 步骤 4：验证 Token 展示

```bash
cd ai-mate/react-ai-chat
npm run dev

# 验证清单：
# [ ] 紧凑模式显示图标和总 Token 数
# [ ] 完整模式显示输入/输出/总量统计
# [ ] 进度条随 Token 累计增长
# [ ] 预估成本正确计算
# [ ] 按角色细分显示各角色用量
# [ ] 当前消息用量区域在对话后更新
```

---

### 任务 6：优化 aiService.ts 请求管理

**文件：** Modify `ai-mate/react-ai-chat/src/services/aiService.ts`

- [ ] 步骤 1：添加请求取消（AbortController）、超时处理、断线重连

在 `aiService.ts` 中新增可取消的流式请求函数和超时重连逻辑：

```typescript
// 在 ai-mate/react-ai-chat/src/services/aiService.ts 末尾追加

// ========== 请求取消与超时管理 ==========

/**
 * 可取消的流式请求控制器管理器
 */
class StreamRequestManager {
  private controllers: Map<string, AbortController> = new Map();

  /**
   * 创建一个新的请求控制器
   */
  create(requestId: string): AbortController {
    // 先取消同 ID 的旧请求
    this.abort(requestId);
    const controller = new AbortController();
    this.controllers.set(requestId, controller);
    return controller;
  }

  /**
   * 取消指定请求
   */
  abort(requestId: string) {
    const controller = this.controllers.get(requestId);
    if (controller) {
      controller.abort();
      this.controllers.delete(requestId);
    }
  }

  /**
   * 取消所有请求
   */
  abortAll() {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }

  /**
   * 检查请求是否被取消
   */
  isAborted(requestId: string): boolean {
    const controller = this.controllers.get(requestId);
    return controller?.signal.aborted || false;
  }
}

export const streamManager = new StreamRequestManager();

// ========== 带超时和重连的流式请求 ==========

interface StreamOptions {
  role: AIRole;
  systemPrompt?: string;
  token?: string;
  timeout?: number;          // 超时时间（毫秒），默认 30000
  maxRetries?: number;      // 最大重试次数，默认 3
  retryDelay?: number;      // 重试延迟（毫秒），默认 1000
  signal?: AbortSignal;     // 外部传入的取消信号
}

/**
 * 带超时处理和断线重连的流式请求
 */
export async function chatWithRetry(
  messages: ZhipuMessage[],
  onChunk: (content: string) => void,
  options: StreamOptions
): Promise<void> {
  const {
    role, systemPrompt, token,
    timeout = 30000,
    maxRetries = 3,
    retryDelay = 1000,
    signal,
  } = options;

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      // 创建超时控制器
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

      // 合并外部信号和超时信号
      const combinedSignal = signal
        ? AbortSignal.any([signal, timeoutController.signal])
        : timeoutController.signal;

      await chatWithZhipuStream(messages, onChunk, {
        system_prompt: systemPrompt,
        token,
      });

      clearTimeout(timeoutId);
      return; // 成功则退出
    } catch (err) {
      clearTimeout(timeoutId!); // 确保清理超时

      // 用户主动取消，不重试
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('[Stream] 请求被用户取消');
        throw err;
      }

      lastError = err as Error;
      retryCount++;

      // 超时错误
      const isTimeout = err instanceof Error && err.message.includes('timeout');

      // 网络错误
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error && err.message.includes('network'));

      if (retryCount <= maxRetries && (isTimeout || isNetworkError)) {
        console.warn(
          `[Stream] 第 ${retryCount} 次重试 (${err instanceof Error ? err.message : '未知错误'})...`
        );
        // 指数退避延迟
        const delay = retryDelay * Math.pow(2, retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('未知错误');
}

// ========== 检测网络状态 ==========

/**
 * 网络状态检测器
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  get status(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach((l) => l(online));
  }
}

// ========== 统一的流式对话入口 ==========

/**
 * 统一的 AI 流式对话入口
 * 整合了取消、超时、重连能力
 *
 * @param messages - 消息列表
 * @param onChunk - 流式回调
 * @param options - 配置
 */
export async function smartChatStream(
  messages: ZhipuMessage[],
  onChunk: (content: string) => void,
  options: {
    role: AIRole;
    systemPrompt?: string;
    token?: string;
    requestId?: string;     // 请求 ID（用于取消）
    timeout?: number;
    maxRetries?: number;
  }
): Promise<void> {
  const { requestId, ...restOptions } = options;

  // 检查网络状态
  const networkMonitor = NetworkMonitor.getInstance();
  if (!networkMonitor.status) {
    throw new Error('网络已断开，请检查网络连接后重试');
  }

  // 创建可取消的信号
  let signal: AbortSignal | undefined;
  if (requestId) {
    const controller = streamManager.create(requestId);
    signal = controller.signal;
  }

  await chatWithRetry(messages, onChunk, {
    ...restOptions,
    signal,
  });
}
```

- [ ] 步骤 2：在对话页面中使用增强的请求管理

修改 `ai-mate/react-ai-chat/src/pages/ScoutAI.tsx` 的发送逻辑：

```tsx
import { smartChatStream, streamManager, NetworkMonitor } from '../services/aiService';

const ScoutAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(true);

  // 监听网络状态
  useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    const unsubscribe = monitor.onStatusChange((online) => {
      setNetworkStatus(online);
    });
    return unsubscribe;
  }, []);

  const handleSend = async () => {
    const requestId = `scout-${Date.now()}`;

    try {
      setIsGenerating(true);

      await smartChatStream(
        zhipuMessages,
        (content) => {
          // 流式更新消息
          updateMessage('scout', conversationId, assistantMsgId, currentContent + content);
        },
        {
          role: 'scout',
          requestId,
          timeout: 60000,       // 60 秒超时
          maxRetries: 3,       // 最多重试 3 次
        }
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        message.info('已取消生成');
      } else {
        message.error('生成失败：' + (err as Error).message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 取消生成
  const handleStop = () => {
    streamManager.abortAll();
    setIsGenerating(false);
  };

  return (
    <div>
      {/* 网络状态提示 */}
      {!networkStatus && (
        <Alert
          type="error"
          message="网络已断开"
          description="请检查网络连接，恢复后将自动重试"
          showIcon
          banner
        />
      )}

      {/* 停止生成按钮 */}
      {isGenerating && (
        <Button danger icon={<StopOutlined />} onClick={handleStop}>
          停止生成
        </Button>
      )}

      {/* 发送按钮 */}
      <Button onClick={handleSend} disabled={isGenerating || !networkStatus}>
        {isGenerating ? '生成中...' : '发送'}
      </Button>
    </div>
  );
};
```

- [ ] 步骤 3：编写测试验证请求管理逻辑

```typescript
// ai-mate/react-ai-chat/src/services/__tests__/aiService.test.ts
import { streamManager, NetworkMonitor } from '../aiService';

describe('StreamRequestManager', () => {
  it('创建控制器后可通过 ID 取消', () => {
    const controller = streamManager.create('test-1');
    expect(controller.signal.aborted).toBe(false);
    streamManager.abort('test-1');
    expect(controller.signal.aborted).toBe(true);
  });

  it('重复创建同 ID 会取消旧请求', () => {
    const controller1 = streamManager.create('test-2');
    const controller2 = streamManager.create('test-2');
    expect(controller1.signal.aborted).toBe(true);
    expect(controller2.signal.aborted).toBe(false);
  });

  it('abortAll 取消所有请求', () => {
    const c1 = streamManager.create('a');
    const c2 = streamManager.create('b');
    streamManager.abortAll();
    expect(c1.signal.aborted).toBe(true);
    expect(c2.signal.aborted).toBe(true);
  });
});

describe('NetworkMonitor', () => {
  it('单例模式', () => {
    const m1 = NetworkMonitor.getInstance();
    const m2 = NetworkMonitor.getInstance();
    expect(m1).toBe(m2);
  });

  it('监听状态变化', () => {
    const monitor = NetworkMonitor.getInstance();
    const callback = jest.fn();
    const unsubscribe = monitor.onStatusChange(callback);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
```

- [ ] 步骤 4：验证完整的请求管理流程

```bash
cd ai-mate/react-ai-chat
npm run dev

# 验证清单：
# [ ] 正常发送消息，流式输出正常
# [ ] 生成过程中点击"停止生成"，请求被取消
# [ ] 断开网络后，显示"网络已断开"提示
# [ ] 恢复网络后，提示消失，可正常发送
# [ ] 模拟超时（后端延迟响应），自动重试最多 3 次
# [ ] 重试使用指数退避（1s, 2s, 4s）
# [ ] 用户主动取消不触发重试
```

---

## 验收标准

1. `aiStore.ts` 支持多会话管理、历史搜索、会话重命名、置顶、归档
2. `ChatMessage.tsx` 支持 Markdown 渲染、代码高亮（含复制）、流式打字机光标
3. `ChatSidebar.tsx` 支持会话切换、搜索过滤、右键菜单（重命名/置顶/删除）
4. `ErrorBoundary.tsx` 支持自动重试（3次上限）、错误历史记录、内联错误提示
5. `TokenUsage.tsx` 展示输入/输出/总量统计、进度条、成本估算、按角色细分
6. `aiService.ts` 支持 AbortController 请求取消、超时处理（指数退避重试）、网络状态检测
7. 所有组件 TypeScript 类型检查通过，无编译错误
