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
  Row,
  Col,
  Tooltip,
  Tag,
  message,
  Popconfirm,
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
  HeartOutlined,
  DashboardOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMCPStore } from '../store/mcpStore';
import type { MCPCategory } from '../store/mcpStore';
import { MCP_CATEGORY_LABELS, MCP_CATEGORY_COLORS } from '../store/mcpStore';
import { useI18n } from '../i18n';
import type { MCPServer, MCPTransport } from '../types';
import MCPTemplates from '../components/MCPTemplates';
import ToolTestPanel from '../components/ToolTestPanel';
import { ToolStatCard, ToolEmptyState, ToolSection } from '../components/tools/shared';

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
      const matchCategory = filterCategory === 'all' || s.transport === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [servers, searchText, filterCategory]);

  // 健康监控数据（模拟）
  const healthData = useMemo(() => {
    return servers.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      latency: s.status === 'connected' ? Math.floor(20 + Math.random() * 80) : 0,
      uptime: s.status === 'connected' ? Math.floor(95 + Math.random() * 5) : 0,
      lastConnect: s.status === 'connected' ? `${Math.floor(1 + Math.random() * 59)} 分钟前` : '未连接',
    }));
  }, [servers]);

  // 连接日志（模拟）
  const connectionLogs = useMemo(() => {
    const logs: { id: string; serverName: string; action: string; status: 'success' | 'failed' | 'info'; time: string; latency?: number }[] = [];
    servers.forEach((s, idx) => {
      if (s.status === 'connected') {
        logs.push({
          id: `log-${s.id}-1`,
          serverName: s.name,
          action: '连接成功',
          status: 'success',
          time: `${idx + 1} 分钟前`,
          latency: Math.floor(20 + Math.random() * 80),
        });
      }
      if (s.tools.length > 0) {
        logs.push({
          id: `log-${s.id}-2`,
          serverName: s.name,
          action: `发现 ${s.tools.length} 个工具`,
          status: 'info',
          time: `${idx + 2} 分钟前`,
        });
      }
    });
    if (servers.some((s) => s.status === 'error')) {
      logs.push({
        id: 'log-err-1',
        serverName: servers.find((s) => s.status === 'error')?.name || '未知',
        action: '连接超时',
        status: 'failed',
        time: '5 分钟前',
      });
    }
    return logs.slice(0, 8);
  }, [servers]);

  // 工具分类统计
  const toolCategoryStats = useMemo(() => {
    const categories: Record<string, number> = {};
    servers.forEach((s) => {
      s.tools.forEach(() => {
        const cat = s.transport === 'stdio' ? '本地工具' : '远程工具';
        categories[cat] = (categories[cat] || 0) + 1;
      });
    });
    return Object.entries(categories).map(([name, count]) => ({ name, count }));
  }, [servers]);

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
      <div
        className="tool-grid-bg"
        style={{
          padding: 24,
          height: '100%',
          overflow: 'auto',
          '--tool-accent': '#08979c',
          '--tool-accent-glow': 'rgba(8,151,156,0.12)',
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Button
            className="tool-pill-btn"
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
    <div
      className="tool-grid-bg"
      style={{
        padding: 24,
        height: '100%',
        overflow: 'auto',
        '--tool-accent': '#08979c',
        '--tool-accent-glow': 'rgba(8,151,156,0.12)',
      } as React.CSSProperties}
    >
      {/* 顶部：标题 + 主操作 */}
      <div className="tool-glass-card tool-fade-in-up" style={{ padding: '16px 24px', marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>{t('mcp.title')}</Title>
            <Text type="secondary">{t('mcp.subtitle')}</Text>
          </div>
          <Space wrap>
            <Button className="tool-pill-btn" icon={<ShopOutlined />} onClick={() => setViewMode('marketplace')}>
              {t('mcp.marketplace')}
            </Button>
            <Button className="tool-pill-btn" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
              {t('mcp.addServer')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 概览：统计 + 搜索 + 工具入口 */}
      <div className="tool-glass-card tool-fade-in-up" style={{ marginBottom: 16, padding: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={5}>
            <ToolStatCard value={stats.total} label={t('mcp.serverTotal')} icon={<ApiOutlined />} accent="#08979c" />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <ToolStatCard value={stats.connected} label={t('mcp.connected')} icon={<CheckCircleOutlined />} accent="#52c41a" trend="up" />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <ToolStatCard value={stats.totalTools} label={t('mcp.availableTools')} icon={<ThunderboltOutlined />} accent="#08979c" />
          </Col>
          <Col xs={24} md={9}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Input
                className="tool-pill-input"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t('mcp.searchServersPlaceholder')}
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button className="tool-pill-btn" icon={<ToolOutlined />} onClick={() => handleOpenToolTest(null)} block>
                {t('mcp.builtinToolTest')}
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* 分类筛选 */}
      <div className="tool-fade-in-up tool-stagger-2" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          className="tool-pill-btn"
          size="small"
          type={filterCategory === 'all' ? 'primary' : 'default'}
          onClick={() => setFilterCategory('all')}
        >
          {t('mcp.categoryAll') || '全部'}
        </Button>
        {(Object.keys(MCP_CATEGORY_LABELS) as MCPCategory[]).map((cat) => (
          <Button
            key={cat}
            className="tool-pill-btn"
            size="small"
            type={filterCategory === cat ? 'primary' : 'default'}
            onClick={() => setFilterCategory(cat)}
          >
            {MCP_CATEGORY_LABELS[cat]}
          </Button>
        ))}
      </div>

      {/* 服务器列表 */}
      {filteredServers.length === 0 ? (
        <div style={{ padding: '48px 0' }}>
          <ToolEmptyState
            icon={<ApiOutlined />}
            title={searchText ? t('mcp.emptySearch') : t('mcp.emptyConfig')}
            subtitle={searchText ? t('mcp.emptySearch') : t('mcp.emptyConfig')}
            accent="#08979c"
          />
          {!searchText && (
            <Space wrap style={{ justifyContent: 'center', display: 'flex', marginTop: 16 }}>
              <Button className="tool-pill-btn" type="primary" onClick={() => handleOpenDrawer()}>
                {t('mcp.manualAdd')}
              </Button>
              <Button className="tool-pill-btn" onClick={() => setViewMode('marketplace')}>
                {t('mcp.addFromMarketplace')}
              </Button>
              <Button className="tool-pill-btn" icon={<ImportOutlined />} onClick={() => setJsonImportOpen(true)}>
                {t('mcp.importJson')}
              </Button>
              <Button className="tool-pill-btn" icon={<ExportOutlined />} onClick={handleExportAll}>
                {t('mcp.exportAll')}
              </Button>
            </Space>
          )}
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {filteredServers.map((server, index) => (
              <Col xs={24} sm={12} lg={8} key={server.id}>
              <Card
                size="small"
                className={`tool-glass-card tool-card-rise tool-stagger-${Math.min(index + 1, 9)}`}
                styles={{ body: { padding: 16 } }}
                style={{ borderRadius: 16 }}
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
                      className={server.status === 'connecting' ? 'tool-pulse-dot' : undefined}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background:
                          server.status === 'connected'
                            ? 'linear-gradient(135deg, #52c41a, #95de64)'
                            : server.status === 'error'
                            ? 'linear-gradient(135deg, #ff4d4f, #ff7875)'
                            : 'linear-gradient(135deg, #08979c, #5cdbd3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
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
              <Button className="tool-pill-btn" size="small" icon={<ImportOutlined />} onClick={() => setJsonImportOpen(true)}>
                {t('mcp.importJson')}
              </Button>
              <Button className="tool-pill-btn" size="small" icon={<ExportOutlined />} onClick={handleExportAll}>
                {t('mcp.exportAll')}
              </Button>
            </Space>
          </div>
        </>
      )}

      {/* 健康监控面板 */}
      {servers.length > 0 && (
        <div className="tool-glass-card tool-fade-in-up" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <HeartOutlined style={{ color: '#08979c', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>服务器健康监控</Text>
            <Tag className="tool-pill-tag" color="processing" style={{ marginLeft: 'auto' }}>
              <DashboardOutlined /> 实时
            </Tag>
          </div>
          <Row gutter={[12, 12]}>
            {healthData.map((h, idx) => (
              <Col xs={24} sm={12} md={8} key={h.id}>
                <div
                  className={`tool-fade-in-up tool-stagger-${Math.min(idx + 1, 9)}`}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: h.status === 'connected' ? 'rgba(82,196,26,0.04)' : h.status === 'error' ? 'rgba(255,77,79,0.04)' : 'rgba(140,140,140,0.04)',
                    border: `1px solid ${h.status === 'connected' ? 'rgba(82,196,26,0.15)' : h.status === 'error' ? 'rgba(255,77,79,0.15)' : 'rgba(140,140,140,0.12)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 13 }}>{h.name}</Text>
                    <Badge {...statusConfig[h.status]} />
                  </div>
                  {/* 延迟条 */}
                  {h.status === 'connected' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>延迟</Text>
                        <Text style={{ fontSize: 11, color: h.latency < 50 ? '#52c41a' : h.latency < 100 ? '#faad14' : '#ff4d4f' }}>
                          {h.latency}ms
                        </Text>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: '#f0f0f0', marginBottom: 8, overflow: 'hidden' }}>
                        <div
                          className="tool-bar-grow"
                          style={{
                            height: '100%',
                            width: `${Math.min(h.latency, 100)}%`,
                            background: h.latency < 50 ? '#52c41a' : h.latency < 100 ? '#faad14' : '#ff4d4f',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      {/* 可用率 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <ClockCircleOutlined /> {h.lastConnect}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: 600, color: '#52c41a' }}>
                          {h.uptime}% 可用
                        </Text>
                      </div>
                    </>
                  )}
                  {h.status !== 'connected' && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <ClockCircleOutlined /> {h.lastConnect}
                    </Text>
                  )}
                </div>
              </Col>
            ))}
          </Row>
          {/* 工具分类统计 */}
          {toolCategoryStats.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>工具分布</Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {toolCategoryStats.map((stat) => (
                  <Tag key={stat.name} className="tool-pill-tag" color="cyan" style={{ fontSize: 12 }}>
                    {stat.name}: {stat.count}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 连接日志 */}
      {connectionLogs.length > 0 && (
        <div className="tool-glass-card tool-fade-in-up" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClockCircleOutlined style={{ color: '#08979c', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>最近连接日志</Text>
            <Button
              className="tool-pill-btn"
              size="small"
              type="text"
              icon={<ReloadOutlined />}
              style={{ marginLeft: 'auto' }}
              onClick={() => { /* 刷新由 store 触发 */ }}
            >
              刷新
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {connectionLogs.map((log, idx) => (
              <div
                key={log.id}
                className={`tool-fade-in-up tool-stagger-${Math.min(idx + 1, 9)}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: log.status === 'success' ? 'rgba(82,196,26,0.03)' : log.status === 'failed' ? 'rgba(255,77,79,0.03)' : 'rgba(22,119,255,0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 状态圆点 */}
                <div
                  className={log.status === 'success' ? 'tool-pulse-dot' : undefined}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: log.status === 'success' ? '#52c41a' : log.status === 'failed' ? '#ff4d4f' : '#1677ff',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>{log.serverName}</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{log.action}</Text>
                  {log.latency && (
                    <Tag className="tool-pill-tag" style={{ fontSize: 10, marginLeft: 8, lineHeight: '16px' }} color={log.latency < 50 ? 'green' : 'orange'}>
                      {log.latency}ms
                    </Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>{log.time}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCP 协议概览 */}
      {servers.length > 0 && (
        <div className="tool-glass-card tool-fade-in-up" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ApiOutlined style={{ color: '#08979c', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>MCP 协议概览</Text>
            <Tag className="tool-pill-tag" color="cyan" style={{ marginLeft: 'auto', fontSize: 11 }}>
              Model Context Protocol
            </Tag>
          </div>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(8,151,156,0.04)', border: '1px solid rgba(8,151,156,0.1)' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>协议版本</Text>
                <Text strong style={{ fontSize: 18, color: '#08979c' }}>2024-11-05</Text>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(8,151,156,0.04)', border: '1px solid rgba(8,151,156,0.1)' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>支持传输</Text>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Tag className="tool-pill-tag" color="cyan" style={{ fontSize: 11 }}>stdio</Tag>
                  <Tag className="tool-pill-tag" color="blue" style={{ fontSize: 11 }}>SSE</Tag>
                </div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(8,151,156,0.04)', border: '1px solid rgba(8,151,156,0.1)' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>总工具数</Text>
                <Text strong style={{ fontSize: 18, color: '#08979c' }}>{stats.totalTools}</Text>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ padding: 12, borderRadius: 10, background: 'rgba(8,151,156,0.04)', border: '1px solid rgba(8,151,156,0.1)' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>已连接 / 总数</Text>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>{stats.connected}<Text type="secondary" style={{ fontSize: 14 }}> / {stats.total}</Text></Text>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* 工具清单 */}
      {stats.totalTools > 0 && (
        <div className="tool-glass-card tool-fade-in-up" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ToolOutlined style={{ color: '#08979c', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>工具清单</Text>
            <Tag className="tool-pill-tag" color="processing" style={{ marginLeft: 'auto', fontSize: 12 }}>
              共 {stats.totalTools} 个
            </Tag>
          </div>
          <Row gutter={[8, 8]}>
            {servers.filter((s) => s.tools.length > 0).flatMap((s) =>
              s.tools.map((tool, tIdx) => (
                <Col xs={24} sm={12} md={8} lg={6} key={`${s.id}-${tool.name}`}>
                  <Tooltip title={tool.description || '无描述'} placement="top">
                    <div
                      className={`tool-fade-in-up tool-stagger-${Math.min(tIdx + 1, 9)}`}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: 'rgba(8,151,156,0.03)',
                        border: '1px solid rgba(8,151,156,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.2s ease',
                        cursor: 'default',
                      }}
                    >
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: s.status === 'connected' ? '#52c41a' : '#d9d9d9',
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 12, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tool.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {s.name}
                        </Text>
                      </div>
                      <Tag className="tool-pill-tag" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }} color={s.transport === 'stdio' ? 'cyan' : 'blue'}>
                        {s.transport === 'stdio' ? <DesktopOutlined /> : <CloudOutlined />}
                      </Tag>
                    </div>
                  </Tooltip>
                </Col>
              ))
            )}
          </Row>
        </div>
      )}

      {/* 快速操作 */}
      {servers.length > 0 && (
        <div className="tool-glass-card tool-fade-in-up" style={{ marginTop: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ThunderboltOutlined style={{ color: '#08979c', fontSize: 16 }} />
            <Text strong style={{ fontSize: 15 }}>快速操作</Text>
          </div>
          <Space wrap>
            <Button
              className="tool-pill-btn"
              icon={<ThunderboltOutlined spin={testingId === 'batch'} />}
              loading={testingId === 'batch'}
              onClick={async () => {
                setTestingId('batch');
                const disconnected = servers.filter((srv) => srv.status !== 'connected');
                for (const s of disconnected) {
                  await testConnection(s.id);
                }
                setTestingId(null);
                message.success(`批量测试完成，共测试 ${disconnected.length} 个服务器`);
              }}
            >
              批量测试连接
            </Button>
            <Button className="tool-pill-btn" icon={<ExportOutlined />} onClick={handleExportAll}>
              导出全部配置
            </Button>
            <Button className="tool-pill-btn" icon={<ImportOutlined />} onClick={() => setJsonImportOpen(true)}>
              导入配置
            </Button>
            <Button className="tool-pill-btn" icon={<ToolOutlined />} onClick={() => handleOpenToolTest(null)}>
              工具测试
            </Button>
            <Button className="tool-pill-btn" icon={<ShopOutlined />} onClick={() => setViewMode('marketplace')}>
              浏览市场
            </Button>
          </Space>
        </div>
      )}

      {/* 添加/编辑 Drawer */}
      <Drawer
        title={editingServer ? t('mcp.editTitle') : t('mcp.addTitle')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button className="tool-pill-btn" onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button className="tool-pill-btn" type="primary" onClick={handleSubmit}>
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
            <Button className="tool-pill-btn" onClick={() => setJsonImportOpen(false)}>{t('common.cancel')}</Button>
            <Button className="tool-pill-btn" type="primary" onClick={handleImport}>
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
