/**
 * 新手引导面板 - 用于 Butler 功能模块
 */

import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, App, Spin, Typography, Space } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { getOnboardingStatus, completeOnboardingStep, type OnboardingStatus } from '../../services/butlerService';

const { Text } = Typography;

const defaultSteps = [
  { title: '首次对话', description: '开始你的第一次对话' },
  { title: '探索功能', description: '了解AI的核心功能' },
  { title: '创建内容', description: '使用AI创作内容' },
  { title: '搭建工作台', description: '定制化AI工作台' },
  { title: '查看成果', description: '查看AI生成的成果' },
  { title: '完成引导', description: '完成新手引导流程' },
];

const OnboardingPanelContent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { message } = App.useApp();
  const [status, setStatus] = useState<OnboardingStatus>({
    currentStep: 0,
    completedSteps: [],
    steps: defaultSteps,
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await getOnboardingStatus();
      setStatus(data);
    } catch (error) {
      console.error('加载引导状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async () => {
    const currentStep = status.currentStep;
    setCompleting(true);
    try {
      await completeOnboardingStep(currentStep);
      const newCompleted = [...status.completedSteps, currentStep];
      const nextStep = Math.min(currentStep + 1, defaultSteps.length - 1);
      setStatus({
        ...status,
        currentStep: nextStep,
        completedSteps: newCompleted,
      });
      message.success('步骤完成，继续加油！');
    } catch (error) {
      console.error('完成步骤失败:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setCompleting(false);
    }
  };

  // 计算进度百分比
  const progress = Math.round((status.completedSteps.length / defaultSteps.length) * 100);

  const stepsItems = defaultSteps.map((step, index) => {
    const isCompleted = status.completedSteps.includes(index);
    const isCurrent = index === status.currentStep && !isCompleted;
    return {
      title: step.title,
      content: step.description,
      status: isCompleted ? 'finish' : isCurrent ? 'process' : 'wait',
    };
  });

  const currentStepInfo = defaultSteps[status.currentStep];

  return (
    <Card
      title={
        <Space>
          <AimOutlined />
          <span>新手引导</span>
        </Space>
      }
      size="small"
      styles={{ body: { padding: '12px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' } }}
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>完成进度</Text>
            <Text strong style={{ fontSize: 12 }}>{progress}%</Text>
          </div>
          <div
            style={{
              height: 6,
              background: '#f0f0f0',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#1677ff',
                borderRadius: 3,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <Steps
          orientation="vertical"
          size="small"
          current={status.currentStep}
          items={stepsItems}
          style={{ marginBottom: 16 }}
        />

        {currentStepInfo && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <Text style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              当前步骤: {currentStepInfo.title} - {currentStepInfo.description}
            </Text>
            <Button
              type="primary"
              onClick={handleCompleteStep}
              loading={completing}
              disabled={status.completedSteps.includes(status.currentStep)}
              block
            >
              {status.completedSteps.includes(status.currentStep) ? '已完成' : '完成此步骤'}
            </Button>
          </div>
        )}
      </Spin>
    </Card>
  );
};

const OnboardingPanel: React.FC = () => (
  <App>
    <OnboardingPanelContent />
  </App>
);

export default OnboardingPanel;
