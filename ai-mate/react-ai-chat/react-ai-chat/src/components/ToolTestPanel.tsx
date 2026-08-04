/**
 * MCP 工具测试面板
 * 可视化测试已连接 MCP 服务器的工具调用
 */

import React, { useState } from 'react';
import {
  Drawer,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Card,
  Tag,
  Divider,
  Alert,
  Spin,
  Empty,
  Timeline,
} from 'antd';
import {
  PlayCircleOutlined,
  SendOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useMCPStore } from '../store/mcpStore';
import { useI18n } from '../i18n';
import { executeToolCall, getToolLabel, TOOL_NAMES } from '../services/toolExecutor';
import type { MCPServer, MCPTool } from '../types';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ToolTestPanelProps {
  open: boolean;
  server: MCPServer | null;
  onClose: () => void;
}

interface TestLog {
  id: string;
  toolName: string;
  input: string;
  output: string;
  status: 'success' | 'error' | 'running';
  timestamp: number;
  duration?: number;
}

const ToolTestPanel: React.FC<ToolTestPanelProps> = ({ open, server, onClose }) => {
  const { t } = useI18n();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [inputJson, setInputJson] = useState('{}');
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [running, setRunning] = useState(false);

  /** 内置工具（真实执行）在测试面板中的展示项 */
  const builtinToolItems: MCPTool[] = TOOL_NAMES.map((name) => ({
    name,
    description: t('toolTest.builtinDesc', { label: getToolLabel(name) }),
    inputSchema: {},
  }));

  const handleRunTest = async () => {
    if (!selectedTool) return;

    const logId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const startTime = Date.now();

    // 添加运行中日志
    const runningLog: TestLog = {
      id: logId,
      toolName: selectedTool,
      input: inputJson,
      output: '',
      status: 'running',
      timestamp: startTime,
    };
    setTestLogs((prev) => [runningLog, ...prev]);
    setRunning(true);

    try {
      // 验证 JSON 输入
      const parsedInput = JSON.parse(inputJson);

      // 内置工具：走真实执行链路
      if (TOOL_NAMES.includes(selectedTool)) {
        const result = await executeToolCall(
          `test-${Date.now()}`,
          selectedTool,
          inputJson
        );
        const duration = Date.now() - startTime;
        setTestLogs((prev) =>
          prev.map((log) =>
            log.id === logId
              ? {
                  ...log,
                  status: result.error ? 'error' : 'success',
                  output: result.error
                    ? result.content
                    : JSON.stringify(
                        {
                          success: true,
                          tool: selectedTool,
                          input: parsedInput,
                          result: result.content,
                          timestamp: new Date().toISOString(),
                        },
                        null,
                        2
                      ),
                  duration,
                }
              : log
          )
        );
        return;
      }

      // 非内置工具：保持模拟（待 MCP 客户端接入后替换）
      await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

      const duration = Date.now() - startTime;

      // 模拟返回结果
      const mockResult = {
        success: true,
        tool: selectedTool,
        input: parsedInput,
        result: `[模拟结果] 工具 "${selectedTool}" 调用成功`,
        timestamp: new Date().toISOString(),
      };

      setTestLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? { ...log, status: 'success', output: JSON.stringify(mockResult, null, 2), duration }
            : log
        )
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      setTestLogs((prev) =>
        prev.map((log) =>
          log.id === logId
            ? {
                ...log,
                status: 'error',
                output: `${t('toolTest.errorPrefix')}${err instanceof Error ? err.message : t('toolTest.unknownError')}`,
                duration,
              }
            : log
        )
      );
    } finally {
      setRunning(false);
    }
  };

  const handleClearLogs = () => {
    setTestLogs([]);
  };

  // 内置工具 + 服务器工具合并（内置工具真实执行）
  const tools: MCPTool[] = server
    ? [...builtinToolItems, ...(server.tools || [])]
    : builtinToolItems;
  const selectedToolObj = tools.find((t) => t.name === selectedTool);

  return (
    <Drawer
      title={
        <Space>
          <PlayCircleOutlined />
          <span>{t('toolTest.title')}{server ? ` - ${server.name}` : t('toolTest.builtin')}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
    >
      <div>
        {/* 连接状态 */}
        <div style={{ marginBottom: 16 }}>
          {server && (
            <Tag
              color={
                server.status === 'connected'
                  ? 'success'
                  : server.status === 'error'
                  ? 'error'
                  : 'default'
              }
            >
              {server.status === 'connected'
                ? t('toolTest.connected')
                : server.status === 'error'
                ? t('toolTest.connectError')
                : server.status === 'connecting'
                ? t('toolTest.connecting')
                : t('toolTest.disconnected')}
            </Tag>
          )}
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            {t('toolTest.availableTools', { count: tools.length })}
          </Text>
        </div>

          {/* 工具选择 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              {t('toolTest.selectTool')}
            </Text>
            <Select
              placeholder={t('toolTest.selectToolPlaceholder')}
              style={{ width: '100%' }}
              value={selectedTool}
              onChange={setSelectedTool}
              options={tools.map((tool) => ({
                label: (
                  <Space>
                    <Text>{tool.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {tool.description}
                    </Text>
                  </Space>
                ),
                value: tool.name,
              }))}
            />
          </div>

          {/* 输入参数 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              {t('toolTest.inputParams')}
            </Text>
            <TextArea
              rows={5}
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder='{"key": "value"}'
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
            {selectedToolObj?.inputSchema
              ? Object.keys(selectedToolObj.inputSchema as object).length > 0 && (
              <Alert
                type="info"
                showIcon
                style={{ marginTop: 8, fontSize: 12 }}
                message={
                  <span>
                    Schema: <code>{JSON.stringify(selectedToolObj.inputSchema)}</code>
                  </span>
                }
              />
              )
            : null}
          </div>

          {/* 执行按钮 */}
          <Space style={{ marginBottom: 20 }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleRunTest}
              loading={running}
              disabled={!selectedTool}
            >
              {t('toolTest.runTest')}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClearLogs}>
              {t('toolTest.clearLogs')}
            </Button>
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          {/* 测试日志 */}
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              {t('toolTest.logs', { count: testLogs.length })}
            </Text>

            {testLogs.length === 0 ? (
              <Empty description={t('toolTest.emptyLogs')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={testLogs.map((log) => ({
                  color:
                    log.status === 'success'
                      ? 'green'
                      : log.status === 'error'
                      ? 'red'
                      : 'blue',
                  dot:
                    log.status === 'running' ? (
                      <Spin size="small" />
                    ) : log.status === 'success' ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    ),
                  children: (
                    <Card size="small" style={{ marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Space>
                          <Tag
                            color={
                              log.status === 'success'
                                ? 'success'
                                : log.status === 'error'
                                ? 'error'
                                : 'processing'
                            }
                            style={{ fontSize: 11 }}
                          >
                            {log.toolName}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </Text>
                        </Space>
                        {log.duration && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined /> {log.duration}ms
                          </Text>
                        )}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {t('toolTest.inputLabel')}
                        </Text>
                        <Paragraph
                          code
                          style={{ fontSize: 11, marginBottom: 0, maxHeight: 60, overflow: 'auto' }}
                        >
                          {log.input}
                        </Paragraph>
                      </div>
                      {log.output && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('toolTest.outputLabel')}
                          </Text>
                          <pre
                            style={{
                              fontSize: 11,
                              background: log.status === 'error' ? '#fff2f0' : '#f6ffed',
                              padding: 8,
                              borderRadius: 4,
                              maxHeight: 120,
                              overflow: 'auto',
                              margin: '4px 0 0',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                            }}
                          >
                            {log.output}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ),
                }))}
              />
            )}
          </div>
        </div>
    </Drawer>
  );
};
export default ToolTestPanel;
