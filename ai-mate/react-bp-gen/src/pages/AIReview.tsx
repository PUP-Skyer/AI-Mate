/**
 * Sage（军师）- AI 评审页
 * 展示 AI 评审建议，支持接受/忽略操作
 */

import React, { useEffect, useState } from 'react';
import {
  Layout,
  Button,
  Typography,
  Card,
  List,
  Tag,
  Spin,
  Empty,
  message,
  Progress,
  Space,
  Alert,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useSageStore } from '../store/sageStore';
import type { ReviewSuggestion } from '../services/sageService';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const SUGGESTION_TYPE_CONFIG: Record<
  ReviewSuggestion['type'],
  { color: string; icon: React.ReactNode; label: string }
> = {
  improvement: {
    color: 'blue',
    icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    label: '改进建议',
  },
  warning: {
    color: 'orange',
    icon: <WarningOutlined style={{ color: '#faad14' }} />,
    label: '警告',
  },
  error: {
    color: 'red',
    icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
    label: '错误',
  },
  info: {
    color: 'green',
    icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    label: '优点',
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#faad14';
  return '#ff4d4f';
}

const AIReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentDocument,
    currentDocumentLoading,
    fetchDocument,
    reviewResult,
    reviewLoading,
    submitDocumentReview,
    fetchReviewResult,
    acceptReviewSuggestion,
    ignoreReviewSuggestion,
  } = useSageStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument(id);
      // 尝试获取已有的评审结果
      fetchReviewResult(id).catch(() => {
        // 没有评审结果是正常的，忽略错误
      });
    }
  }, [id, fetchDocument, fetchReviewResult]);

  const handleSubmitReview = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await submitDocumentReview(id);
      message.success('评审已提交，正在分析中...');
    } catch (err: any) {
      message.error(err.message || '提交评审失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    if (!id) return;
    try {
      await acceptReviewSuggestion(id, suggestionId);
      message.success('已接受建议');
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleIgnore = async (suggestionId: string) => {
    if (!id) return;
    try {
      await ignoreReviewSuggestion(id, suggestionId);
      message.info('已忽略建议');
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  if (currentDocumentLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="加载文档中..." />
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description="文档不存在" />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/templates')}
          >
            返回模板列表
          </Button>
        </Content>
      </Layout>
    );
  }

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
          onClick={() => navigate(`/editor/${id}`)}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          AI 评审 - {currentDocument.title}
        </Title>
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={handleSubmitReview}
          loading={submitting || reviewLoading}
        >
          {reviewLoading ? '评审分析中...' : '开始评审'}
        </Button>
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* 评审中状态 */}
          {reviewLoading && (
            <Alert
              message="AI 正在分析您的文档，请稍候..."
              description="分析时间取决于文档长度，通常需要 10-30 秒。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* 评审结果 */}
          {reviewResult && !reviewLoading && (
            <>
              {/* 总分 */}
              <Card style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={reviewResult.overallScore}
                      size={100}
                      strokeColor={getScoreColor(reviewResult.overallScore)}
                      format={(percent) => (
                        <span style={{ fontSize: 24, fontWeight: 'bold' }}>
                          {percent}
                        </span>
                      )}
                    />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      综合评分
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ marginBottom: 8 }}>
                      评审总结
                    </Title>
                    <Paragraph style={{ color: '#555' }}>
                      {reviewResult.summary}
                    </Paragraph>
                  </div>
                </div>
              </Card>

              {/* 各章节评分 */}
              {reviewResult.sectionScores.length > 0 && (
                <Card
                  size="small"
                  title="章节评分"
                  style={{ marginBottom: 24 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    {reviewResult.sectionScores.map((ss) => (
                      <div
                        key={ss.sectionId}
                        style={{
                          minWidth: 120,
                          textAlign: 'center',
                          padding: '8px 16px',
                          background: '#fafafa',
                          borderRadius: 8,
                        }}
                      >
                        <Progress
                          type="circle"
                          percent={ss.score}
                          size={60}
                          strokeColor={getScoreColor(ss.score)}
                          format={(percent) => (
                            <span style={{ fontSize: 14, fontWeight: 'bold' }}>
                              {percent}
                            </span>
                          )}
                        />
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: 'block', marginTop: 4 }}
                        >
                          {ss.sectionTitle}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 改进建议列表 */}
              <Card
                title={
                  <span>
                    <RobotOutlined style={{ marginRight: 8 }} />
                    改进建议 ({reviewResult.suggestions.length})
                  </span>
                }
              >
                {reviewResult.suggestions.length === 0 ? (
                  <Empty description="暂无改进建议，文档质量很好！" />
                ) : (
                  <List
                    dataSource={reviewResult.suggestions}
                    renderItem={(suggestion) => {
                      const config = SUGGESTION_TYPE_CONFIG[suggestion.type];
                      return (
                        <List.Item
                          style={{
                            padding: '12px 0',
                            borderBottom: '1px solid #f5f5f5',
                          }}
                        >
                          <div style={{ width: '100%' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              {config.icon}
                              <Text strong>{suggestion.sectionTitle}</Text>
                              <Tag color={config.color}>{config.label}</Tag>
                              {suggestion.accepted && (
                                <Tag color="green">已接受</Tag>
                              )}
                            </div>
                            <Paragraph
                              style={{
                                color: '#555',
                                marginBottom: 4,
                                fontSize: 13,
                              }}
                            >
                              {suggestion.content}
                            </Paragraph>
                            <div
                              style={{
                                background: '#f6ffed',
                                border: '1px solid #b7eb8f',
                                borderRadius: 6,
                                padding: '8px 12px',
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>
                                <strong>建议：</strong>
                                {suggestion.suggestion}
                              </Text>
                            </div>
                            {!suggestion.accepted && (
                              <Space>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() =>
                                    handleAccept(suggestion.id)
                                  }
                                >
                                  接受建议
                                </Button>
                                <Button
                                  size="small"
                                  icon={<CloseCircleOutlined />}
                                  onClick={() =>
                                    handleIgnore(suggestion.id)
                                  }
                                >
                                  忽略
                                </Button>
                              </Space>
                            )}
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                )}
              </Card>
            </>
          )}

          {/* 未评审状态 */}
          {!reviewResult && !reviewLoading && (
            <Card>
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                }}
              >
                <RobotOutlined
                  style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
                />
                <Title level={4}>尚未进行 AI 评审</Title>
                <Paragraph type="secondary">
                  点击上方"开始评审"按钮，AI 将对您的文档进行全面分析，
                  提供专业的改进建议。
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  onClick={handleSubmitReview}
                  loading={submitting}
                  style={{ marginTop: 16 }}
                >
                  开始评审
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default AIReview;
