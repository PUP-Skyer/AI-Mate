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
  Empty,
  Row,
  Col,
  Tooltip,
  Input,
  InputNumber,
  Divider,
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
} from '@ant-design/icons';
import { useAutomationStore } from '../store/automationStore';
import { useI18n } from '../i18n';
import type { AutomationRule, TriggerType, ActionType, AutomationAction } from '../types';

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

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('automation.title')}</Title>
          <Text type="secondary">{t('automation.subtitle')}</Text>
        </div>
        <Space>
          <span>
            <Text type="secondary" style={{ marginRight: 8 }}>{t('automation.showDisabled')}</Text>
            <Switch size="small" checked={showDisabled} onChange={setShowDisabled} />
          </span>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
            {t('automation.newRule')}
          </Button>
        </Space>
      </div>

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
                <Empty description={t('automation.emptyRules')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} />
              ) : (
                <div>
                  {visibleRules.map((rule) => (
                    <div
                      key={rule.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 15 }}>{rule.name}</Text>
                          <Tag
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
                            type="text"
                            icon={<PlayCircleOutlined spin={executingId === rule.id} />}
                            onClick={() => handleExecute(rule.id)}
                            disabled={!rule.isEnabled}
                          />
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenDrawer(rule)} />
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <Popconfirm title={t('automation.deleteConfirm')} onConfirm={() => deleteRule(rule.id)}>
                            <Button type="text" icon={<DeleteOutlined />} danger />
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
                <Empty description={t('automation.emptyLogs')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Timeline mode="left">
                  {executionLogs.map((log) => (
                    <Timeline.Item
                      key={log.id}
                      color={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'blue'}
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
            <Button onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleSubmit}>
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

          <Divider style={{ margin: '16px 0' }} />

          <Title level={5}>{t('automation.triggerSection')}</Title>
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

          <Divider style={{ margin: '16px 0' }} />

          <Title level={5}>{t('automation.actionsSection', { count: actions.length })}</Title>

          {/* 动作列表 */}
          {actions.map((action) => (
            <Card
              key={action.id}
              size="small"
              style={{ marginBottom: 8 }}
              extra={
                <Button
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
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddAction} block>
                {t('automation.addAction')}
              </Button>
            </Space>
          </Card>

          <Divider style={{ margin: '16px 0' }} />

          <Title level={5}>{t('automation.execConfig')}</Title>
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
        </Form>
      </Drawer>
    </div>
  );
};

export default Automation;
