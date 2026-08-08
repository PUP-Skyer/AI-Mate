/**
 * 知识库页面
 * 参考 EvoFlow Knowledge Vault：
 *   内置创业知识文档（政策/融资/法务/产品/分析/营销），关键词检索
 *   支持接入本地 Obsidian vault：输入路径 → 后端扫描 .md 笔记建立索引
 *   检索合并「内置资料 + 个人笔记」，来源分别标注，结果可引用到对话
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Input,
  Tag,
  List,
  Space,
  Button,
  Select,
  Drawer,
  message,
  Segmented,
  Popconfirm,
  Alert,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  SendOutlined,
  LinkOutlined,
  SyncOutlined,
  DisconnectOutlined,
  FolderOpenOutlined,
  FileMarkdownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { ToolEmptyState, ToolSkeleton } from '../components/tools/shared';
import {
  searchKnowledge,
  fetchKnowledgeDoc,
  fetchVaultStatus,
  connectVault,
  rescanVault,
  disconnectVault,
  type KnowledgeDoc,
  type VaultStatus,
} from '../services/knowledgeService';
import { useI18n } from '../i18n';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_COLORS: Record<string, string> = {
  政策: 'green',
  融资: 'gold',
  法务: 'purple',
  产品: 'blue',
  分析: 'cyan',
  营销: 'magenta',
  Obsidian: 'purple',
};

const KnowledgeVault: React.FC = () => {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [allDocs, setAllDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [topK, setTopK] = useState(3);
  const [detailDoc, setDetailDoc] = useState<KnowledgeDoc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Obsidian vault 接入状态
  const [vault, setVault] = useState<VaultStatus>({
    vaultPath: '',
    lastIndexedAt: 0,
    totalFiles: 0,
    indexedFiles: 0,
    indexErrors: 0,
    docsCount: 0,
  });
  const [vaultPathInput, setVaultPathInput] = useState('');
  const [vaultLoading, setVaultLoading] = useState(false);

  const loadAllDocs = useCallback(async () => {
    const results = await searchKnowledge('');
    setAllDocs(results);
  }, []);

  // 初始加载：全部文档目录 + vault 状态
  useEffect(() => {
    loadAllDocs();
    fetchVaultStatus().then((v) => {
      setVault(v);
      if (v.vaultPath) setVaultPathInput(v.vaultPath);
    });
  }, [loadAllDocs]);

  const handleSearch = useCallback(
    async (q?: string) => {
      const keyword = (q ?? query).trim();
      setLoading(true);
      if (!keyword) {
        setDocs([]);
        setLoading(false);
        return;
      }
      const results = await searchKnowledge(keyword, topK);
      setDocs(results);
      setLoading(false);
    },
    [query, topK]
  );

  const handleOpenDoc = async (docId: string) => {
    const doc = await fetchKnowledgeDoc(docId);
    if (doc) {
      setDetailDoc(doc);
      setDetailOpen(true);
    }
  };

  // 引用到对话：复制检索结果（供聊天中使用）
  const handleUseInChat = () => {
    if (docs.length === 0) return;
    const text = docs
      .map((d, i) => {
        const tag = d.source === 'vault' ? t('kb.personalNote', { path: d.vaultPath || d.title }) : `${d.title}（${d.category}）`;
        return `${t('kb.materialPrefix', { n: i + 1 })}${tag}\n${d.content || d.snippet || ''}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(text);
    message.success(t('kb.copiedToChat'));
  };

  // ============ Obsidian 接入操作 ============

  const handleConnect = async () => {
    const path = vaultPathInput.trim();
    if (!path) {
      message.warning(t('kb.enterPath'));
      return;
    }
    setVaultLoading(true);
    const res = await connectVault(path);
    setVaultLoading(false);
    if (res.ok) {
      message.success(res.message);
      const status = res.data;
      setVault({
        vaultPath: status?.vaultPath || path,
        lastIndexedAt: status?.lastIndexedAt || Date.now(),
        totalFiles: status?.totalFiles || 0,
        indexedFiles: status?.indexedFiles || 0,
        indexErrors: status?.indexErrors || 0,
        docsCount: status?.docsCount || 0,
      });
      loadAllDocs();
    } else {
      message.error(res.message);
    }
  };

  const handleRescan = async () => {
    setVaultLoading(true);
    const res = await rescanVault();
    setVaultLoading(false);
    if (res.ok) {
      message.success(res.message);
      const status = res.data;
      setVault((prev) => ({
        ...prev,
        lastIndexedAt: status?.lastIndexedAt || Date.now(),
        totalFiles: status?.totalFiles || 0,
        indexedFiles: status?.indexedFiles || 0,
        indexErrors: status?.indexErrors || 0,
        docsCount: status?.docsCount || 0,
      }));
      loadAllDocs();
    } else {
      message.error(res.message);
    }
  };

  const handleDisconnect = async () => {
    const ok = await disconnectVault();
    if (ok) {
      message.success(t('kb.disconnected'));
      setVault({ vaultPath: '', lastIndexedAt: 0, totalFiles: 0, indexedFiles: 0, indexErrors: 0, docsCount: 0 });
      loadAllDocs();
    } else {
      message.error(t('kb.disconnectFailed'));
    }
  };

  // 来源标签
  const renderSourceTag = (doc: KnowledgeDoc) => {
    if (doc.source === 'vault') {
      return (
        <Tooltip title={doc.vaultPath || t('kb.obsidianNote')}>
          <Tag icon={<FileMarkdownOutlined />} color="purple" className="tool-pill-tag" style={{ fontSize: 11 }}>
            {t('kb.obsidian')}
          </Tag>
        </Tooltip>
      );
    }
    return (
      <Tag color="blue" className="tool-pill-tag" style={{ fontSize: 11 }}>
        {t('kb.builtin')}
      </Tag>
    );
  };

  return (
    <div
      className="tool-grid-bg"
      style={{
        padding: 24,
        height: '100%',
        overflow: 'auto',
        '--tool-accent': '#722ed1',
        '--tool-accent-glow': 'rgba(114,46,209,0.12)',
      } as React.CSSProperties}
    >
      <div className="tool-glass-card tool-fade-in-up" style={{ padding: '16px 24px', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t('kb.title')}</Title>
        <Text type="secondary">{t('kb.subtitle')}</Text>
      </div>

      {/* ============ Obsidian 接入区块 ============ */}
      <Card
        size="small"
        className="tool-glass-card tool-fade-in-up"
        style={{ marginBottom: 16, borderRadius: 16, borderColor: vault.vaultPath ? '#d3adf7' : undefined }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <FolderOpenOutlined style={{ color: '#722ed1', fontSize: 16 }} />
            <Text strong>{t('kb.obsidianTitle')}</Text>
            {vault.vaultPath && (
              <span
                className="tool-pulse-dot"
                style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }}
              />
            )}
            {vault.vaultPath ? (
              <Tag icon={<CheckCircleOutlined />} color="success" className="tool-pill-tag" style={{ fontSize: 11 }}>
                {t('kb.connected')}
              </Tag>
            ) : (
              <Tag className="tool-pill-tag" style={{ fontSize: 11 }}>{t('kb.notConnected')}</Tag>
            )}
          </Space>
          {vault.vaultPath && (
            <Space>
              <Button size="small" icon={<SyncOutlined />} onClick={handleRescan} loading={vaultLoading}>
                {t('kb.rescan')}
              </Button>
              <Popconfirm title={t('kb.disconnectConfirm')} onConfirm={handleDisconnect}>
                <Button size="small" danger icon={<DisconnectOutlined />}>
                  {t('kb.disconnect')}
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>

        {vault.vaultPath ? (
          <div>
            <Space wrap size={16}>
              <Text style={{ fontSize: 12 }}>
                <LinkOutlined style={{ marginRight: 4 }} />
                <Text code style={{ fontSize: 12 }}>{vault.vaultPath}</Text>
              </Text>
              <Text style={{ fontSize: 12 }}>
                <FileMarkdownOutlined style={{ marginRight: 4, color: '#722ed1' }} />
                {t('kb.indexedCount', { indexed: vault.indexedFiles, total: vault.totalFiles })}
              </Text>
              {vault.indexErrors > 0 && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  {t('kb.indexErrors', { count: vault.indexErrors })}
                </Text>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {t('kb.lastIndexed', {
                  time: new Date(vault.lastIndexedAt).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN'),
                })}
              </Text>
            </Space>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 10, fontSize: 12 }}
              message={t('kb.rescanHint')}
            />
          </div>
        ) : (
          <div>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 10, fontSize: 12 }}
              message={t('kb.pathHint')}
            />
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={vaultPathInput}
                onChange={(e) => setVaultPathInput(e.target.value)}
                placeholder={t('kb.pathPlaceholder')}
                onPressEnter={handleConnect}
              />
              <Button type="primary" icon={<LinkOutlined />} onClick={handleConnect} loading={vaultLoading}>
                {t('kb.connectAndScan')}
              </Button>
            </Space.Compact>
          </div>
        )}
      </Card>

      {/* 搜索区 */}
      <Card size="small" className="tool-glass-card tool-fade-in-up" style={{ marginBottom: 16, borderRadius: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            className="tool-pill-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => handleSearch()}
            placeholder={t('kb.searchPlaceholder')}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
          <Select
            value={topK}
            onChange={(v) => { setTopK(v); if (query.trim()) handleSearch(); }}
            style={{ width: 90 }}
            options={[1, 3, 5, 8].map((n) => ({ value: n, label: `Top ${n}` }))}
          />
          <Button className="tool-pill-btn" type="primary" onClick={() => handleSearch()} loading={loading}>
            {t('kb.search')}
          </Button>
        </Space.Compact>
        <div style={{ marginTop: 8 }}>
          <Segmented
            size="small"
            value="keyword"
            options={[{ label: t('kb.keywordSegmented'), value: 'keyword' }]}
            disabled
          />
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
            {t('kb.totalCount', {
              total: allDocs.length,
              builtin: allDocs.filter((d) => d.source !== 'vault').length,
              obsidian: allDocs.filter((d) => d.source === 'vault').length,
            })}
          </Text>
        </div>
      </Card>

      {/* 检索结果 */}
      {query.trim() ? (
        loading ? (
          <ToolSkeleton type="list" />
        ) : docs.length === 0 ? (
          <ToolEmptyState
            icon={<DatabaseOutlined />}
            title={t('kb.emptyResult')}
            subtitle={lang === 'en' ? 'Try different keywords or reduce the Top K' : '试试更换关键词或降低检索数量'}
            accent="#722ed1"
          />
        ) : (
          <Card size="small" title={t('kb.searchResults', { count: docs.length })} extra={<Button size="small" icon={<SendOutlined />} onClick={handleUseInChat}>{t('kb.useInChat')}</Button>}>
            <List
              dataSource={docs}
              renderItem={(doc, index) => (
                <List.Item
                  key={doc.id}
                  className={`tool-fade-in-up tool-stagger-${index + 1}`}
                  style={{ cursor: 'pointer', borderRadius: 12, marginBottom: 4, padding: '12px 16px' }}
                  onClick={() => handleOpenDoc(doc.id)}
                >
                  <List.Item.Meta
                    avatar={<BookOutlined style={{ fontSize: 20, color: doc.source === 'vault' ? '#722ed1' : '#1677ff' }} />}
                    title={
                      <Space wrap>
                        <Text strong>{doc.title}</Text>
                        {renderSourceTag(doc)}
                        <Tag className="tool-pill-tag" color={CATEGORY_COLORS[doc.category] || 'default'} style={{ fontSize: 11 }}>
                          {doc.category}
                        </Tag>
                        {doc.source === 'vault' && doc.vaultPath && (
                          <Text type="secondary" style={{ fontSize: 11 }}>{doc.vaultPath}</Text>
                        )}
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                        {doc.snippet}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )
      ) : (
        <Card size="small" title={t('kb.allDocs')}>
          <List
            grid={{ gutter: 12, column: 2 }}
            dataSource={allDocs}
            renderItem={(doc, index) => (
              <List.Item>
                <Card
                  size="small"
                  hoverable
                  className={`tool-glass-card tool-card-rise tool-stagger-${index + 1}`}
                  style={{ borderRadius: 12 }}
                  onClick={() => handleOpenDoc(doc.id)}
                >
                  <Space direction="vertical" size={4}>
                    <Space wrap>
                      <BookOutlined style={{ color: doc.source === 'vault' ? '#722ed1' : '#1677ff' }} />
                      <Text strong style={{ fontSize: 13 }}>{doc.title}</Text>
                      {renderSourceTag(doc)}
                    </Space>
                    <Space size={4}>
                      <Tag className="tool-pill-tag" color={CATEGORY_COLORS[doc.category] || 'default'} style={{ fontSize: 10 }}>
                        {doc.category}
                      </Tag>
                      {(doc.tags || []).slice(0, 3).map((t) => (
                        <Tag key={t} className="tool-pill-tag" style={{ fontSize: 10 }}>{t}</Tag>
                      ))}
                      {doc.source === 'vault' && doc.vaultPath && (
                        <Text type="secondary" style={{ fontSize: 10 }}>{doc.vaultPath}</Text>
                      )}
                    </Space>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 文档详情 */}
      <Drawer
        title={
          <Space>
            <span>{detailDoc?.title}</span>
            {detailDoc && renderSourceTag(detailDoc)}
          </Space>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={480}
      >
        {detailDoc && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag className="tool-pill-tag" color={CATEGORY_COLORS[detailDoc.category] || 'default'}>{detailDoc.category}</Tag>
              {(detailDoc.tags || []).map((t) => (
                <Tag key={t} className="tool-pill-tag" style={{ fontSize: 11 }}>{t}</Tag>
              ))}
              {detailDoc.source === 'vault' && detailDoc.vaultPath && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <FileMarkdownOutlined style={{ marginRight: 4 }} />
                  {detailDoc.vaultPath}
                </Text>
              )}
            </Space>
            <Paragraph
              className="tool-grid-bg"
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                background: 'rgba(114, 46, 209, 0.02)',
                border: '1px solid rgba(114, 46, 209, 0.08)',
                padding: 16,
                borderRadius: 12,
              }}
            >
              {detailDoc.content}
            </Paragraph>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default KnowledgeVault;
