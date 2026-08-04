/**
 * MCP 服务器配置页面（拓展版）
 * 功能：服务器管理 + 市场模板 + 搜索筛选 + 工具测试 + JSON 导入导出
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Badge,
  Drawer,
  Form,
  Select,
  Space,
  Typography,
  Empty,
  Row,
  Col,
  Tooltip,
  Tag,
  message,
  Segmented,
  Popconfirm,
  Statistic,
  Dropdown,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  CloudOutlined,
  DesktopOutlined,
  ExportOutlined,
  ImportOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  ShopOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useMCPStore } from '../store/mcpStore';
import type { MCPCategory } from '../store/mcpStore';
import { MCP_CATEGORY_LABELS, MCP_CATEGORY_COLORS } from '../store/mcpStore';
import { useI18n } from '../i18n';
import type { MCPServer, MCPTransport } from '../types';
import MCPTemplates from '../components/MCPTemplates';
import ToolTestPanel from '../components/ToolTestPanel';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TRANSPORT_ICONS: Record<MCPTransport, React.ReactNode> = {
  stdio: <DesktopOutlined />,
  sse: <CloudOutlined />,
};

type ViewMode = 'servers' | 'marketplace';

const MCPConfig: React.FC = () => {
  const { t, lang } = useI18n();

  // 服务器状态配置（文案跟随语言切换）
  const statusConfig = useMemo<Record<string, { color: string; text: string }>>(
    () => ({
      connected: { color: 'success', text: t('mcp.status.connected') },
      disconnected: { color: 'default', text: t('mcp.status.disconnected') },
      error: { color: 'error', text: t('mcp.status.error') },
      connecting: { color: 'processing', text: t('mcp.status.connecting') },
    }),
    [lang]
  );

  const {
    servers,
    addServer,
    updateServer,
    removeServer,
    duplicateServer,
    testConnection,
    importFromJson,
    exportToJson,
    exportAllToJson,
  } = useMCPStore();

  const [viewMode, setViewMode] = useState<ViewMode>('servers');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [form] = Form.useForm();

  // 工具测试面板
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const [testServer, setTestServer] = useState<MCPServer | null>(null);

  // 统计
  const stats = useMemo(() => {
    const connected = servers.filter((s) => s.status === 'connected').length;
    const totalTools = servers.reduce((sum, s) => sum + s.tools.length, 0);
    return { total: servers.length, connected, totalTools };
  }, [servers]);

  // 过滤后的服务器列表
  const filteredServers = useMemo(() => {
    return servers.filter((s) => {
      const matchSearch =
        !searchText ||
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.tools.some((t) => t.name.toLowerCase().includes(searchText.toLowerCase()));
      return matchSearch;
    });
  }, [servers, searchText]);

  const handleOpenDrawer = (server?: MCPServer) => {
    if (server) {
      setEditingServer(server);
      form.setFieldsValue({
        name: server.name,
        transport: server.transport,
        command: server.command,
        args: server.args?.join(' ') || '',
        url: server.url,
        env: server.env
          ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`).join('\n')
          : '',
      });
    } else {
      setEditingServer(null);
      form.resetFields();
      form.setFieldsValue({ transport: 'stdio' });
    }
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const envMap: Record<string, string> = {};
      if (values.env) {
        values.env.split('\n').forEach((line: string) => {
          const [k, ...v] = line.split('=');
          if (k && v.length > 0) envMap[k.trim()] = v.join('=').trim();
        });
      }

      const serverData = {
        name: values.name,
        transport: values.transport as MCPTransport,
        command: values.transport === 'stdio' ? values.command : undefined,
        args:
          values.transport === 'stdio' && values.args
            ? values.args.split(' ').filter(Boolean)
            : undefined,
        url: values.transport === 'sse' ? values.url : undefined,
        env: Object.keys(envMap).length > 0 ? envMap : undefined,
        tools: editingServer?.tools || [],
        configJson: JSON.stringify(
          {
            name: values.name,
            transport: values.transport,
            ...(values.transport === 'stdio'
              ? {
                  command: values.command,
                  args: values.args ? values.args.split(' ').filter(Boolean) : undefined,
                }
              : { url: values.url }),
            ...(Object.keys(envMap).length > 0 ? { env: envMap } : {}),
          },
          null,
          2
        ),
      };

      if (editingServer) {
        updateServer(editingServer.id, serverData);
        message.success(t('mcp.updated'));
      } else {
        addServer(serverData);
        message.success(t('mcp.serverAdded'));
      }
      setDrawerOpen(false);
      form.resetFields();
    });
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const success = await testConnection(id);
      message[success ? 'success' : 'error'](success ? t('mcp.connectionSuccess') : t('mcp.connectionFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleImport = () => {
    try {
      importFromJson(jsonText);
      message.success(t('mcp.importSuccess'));
      setJsonImportOpen(false);
      setJsonText('');
    } catch (err) {
      message.error(t('mcp.importFailed'));
    }
  };

  const handleExportAll = () => {
    const json = exportAllToJson();
    navigator.clipboard.writeText(json);
    message.success(t('mcp.exportAllCopied'));
  };

  const handleOpenToolTest = (server: MCPServer | null) => {
    setTestServer(server);
    setTestPanelOpen(true);
  };

  // ============ 市场视图 ============
  if (viewMode === 'marketplace') {
    return (
      <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setViewMode('servers')}
          >
            {t('mcp.back')}
          </Button>
          <div>
            <Title level={4} style={{ margin: 0 }}>{t('mcp.marketplace')}</Title>
            <Text type="secondary">{t('mcp.marketplaceSubtitle')}</Text>
          </div>
        </div>
        <MCPTemplates onBack={() => setViewMode('servers')} />
      </div>
    );
  }

  // ============ 服务器管理视图 ============
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      {/* 顶部：标题 + 主操作 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('mcp.title')}</Title>
          <Text type="secondary">{t('mcp.subtitle')}</Text>
        </div>
        <Space wrap>
          <Button icon={<ShopOutlined />} onClick={() => setViewMode('marketplace')}>
            {t('mcp.marketplace')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
            {t('mcp.addServer')}
          </Button>
        </Space>
      </div>

      {/* 概览：统计 + 搜索 + 工具入口 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={5}>
            <Statistic title={t('mcp.serverTotal')} value={stats.total} prefix={<ApiOutlined />} />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Statistic
              title={t('mcp.connected')}
              value={stats.connected}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Statistic title={t('mcp.availableTools')} value={stats.totalTools} prefix={<ThunderboltOutlined />} />
          </Col>
          <Col xs={24} md={9}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t('mcp.searchServersPlaceholder')}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button icon={<ToolOutlined />} onClick={() => handleOpenToolTest(null)} block>
                {t('mcp.builtinToolTest')}
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 服务器列表 */}
      {filteredServers.length === 0 ? (
        <Empty
          description={searchText ? t('mcp.emptySearch') : t('mcp.emptyConfig')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '48px 0' }}
        >
          {!searchText && (
            <Space wrap>
              <Button type="primary" onClick={() => handleOpenDrawer()}>
                {t('mcp.manualAdd')}
              </Button>
              <Button onClick={() => setViewMode('marketplace')}>
                {t('mcp.addFromMarketplace')}
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setJsonImportOpen(true)}>
                {t('mcp.importJson')}
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExportAll}>
                {t('mcp.exportAll')}
              </Button>
            </Space>
          )}
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {filteredServers.map((server) => (
              <Col xs={24} sm={12} lg={8} key={server.id}>
              <Card
                size="small"
                styles={{ body: { padding: 16 } }}
                actions={[
                  <Tooltip title={t('mcp.testConnection')} key="test">
                    <ThunderboltOutlined
                      spin={testingId === server.id}
                      onClick={() => handleTest(server.id)}
                    />
                  </Tooltip>,
                  <Tooltip title={t('common.edit')} key="edit">
                    <EditOutlined onClick={() => handleOpenDrawer(server)} />
                  </Tooltip>,
                  <Tooltip title={t('mcp.toolTest')} key="tool-test">
                    <ExperimentOutlined
                      onClick={() => handleOpenToolTest(server)}
                      style={{ color: server.status === 'connected' ? undefined : '#d9d9d9' }}
                    />
                  </Tooltip>,
                  <Dropdown
                    key="more"
                    menu={{
                      items: [
                        {
                          key: 'duplicate',
                          icon: <CopyOutlined />,
                          label: t('mcp.duplicateConfig'),
                          onClick: () => {
                            duplicateServer(server.id);
                            message.success(t('mcp.copied'));
                          },
                        },
                        {
                          key: 'export',
                          icon: <ExportOutlined />,
                          label: t('mcp.exportJson'),
                          onClick: () => {
                            const json = exportToJson(server.id);
                            navigator.clipboard.writeText(json);
                            message.success(t('mcp.copiedToClipboard'));
                          },
                        },
                        { type: 'divider' },
                        {
                          key: 'delete',
                          icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                          label: t('common.delete'),
                          danger: true,
                          onClick: () => {
                            removeServer(server.id);
                            message.success(t('mcp.deleted'));
                          },
                        },
                      ],
                    }}
                  >
                    <MoreOutlined />
                  </Dropdown>,
                ]}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background:
                          server.status === 'connected'
                            ? '#f6ffed'
                            : server.status === 'error'
                            ? '#fff2f0'
                            : '#f0f5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color:
                          server.status === 'connected'
                            ? '#52c41a'
                            : server.status === 'error'
                            ? '#ff4d4f'
                            : '#1677ff',
                      }}
                    >
                      <ApiOutlined />
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 15, display: 'block' }}>
                        {server.name}
                      </Text>
                      <Space size="small">
                        <Tag style={{ fontSize: 12 }}>
                          {TRANSPORT_ICONS[server.transport]} {server.transport.toUpperCase()}
                        </Tag>
                        <Badge {...statusConfig[server.status]} />
                      </Space>
                    </div>
                  </div>
                </div>

                <Text
                  type="secondary"
                  style={{ fontSize: 13, display: 'block', marginBottom: 8 }}
                  ellipsis={{ tooltip: server.transport === 'stdio' ? `${server.command} ${server.args?.join(' ') || ''}` : server.url }}
                >
                  {server.transport === 'stdio'
                    ? t('mcp.command', { value: `${server.command} ${server.args?.join(' ') || ''}` })
                    : t('mcp.endpoint', { value: server.url || '' })}
                </Text>

                <Space size="small" wrap>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('mcp.toolsFound', { count: server.tools.length })}
                  </Text>
                  {server.tools.slice(0, 3).map((tool) => (
                    <Tag key={tool.name} style={{ fontSize: 11 }}>
                      {tool.name}
                    </Tag>
                  ))}
                  {server.tools.length > 3 && (
                    <Tag style={{ fontSize: 11 }}>+{server.tools.length - 3}</Tag>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
          </Row>
          {/* 列表底部批量操作 */}
          <Divider style={{ margin: '16px 0 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              paddingTop: 12,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('mcp.serverCount', { count: filteredServers.length })}
            </Text>
            <Space>
              <Button size="small" icon={<ImportOutlined />} onClick={() => setJsonImportOpen(true)}>
                {t('mcp.importJson')}
              </Button>
              <Button size="small" icon={<ExportOutlined />} onClick={handleExportAll}>
                {t('mcp.exportAll')}
              </Button>
            </Space>
          </div>
        </>
      )}

      {/* 添加/编辑 Drawer */}
      <Drawer
        title={editingServer ? t('mcp.editTitle') : t('mcp.addTitle')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingServer ? t('common.save') : t('common.add')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('mcp.serverName')} rules={[{ required: true }]}>
            <Input placeholder={t('mcp.serverNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="transport" label={t('mcp.transport')} rules={[{ required: true }]}>
            <Select placeholder={t('mcp.transportPlaceholder')}>
              <Option value="stdio">{t('mcp.transportStdio')}</Option>
              <Option value="sse">{t('mcp.transportSse')}</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.transport !== curr.transport}>
            {({ getFieldValue }) =>
              getFieldValue('transport') === 'stdio' ? (
                <>
                  <Form.Item name="command" label={t('mcp.commandLabel')} rules={[{ required: true }]}>
                    <Input placeholder={t('mcp.commandPlaceholder')} />
                  </Form.Item>
                  <Form.Item name="args" label={t('mcp.args')}>
                    <Input placeholder={t('mcp.argsPlaceholder')} />
                  </Form.Item>
                </>
              ) : (
                <Form.Item name="url" label={t('mcp.url')} rules={[{ required: true }]}>
                  <Input placeholder={t('mcp.urlPlaceholder')} />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item name="env" label={t('mcp.env')}>
            <TextArea
              rows={4}
              placeholder={t('mcp.envPlaceholder')}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* JSON 导入 Drawer */}
      <Drawer
        title={t('mcp.importJsonTitle')}
        open={jsonImportOpen}
        onClose={() => setJsonImportOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setJsonImportOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleImport}>
              {t('common.import')}
            </Button>
          </Space>
        }
      >
        <TextArea
          rows={16}
          placeholder={t('mcp.jsonPlaceholder')}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
      </Drawer>

      {/* 工具测试面板 */}
      <ToolTestPanel
        open={testPanelOpen}
        server={testServer}
        onClose={() => {
          setTestPanelOpen(false);
          setTestServer(null);
        }}
      />
    </div>
  );
};

export default MCPConfig;
