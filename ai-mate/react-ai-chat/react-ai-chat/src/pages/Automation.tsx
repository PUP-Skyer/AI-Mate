/**
 * 自动化规则页面
 * 参考 Grok Build Hooks + Yan Agent Agent 循环设计
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Switch,
  Tag,
  Drawer,
  Form,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Tooltip,
  Input,
  InputNumber,
  Timeline,
  Badge,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  ApiOutlined,
  SwapOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  FireOutlined,
  RocketOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAutomationStore } from '../store/automationStore';
import { useI18n } from '../i18n';
import { ToolSection, ToolEmptyState, ToolStatCard } from '../components/tools/shared';
import type { AutomationRule, TriggerType, ActionType, AutomationAction, ExecutionLog } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Automation: React.FC = () => {
  const { t, lang } = useI18n();

  // 触发类型配置（标签跟随语言切换）
  const triggerConfig = useMemo<Record<TriggerType, { label: string; icon: React.ReactNode; color: string }>>(
    () => ({
      'message-keyword': { label: t('automation.trigger.keyword'), icon: <MessageOutlined />, color: 'blue' },
      'conversation-start': { label: t('automation.trigger.conversationStart'), icon: <RobotOutlined />, color: 'green' },
      'mcp-result': { label: t('automation.trigger.mcpResult'), icon: <ApiOutlined />, color: 'purple' },
      'schedule': { label: t('automation.trigger.schedule'), icon: <ClockCircleOutlined />, color: 'orange' },
      'hook': { label: t('automation.trigger.hook'), icon: <BranchesOutlined />, color: 'cyan' },
    }),
    [lang]
  );

  // 动作类型配置（标签跟随语言切换）
  const actionConfig = useMemo<Record<ActionType, { label: string; icon: React.ReactNode }>>(
    () => ({
      'send-message': { label: t('automation.action.sendMessage'), icon: <MessageOutlined /> },
      'invoke-skill': { label: t('automation.action.invokeSkill'), icon: <ThunderboltOutlined /> },
      'invoke-mcp': { label: t('automation.action.invokeMcp'), icon: <ApiOutlined /> },
      'switch-role': { label: t('automation.action.switchRole'), icon: <SwapOutlined /> },
      'set-variable': { label: t('automation.action.setVariable'), icon: <SettingOutlined /> },
    }),
    [lang]
  );

  const {
    rules,
    executionLogs,
    showDisabled,
    setShowDisabled,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    executeRule,
    syncFromBackend,
  } = useAutomationStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'logs'>('rules');
  const [form] = Form.useForm();
  // 动作列表（独立 state，支持增删配置）
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [newActionType, setNewActionType] = useState<ActionType>('send-message');
  const [newActionConfig, setNewActionConfig] = useState<string>(() =>
    JSON.stringify({ content: t('automation.actionContentDefault') }, null, 2)
  );

  // 页面加载时从后端同步规则与日志（含定时触发记录）
  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  const handleOpenDrawer = (rule?: AutomationRule) => {
    if (rule) {
      setEditingRule(rule);
      setActions(rule.actions || []);
      form.setFieldsValue({
        name: rule.name,
        description: rule.description,
        isEnabled: rule.isEnabled,
        triggerType: rule.trigger.type,
        triggerConfig: JSON.stringify(rule.trigger.config, null, 2),
        maxIterations: rule.maxIterations,
        runMode: rule.runMode,
      });
    } else {
      setEditingRule(null);
      setActions([]);
      form.resetFields();
      form.setFieldsValue({ isEnabled: true, maxIterations: 1, runMode: 'sequential' });
    }
    setDrawerOpen(true);
  };

  // 添加动作
  const handleAddAction = () => {
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(newActionConfig || '{}');
    } catch {
      message.error(t('automation.actionJsonError'));
      return;
    }
    const action: AutomationAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: newActionType,
      config,
    };
    setActions((prev) => [...prev, action]);
    setNewActionConfig(JSON.stringify({ content: t('automation.actionContentDefault') }, null, 2));
  };

  const handleRemoveAction = (actionId: string) => {
    setActions((prev) => prev.filter((a) => a.id !== actionId));
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const triggerConfig = JSON.parse(values.triggerConfig || '{}');
      const ruleData = {
        name: values.name,
        description: values.description,
        isEnabled: values.isEnabled,
        trigger: { type: values.triggerType as TriggerType, config: triggerConfig },
        actions,
        maxIterations: values.maxIterations,
        runMode: values.runMode as 'sequential' | 'parallel',
      };

      if (editingRule) {
        updateRule(editingRule.id, ruleData);
      } else {
        addRule(ruleData);
      }
      setDrawerOpen(false);
      form.resetFields();
      setActions([]);
    });
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    await executeRule(id);
    setExecutingId(null);
  };

  const visibleRules = showDisabled ? rules : rules.filter((r) => r.isEnabled);

  // 统计数据
  const autoStats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.isEnabled).length;
    const todayLogs = executionLogs.filter((l) => {
      const today = new Date();
      const logDate = new Date(l.executedAt);
      return today.toDateString() === logDate.toDateString();
    });
    const successCount = executionLogs.filter((l) => l.status === 'success').length;
    const failedCount = executionLogs.filter((l) => l.status === 'failed').length;
    const successRate = executionLogs.length > 0 ? Math.round((successCount / executionLogs.length) * 100) : 0;
    return {
      total,
      active,
      todayExec: todayLogs.length,
      successRate,
      successCount,
      failedCount,
      totalExec: executionLogs.length,
    };
  }, [rules, executionLogs]);

  // 规则模板
  const ruleTemplates = useMemo(() => [
    {
      id: 'tpl-auto-greeting',
      name: '对话开场白',
      description: '每次开始新对话时自动发送引导语',
      icon: <MessageOutlined />,
      color: '#1677ff',
      triggerType: 'conversation-start' as TriggerType,
      triggerConfig: { roles: ['scout', 'sage'] },
      actions: [{ type: 'send-message' as ActionType, config: { content: '你好！我是你的 AI 创业助手。', role: 'assistant' } }],
    },
    {
      id: 'tpl-auto-keyword',
      name: '关键词触发 Skill',
      description: '当消息包含关键词时自动调用指定 Skill',
      icon: <ThunderboltOutlined />,
      color: '#00b96b',
      triggerType: 'message-keyword' as TriggerType,
      triggerConfig: { keywords: ['/bp', '商业计划书'], matchScope: 'user' },
      actions: [{ type: 'invoke-skill' as ActionType, config: { skillId: 'bp-refine' } }],
    },
    {
      id: 'tpl-auto-daily',
      name: '定时推送',
      description: '按 Cron 表达式定时执行任务推送',
      icon: <ClockCircleOutlined />,
      color: '#fa8c16',
      triggerType: 'schedule' as TriggerType,
      triggerConfig: { cron: '0 9 * * *', timezone: 'Asia/Shanghai' },
      actions: [{ type: 'send-message' as ActionType, config: { content: '【定时推送】今日任务摘要...', role: 'assistant' } }],
    },
    {
      id: 'tpl-auto-hook',
      name: 'Hook 钩子',
      description: '在特定事件节点自动触发后续动作链',
      icon: <BranchesOutlined />,
      color: '#722ed1',
      triggerType: 'hook' as TriggerType,
      triggerConfig: { event: 'after-message', scope: 'all' },
      actions: [{ type: 'set-variable' as ActionType, config: { key: 'lastActiveAt', value: '{{timestamp}}' } }],
    },
  ], [lang]);

  // 从模板创建规则
  const handleCreateFromTemplate = (tpl: typeof ruleTemplates[0]) => {
    const ruleData = {
      name: tpl.name,
      description: tpl.description,
      isEnabled: true,
      trigger: { type: tpl.triggerType, config: tpl.triggerConfig },
      actions: tpl.actions.map((a) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: a.type,
        config: a.config,
      })),
      maxIterations: 1,
      runMode: 'sequential' as const,
    };
    addRule(ruleData);
    message.success(`已从模板创建规则：${tpl.name}`);
  };

  // 执行趋势（近7天）
  const executionTrend = useMemo(() => {
    const days: { date: string; count: number; success: number; failed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayLogs = executionLogs.filter((l) => new Date(l.executedAt).toDateString() === dayStr);
      days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: dayLogs.length,
        success: dayLogs.filter((l) => l.status === 'success').length,
        failed: dayLogs.filter((l) => l.status === 'failed').length,
      });
    }
    return days;
  }, [executionLogs]);

  // 最近活跃规则
  const recentActiveRules = useMemo(() => {
    const seen = new Set<string>();
    const result: { rule: AutomationRule; lastExec: ExecutionLog | null }[] = [];
    for (const log of executionLogs) {
      if (!seen.has(log.ruleId)) {
        seen.add(log.ruleId);
        const rule = rules.find((r) => r.id === log.ruleId);
        if (rule) {
          result.push({ rule, lastExec: log });
          if (result.length >= 5) break;
        }
      }
    }
    return result;
  }, [rules, executionLogs]);

  // 触发类型分布
  const triggerTypeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    rules.forEach((r) => {
      stats[r.trigger.type] = (stats[r.trigger.type] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({
      type,
      count,
      label: triggerConfig[type as TriggerType]?.label || type,
      color: triggerConfig[type as TriggerType]?.color || 'default',
    }));
  }, [rules, triggerConfig]);

  return (
    <div
      className="tool-dot-bg"
      style={{
        padding: 24,
        height: '100%',
        overflow: 'auto',
        '--tool-accent': '#fa8c16',
        '--tool-accent-glow': 'rgba(250,140,22,0.12)',
      } as React.CSSProperties}
    >
      {/* 顶部操作栏 */}
      <div className="tool-glass-card tool-fade-in-up" style={{ padding: '16px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>{t('automation.title')}</Title>
            <Text type="secondary">{t('automation.subtitle')}</Text>
          </div>
          <Space>
            <span>
              <Text type="secondary" style={{ marginRight: 8 }}>{t('automation.showDisabled')}</Text>
              <Switch size="small" checked={showDisabled} onChange={setShowDisabled} />
            </span>
            <Tooltip title="从后端同步规则与日志">
              <Button className="tool-pill-btn" icon={<SyncOutlined spin={false} />} onClick={() => syncFromBackend()} />
            </Tooltip>
            <Button type="primary" className="tool-pill-btn" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
              {t('automation.newRule')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="tool-glass-card tool-fade-in-up tool-stagger-2" style={{ marginBottom: 16, padding: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={12} sm={6} md={5}>
            <ToolStatCard value={autoStats.total} label="规则总数" icon={<ThunderboltOutlined />} accent="#fa8c16" />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <ToolStatCard value={autoStats.active} label="已启用" icon={<CheckCircleOutlined />} accent="#52c41a" trend="up" />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <ToolStatCard value={autoStats.todayExec} label="今日执行" icon={<FireOutlined />} accent="#1677ff" />
          </Col>
          <Col xs={12} sm={6} md={9}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 成功率环形图 SVG */}
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#f0f0f0" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={autoStats.successRate >= 80 ? '#52c41a' : autoStats.successRate >= 50 ? '#faad14' : '#ff4d4f'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(autoStats.successRate / 100) * 176} 176`}
                    transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 16, fontWeight: 700,
                  color: autoStats.successRate >= 80 ? '#52c41a' : autoStats.successRate >= 50 ? '#faad14' : '#ff4d4f',
                }}>
                  {autoStats.successRate}%
                </div>
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>执行成功率</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  成功 {autoStats.successCount} / 失败 {autoStats.failedCount} / 共 {autoStats.totalExec}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 规则模板快速创建 */}
      <div className="tool-glass-card tool-fade-in-up tool-stagger-3" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <RocketOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
          <Text strong style={{ fontSize: 15 }}>规则模板</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>一键创建常用自动化规则</Text>
        </div>
        <Row gutter={[12, 12]}>
          {ruleTemplates.map((tpl, idx) => (
            <Col xs={24} sm={12} md={6} key={tpl.id}>
              <div
                className={`tool-glass-card tool-card-rise tool-stagger-${idx + 1}`}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: `1px solid ${tpl.color}22`,
                  transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onClick={() => handleCreateFromTemplate(tpl)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${tpl.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: tpl.color, fontSize: 16,
                  }}>
                    {tpl.icon}
                  </div>
                  <Text strong style={{ fontSize: 13 }}>{tpl.name}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, minHeight: 32 }}>
                  {tpl.description}
                </Text>
                <Button
                  className="tool-pill-btn"
                  size="small"
                  type="primary"
                  style={{ background: tpl.color, borderColor: tpl.color }}
                  icon={<PlusOutlined />}
                >
                  使用模板
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* 执行趋势 + 最近活跃 + 触发分布 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={14}>
          <div className="tool-glass-card tool-fade-in-up tool-stagger-4" style={{ padding: 16, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FireOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>近7天执行趋势</Text>
              <Tag className="tool-pill-tag" style={{ marginLeft: 'auto', fontSize: 11 }} color="orange">
                共 {executionTrend.reduce((sum, d) => sum + d.count, 0)} 次
              </Tag>
            </div>
            {/* SVG 柱状图 */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
              {executionTrend.map((day, idx) => {
                const maxCount = Math.max(...executionTrend.map((d) => d.count), 1);
                const barHeight = Math.max((day.count / maxCount) * 80, 2);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{day.count || ''}</Text>
                    <div style={{ width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 80 }}>
                      {day.count > 0 ? (
                        <div className="tool-bar-grow" style={{
                          height: barHeight,
                          borderRadius: '4px 4px 0 0',
                          background: day.failed > 0
                            ? `linear-gradient(to top, #ff4d4f ${(day.failed / day.count) * 100}%, #52c41a ${(day.failed / day.count) * 100}%)`
                            : 'linear-gradient(to top, #52c41a, #95de64)',
                          transition: 'height 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                        }} />
                      ) : (
                        <div style={{ height: 2, borderRadius: 2, background: '#f0f0f0', width: '60%' }} />
                      )}
                    </div>
                    <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{day.date}</Text>
                  </div>
                );
              })}
            </div>
            {/* 图例 */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#52c41a' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>成功</Text>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ff4d4f' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>失败</Text>
              </span>
            </div>
          </div>
        </Col>
        <Col xs={24} md={10}>
          <div className="tool-glass-card tool-fade-in-up tool-stagger-5" style={{ padding: 16, height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>最近活跃</Text>
            </div>
            {recentActiveRules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>暂无执行记录</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentActiveRules.map(({ rule, lastExec }) => (
                  <div
                    key={rule.id}
                    className="tool-fade-in-up"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', borderRadius: 10,
                      background: 'rgba(250,140,22,0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: lastExec?.status === 'success' ? '#52c41a' : lastExec?.status === 'failed' ? '#ff4d4f' : '#1677ff',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rule.name}
                      </Text>
                      {lastExec && (
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {new Date(lastExec.executedAt).toLocaleString()}
                        </Text>
                      )}
                    </div>
                    {lastExec && (
                      <Tag className="tool-pill-tag" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }} color={lastExec.status === 'success' ? 'green' : lastExec.status === 'failed' ? 'red' : 'blue'}>
                        {lastExec.status === 'success' ? '成功' : lastExec.status === 'failed' ? '失败' : '运行中'}
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* 触发类型分布 */}
            {triggerTypeStats.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <Text type="secondary" style={{ fontSize: 11, marginBottom: 6, display: 'block' }}>触发类型分布</Text>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {triggerTypeStats.map((s) => (
                    <Tag key={s.type} className="tool-pill-tag" color={s.color} style={{ fontSize: 10, lineHeight: '18px' }}>
                      {s.label}: {s.count}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 标签页 */}
      <Row gutter={24}>
        <Col span={activeTab === 'rules' ? 24 : 16}>
          <Card
            tabList={[
              { key: 'rules', tab: t('automation.rulesTab', { count: visibleRules.length }) },
              { key: 'logs', tab: t('automation.logsTab', { count: executionLogs.length }) },
            ]}
            activeTabKey={activeTab}
            onTabChange={(key) => setActiveTab(key as 'rules' | 'logs')}
            bodyStyle={{ padding: activeTab === 'rules' ? 0 : 16 }}
          >
            {activeTab === 'rules' ? (
              visibleRules.length === 0 ? (
                <ToolEmptyState
                  icon={<ThunderboltOutlined />}
                  title={t('automation.emptyRules')}
                  subtitle={t('automation.subtitle')}
                  accent="#fa8c16"
                />
              ) : (
                <div>
                  {visibleRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className={`tool-glass-card tool-card-rise tool-stagger-${index + 1}`}
                      style={{
                        padding: '16px 20px',
                        marginBottom: 8,
                        borderRadius: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 15 }}>{rule.name}</Text>
                          <Tag
                            className="tool-pill-tag"
                            color={triggerConfig[rule.trigger.type].color}
                            icon={triggerConfig[rule.trigger.type].icon}
                            style={{ fontSize: 12 }}
                          >
                            {triggerConfig[rule.trigger.type].label}
                          </Tag>
                          {!rule.isEnabled && <Tag color="default" style={{ fontSize: 12 }}>{t('automation.disabled')}</Tag>}
                        </div>
                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                          {rule.description}
                        </Text>
                        <Space size="small">
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('automation.actionCount', { count: rule.actions.length })}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('automation.maxIterations', { count: rule.maxIterations })}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {rule.runMode === 'sequential' ? t('automation.runSequential') : t('automation.runParallel')}
                          </Text>
                        </Space>
                      </div>

                      <Space>
                        <Tooltip title={t('automation.manualExecute')}>
                          <Button
                            className="tool-pill-btn"
                            type="text"
                            icon={<PlayCircleOutlined spin={executingId === rule.id} />}
                            onClick={() => handleExecute(rule.id)}
                            disabled={!rule.isEnabled}
                          />
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <Button className="tool-pill-btn" type="text" icon={<EditOutlined />} onClick={() => handleOpenDrawer(rule)} />
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <Popconfirm title={t('automation.deleteConfirm')} onConfirm={() => deleteRule(rule.id)}>
                            <Button className="tool-pill-btn" type="text" icon={<DeleteOutlined />} danger />
                          </Popconfirm>
                        </Tooltip>
                        <Switch
                          size="small"
                          checked={rule.isEnabled}
                          onChange={() => toggleRule(rule.id)}
                        />
                      </Space>
                    </div>
                  ))}
                </div>
              )
            ) : (
              executionLogs.length === 0 ? (
                <ToolEmptyState
                  icon={<ThunderboltOutlined />}
                  title={t('automation.emptyLogs')}
                  subtitle={t('automation.subtitle')}
                  accent="#fa8c16"
                />
              ) : (
                <Timeline mode="left">
                  {executionLogs.map((log, index) => (
                    <Timeline.Item
                      key={log.id}
                      className={`tool-fade-in-up tool-stagger-${index + 1}`}
                      color={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'blue'}
                      dot={
                        <div
                          className={log.status === 'running' ? 'tool-pulse-dot' : undefined}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background:
                              log.status === 'success'
                                ? '#52c41a'
                                : log.status === 'failed'
                                ? '#ff4d4f'
                                : '#1677ff',
                          }}
                        />
                      }
                      label={new Date(log.executedAt).toLocaleString()}
                    >
                      <div>
                        <Text strong>{log.ruleName}</Text>
                        <Badge
                          status={log.status === 'success' ? 'success' : log.status === 'failed' ? 'error' : 'processing'}
                          text={log.status === 'success' ? t('automation.statusSuccess') : log.status === 'failed' ? t('automation.statusFailed') : t('automation.statusRunning')}
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                      <Text type="secondary" style={{ fontSize: 13 }}>{log.message}</Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )
            )}
          </Card>
        </Col>
      </Row>

      {/* 新建/编辑 Drawer */}
      <Drawer
        title={editingRule ? t('automation.editTitle') : t('automation.newTitle')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button className="tool-pill-btn" onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button className="tool-pill-btn" type="primary" onClick={handleSubmit}>
              {editingRule ? t('common.save') : t('automation.create')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('automation.ruleName')} rules={[{ required: true }]}>
            <Input placeholder={t('automation.ruleNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('skillLib.description')}>
            <TextArea rows={2} placeholder={t('automation.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item name="isEnabled" valuePropName="checked" style={{ marginBottom: 8 }}>
            <Switch checkedChildren={t('automation.enabled')} unCheckedChildren={t('automation.disabledShort')} />
          </Form.Item>

          <ToolSection title={t('automation.triggerSection')} accent="#fa8c16">
            <Form.Item name="triggerType" label={t('automation.triggerType')} rules={[{ required: true }]}>
              <Select placeholder={t('automation.triggerTypePlaceholder')}>
                <Option value="message-keyword">{t('automation.triggerKeyword')}</Option>
                <Option value="conversation-start">{t('automation.triggerConversationStart')}</Option>
                <Option value="mcp-result">{t('automation.triggerMcpResult')}</Option>
                <Option value="schedule">{t('automation.triggerSchedule')}</Option>
                <Option value="hook">{t('automation.triggerHook')}</Option>
              </Select>
            </Form.Item>

            <Form.Item name="triggerConfig" label={t('automation.triggerConfig')}>
              <TextArea
                rows={4}
                placeholder={`{\n  "keywords": ["/bp"],\n  "matchScope": "user"\n}`}
              />
            </Form.Item>
          </ToolSection>

          <ToolSection title={t('automation.actionsSection', { count: actions.length })} accent="#fa8c16">
            {/* 动作列表 */}
            {actions.map((action) => (
              <Card
                key={action.id}
                size="small"
                style={{ marginBottom: 8 }}
                extra={
                  <Button
                    className="tool-pill-btn"
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAction(action.id)}
                  />
                }
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <Tag color="blue">{actionConfig[action.type]?.label || action.type}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {JSON.stringify(action.config).slice(0, 80)}
                    </Text>
                  </Space>
                </Space>
              </Card>
            ))}
            {actions.length === 0 && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {t('automation.noActions')}
              </Text>
            )}

            {/* 添加动作 */}
            <Card size="small" style={{ background: '#fafafa' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Select
                  value={newActionType}
                  onChange={setNewActionType}
                  style={{ width: '100%' }}
                  options={(Object.keys(actionConfig) as ActionType[]).map((type) => ({
                    value: type,
                    label: actionConfig[type].label,
                  }))}
                />
                <TextArea
                  rows={3}
                  value={newActionConfig}
                  onChange={(e) => setNewActionConfig(e.target.value)}
                  placeholder={
                    newActionType === 'send-message'
                      ? t('automation.actionSendMessagePlaceholder')
                      : newActionType === 'invoke-skill'
                      ? t('automation.actionInvokeSkillPlaceholder')
                      : t('automation.actionSetVariablePlaceholder')
                  }
                  style={{ fontSize: 12, fontFamily: 'monospace' }}
                />
                <Button className="tool-pill-btn" type="dashed" icon={<PlusOutlined />} onClick={handleAddAction} block>
                  {t('automation.addAction')}
                </Button>
              </Space>
            </Card>
          </ToolSection>

          <ToolSection title={t('automation.execConfig')} accent="#fa8c16">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="maxIterations" label={t('automation.maxIterationsLabel')}>
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="runMode" label={t('automation.runMode')}>
                  <Select>
                    <Option value="sequential">{t('automation.runSequential')}</Option>
                    <Option value="parallel">{t('automation.runParallel')}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </ToolSection>
        </Form>
      </Drawer>
    </div>
  );
};

export default Automation;
