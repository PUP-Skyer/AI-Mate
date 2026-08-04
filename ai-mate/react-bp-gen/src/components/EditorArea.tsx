/**
 * 编辑区域组件 - 富文本编辑区，支持 AI 生成
 */

import React, { useState } from 'react';
import { Input, Typography, Button, message, Space } from 'antd';
import { RobotOutlined, LoadingOutlined } from '@ant-design/icons';
import { useBPStore } from '../store/bpStore';
import { generateBPContentStream } from '../services/aiApi';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface EditorAreaProps {
  chapter: Chapter | null;
}

const EditorArea: React.FC<EditorAreaProps> = ({ chapter }) => {
  const { updateChapterContent, generatingChapterId, setGeneratingChapterId } = useBPStore();
  const [aiContext, setAiContext] = useState('');

  if (!chapter) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}
      >
        请从左侧选择一个章节开始编辑
      </div>
    );
  }

  const isGenerating = generatingChapterId === chapter.id;

  const handleAIGenerate = async () => {
    if (isGenerating) return;

    const token = localStorage.getItem('ai-mate-token') || undefined;
    setGeneratingChapterId(chapter.id);

    try {
      const context = aiContext || '请根据商业计划书的标准格式生成该章节内容。';
      await generateBPContentStream(
        chapter.title,
        context,
        (text) => {
          updateChapterContent(chapter.id, text);
        },
        token
      );
      message.success('AI 生成完成');
    } catch (err: any) {
      message.error(err.message || 'AI 生成失败');
    } finally {
      setGeneratingChapterId(null);
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          {chapter.order}. {chapter.title}
        </Title>
        <Space>
          <Input
            placeholder="输入背景信息（可选）"
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            style={{ width: 260 }}
            size="small"
            disabled={isGenerating}
          />
          <Button
            type="primary"
            icon={isGenerating ? <LoadingOutlined /> : <RobotOutlined />}
            onClick={handleAIGenerate}
            loading={isGenerating}
            size="small"
          >
            {isGenerating ? '生成中...' : 'AI 生成'}
          </Button>
        </Space>
      </div>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        在此编辑章节内容，支持富文本格式。点击"AI 生成"可自动填充内容。
      </Paragraph>
      <TextArea
        placeholder="请输入内容..."
        value={chapter.content}
        onChange={(e) => updateChapterContent(chapter.id, e.target.value)}
        style={{ minHeight: 400, fontSize: 14, lineHeight: 1.8 }}
        disabled={isGenerating}
      />
    </div>
  );
};

export default EditorArea;
