/**
 * 计划工作流组件
 * 参考 EvoFlow Supervisor 工作流面板：
 *  - 展示计划 DAG（步骤、角色、依赖、状态）
 *  - 用户授权后按依赖推进执行（最多 2 个并行）
 *  - 步骤结果实时展示
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Typography,
  Tag,
  Steps,
  Button,
  Space,
  Spin,
  Alert,
  Divider,
  Collapse,
  Tooltip,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { usePlanStore, type Plan, type PlanStep } from '../../store/planStore';
import { useAIStore, type AIRole } from '../../store/aiStore';
import { executePlanStep, ROLE_NAMES } from '../../services/planService';
import type { ModelCallConfig } from '../../services/aiService';

const { Text, Title, Paragraph } = Typography;

const ROLE_COLORS: Record<AIRole, string> = {
  scout: 'blue',
  sage: 'gold',
  maker: 'green',
  butler: 'magenta',
};

const STEP_STATUS: Record<PlanStep['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待执行', color: 'default', icon: <ClockCircleOutlined /> },
  ready: { label: '可执行', color: 'blue', icon: <PlayCircleOutlined /> },
  running: { label: '执行中', color: 'processing', icon: <SyncOutlined spin /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  failed: { label: '失败', color: 'error', icon: <CloseCircleOutlined /> },
};

interface PlanWorkflowProps {
  open: boolean;
  onClose: () => void;
}

const PlanWorkflow: React.FC<PlanWorkflowProps> = ({ open, onClose }) => {
  const {
    plans,
    activePlanId,
    approvePlan,
    cancelPlan,
    setStepStatus,
    getRunnableSteps,
    isPlanComplete,
  } = usePlanStore();
  const modelConfigs = useAIStore((s) => s.modelConfigs);
  const activeModelId = useAIStore((s) => s.activeModelId);

  const [running, setRunning] = useState(false);
  const [executingStepId, setExecutingStepId] = useState<string | null>(null);
  const runningRef = useRef(false);

  const plan = plans.find((p) => p.id === activePlanId) || null;

  // 按依赖拓扑排序后的步骤（用于展示）
  const orderedSteps = useMemo(() => {
    if (!plan) return [];
    const sorted: PlanStep[] = [];
    const visited = new Set<string>();
    const visit = (s: PlanStep) => {
      if (visited.has(s.id)) return;
      visited.add(s.id);
      for (const dep of s.dependsOn) {
        const d = plan.steps.find((x) => x.id === dep);
        if (d) visit(d);
      }
      sorted.push(s);
    };
    plan.steps.forEach(visit);
    return sorted;
  }, [plan]);

  // 获取活跃模型配置
  const getModelConfig = useCallback((): ModelCallConfig | undefined => {
    const active = modelConfigs.find((m) => m.id === activeModelId && m.isEnabled);
    if (!active) return undefined;
    return {
      modelId: active.modelId || active.name,
      baseUrl: active.baseUrl || 'https://ark.cn-beijing.volces.com/api/plan/v3',
      apiKey: active.apiKey,
      multimodal: active.multimodal,
    };
  }, [modelConfigs, activeModelId]);

  // 执行计划主循环
  const runPlan = useCallback(async () => {
    if (!plan || runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    try {
      // 并发执行可运行步骤，最多 2 个
      while (true) {
        const runnable = getRunnableSteps(plan.id);
        const toRun = runnable.filter((s) => s.status === 'ready').slice(0, 2);
        if (toRun.length === 0) break;

        // 并发执行
        await Promise.all(
          toRun.map(async (step) => {
            setStepStatus(plan.id, step.id, 'running');
            setExecutingStepId(step.id);
            try {
              const result = await executePlanStep(step, plan.goal, {
                modelConfig: getModelConfig(),
                token: localStorage.getItem('ai_mate_token') || undefined,
              });
              setStepStatus(plan.id, step.id, 'completed', { result });
            } catch (err) {
              setStepStatus(plan.id, step.id, 'failed', {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          })
        );
        setExecutingStepId(null);
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [plan, getModelConfig, getRunnableSteps, setStepStatus]);

  // 计划状态变化：approved 后自动开始执行
  useEffect(() => {
    if (plan?.status === 'approved' && !runningRef.current && !isPlanComplete(plan.id)) {
      runPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.status]);

  const handleApprove = () => {
    if (!plan) return;
    approvePlan(plan.id);
  };

  const handleCancel = () => {
    if (!plan) return;
    cancelPlan(plan.id);
    setRunning(false);
    runningRef.current = false;
  };

  if (!plan) return null;

  const isExecutable = plan.status === 'draft' || plan.status === 'approved' || plan.status === 'running';
  const complete = isPlanComplete(plan.id);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      footer={null}
      title={
        <Space>
          <PlayCircleOutlined style={{ color: '#1677ff' }} />
          <span>任务计划 - {ROLE_NAMES[usePlanStore.getState().activeRole]}</span>
        </Space>
      }
    >
      {/* 计划状态横幅 */}
      <Alert
        type={plan.status === 'failed' ? 'error' : complete ? 'success' : 'info'}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          <Space>
            <Text strong>{plan.goal}</Text>
            <Tag color={plan.status === 'running' ? 'processing' : plan.status === 'completed' ? 'success' : 'default'}>
              {plan.status === 'draft'
                ? '待授权'
                : plan.status === 'approved'
                ? '已授权'
                : plan.status === 'running'
                ? '执行中'
                : plan.status === 'completed'
                ? '已完成'
                : plan.status === 'failed'
                ? '执行失败'
                : '已取消'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {plan.steps.filter((s) => s.status === 'completed').length}/{plan.steps.length} 步骤完成
            </Text>
          </Space>
        }
      />

      {/* 操作按钮 */}
      {isExecutable && !complete && (
        <Space style={{ marginBottom: 16 }}>
          {plan.status === 'draft' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleApprove}>
              授权开始执行
            </Button>
          )}
          {(plan.status === 'approved' || plan.status === 'running') && (
            <Button icon={<StopOutlined />} onClick={handleCancel} disabled={running && !executingStepId}>
              暂停
            </Button>
          )}
        </Space>
      )}

      {/* 步骤执行进度 */}
      <Divider style={{ margin: '8px 0 16px' }}>执行进度</Divider>

      {/* 依赖说明 */}
      {orderedSteps.some((s) => s.dependsOn.length > 0) && (
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          依赖关系：{orderedSteps.map((s) => (s.dependsOn.length > 0 ? `步骤${s.id} ← ${s.dependsOn.join('、')}` : null)).filter(Boolean).join('；')}
        </Paragraph>
      )}

      <Steps
        direction="vertical"
        size="small"
        current={orderedSteps.findIndex((s) => s.status === 'running') === -1 ? 0 : orderedSteps.findIndex((s) => s.status === 'running')}
        status={plan.status === 'failed' ? 'error' : complete ? 'finish' : 'process'}
        items={orderedSteps.map((step) => {
          const st = STEP_STATUS[step.status];
          return {
            title: (
              <Space size={6}>
                <Text strong style={{ fontSize: 13 }}>{step.title}</Text>
                <Tag color={ROLE_COLORS[step.assignedRole]} style={{ fontSize: 11, marginInlineEnd: 0 }}>
                  {ROLE_NAMES[step.assignedRole]}
                </Tag>
                <Tag color={st.color} style={{ fontSize: 11, marginInlineEnd: 0 }}>
                  {st.label}
                </Tag>
              </Space>
            ),
            description: (
              <div>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: step.result || step.error ? 8 : 0 }}>
                  {step.description}
                </Paragraph>
                {step.acceptance && (
                  <Paragraph type="secondary" style={{ fontSize: 11, marginBottom: 4 }}>
                    验收：{step.acceptance}
                  </Paragraph>
                )}
                {step.status === 'running' && (
                  <Space size={6}>
                    <Spin size="small" />
                    <Text type="secondary" style={{ fontSize: 12 }}>正在执行…</Text>
                  </Space>
                )}
                {(step.result || step.error) && (
                  <Collapse
                    size="small"
                    style={{ marginTop: 4, fontSize: 12 }}
                    items={[
                      {
                        key: 'result',
                        label: step.error ? '失败原因' : '执行结果',
                        children: (
                          <Paragraph
                            style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}
                          >
                            {step.error || step.result}
                          </Paragraph>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            ),
          };
        })}
      />

      {/* 结束提示 */}
      {complete && (
        <Alert
          type="success"
          showIcon
          style={{ marginTop: 16 }}
          message="计划已全部完成，各步骤结果已归档到任务记录。"
        />
      )}
      {plan.status === 'failed' && (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 16 }}
          message="存在失败步骤，请检查失败原因后重新发起计划。"
        />
      )}
    </Modal>
  );
};

export default PlanWorkflow;
