/**
 * 工匠AI - 原型Demo展示面板（案五 · 翡翠绿）
 * 分区式结构：作品概览 / 作品库 / 预览工坊
 * 动画：卡片交错入场 / 分区交错
 * 增强：Demo视频上传/导出，数据持久化
 */

 import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Space,
  Button,
  Typography,
  Spin,
  Empty,
  Row,
  Col,
  Tabs,
  Badge,
  QRCode,
  Tooltip,
  Upload,
  message,
} from 'antd';
import {
  GithubOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  CodeOutlined,
  LeftOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { MAKER_THEMES, MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
import './maker-animations.css';
import { MakerSection } from './shared';
 import { loadDemos, saveDemos, type DemoProjectData, type PlatformType } from './demo-storage';

const { Text } = Typography;

 type DemoProject = DemoProjectData;

const PLATFORM_CONFIG: Record<PlatformType, { label: string; color: string; icon: React.ReactNode }> = {
  web: { label: 'Web网站', color: 'blue', icon: <GlobalOutlined /> },
  app: { label: '移动APP', color: 'purple', icon: <MobileOutlined /> },
  miniapp: { label: '小程序', color: 'green', icon: <TabletOutlined /> },
  desktop: { label: '桌面端', color: 'orange', icon: <DesktopOutlined /> },
  other: { label: '其他', color: 'default', icon: <CodeOutlined /> },
};

const STAGE_COLORS: Record<string, string> = {
  '种子轮': 'blue',
  '天使轮': 'cyan',
  'A轮': 'geekblue',
  'B轮': 'purple',
  'C轮': 'magenta',
  'Pre-IPO': 'red',
};

const MOCK_DEMOS: DemoProject[] = [
  {
    id: 1,
    title: '智能学习助手',
    description: '基于大语言模型的个性化学习辅导工具，支持知识点解析、错题分析和学习计划制定。',
    stage: '天使轮',
    team_type: 'OTC',
    team_members: '张三（产品经理）、李四（技术负责人）、王五（设计师）',
    platform: 'web',
    preview_url: 'https://example.com/demo1',
    github_url: 'https://github.com/example/smart-learning',
    gitee_url: 'https://gitee.com/example/smart-learning',
    douyin_url: 'https://douyin.com/example',
    bilibili_url: 'https://bilibili.com/example',
  },
  {
    id: 2,
    title: '校园跑腿小程序',
    description: '面向大学生的即时配送服务平台，涵盖快递代取、外卖代买、资料打印等场景。',
    stage: '种子轮',
    team_type: 'OPC',
    platform: 'miniapp',
    preview_url: '',
    github_url: 'https://github.com/example/campus-errand',
  },
  {
    id: 3,
    title: 'AI 面试助手 APP',
    description: '模拟真实面试场景，AI面试官实时提问并给出改进建议，覆盖互联网、金融、咨询等热门行业。',
    stage: 'A轮',
    team_type: 'OTC',
    team_members: '赵六（创始人）、钱七（全栈开发）、孙八（运营）',
    platform: 'app',
    demo_video_url: '',
    github_url: 'https://github.com/example/ai-interview',
    xiaohongshu_url: 'https://xiaohongshu.com/example',
  },
  {
    id: 4,
    title: '实验室数据管理桌面端',
    description: '为高校科研实验室设计的实验数据记录、分析与可视化工具，支持多人协作与版本管理。',
    stage: '种子轮',
    team_type: 'OPC',
    platform: 'desktop',
    github_url: 'https://github.com/example/lab-data',
    gitee_url: 'https://gitee.com/example/lab-data',
  },
];

const PrototypeDemoPanel: React.FC = () => {
  const [demos, setDemos] = useState<DemoProject[]>(() => {
     const stored = loadDemos();
     return stored && stored.demos.length > 0 ? stored.demos : [];
  });
  const [loading, setLoading] = useState(() => {
     const stored = loadDemos();
     return !(stored && stored.demos.length > 0);
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'video'>('preview');

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const mTheme: MakerTheme = MAKER_THEMES.demo;
  const textColor = isDark ? mTheme.textDark : mTheme.textLight;
  const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;

  useEffect(() => {
     if (loading) {
       // 首次使用：加载 Mock 作为初始数据并持久化
       setTimeout(() => {
         setDemos(MOCK_DEMOS);
         saveDemos({ demos: MOCK_DEMOS, updatedAt: Date.now() });
         setLoading(false);
       }, 500);
     }
  }, [loading]);
 
   // demos 变化时持久化
   useEffect(() => {
     if (!loading) {
       saveDemos({ demos, updatedAt: Date.now() });
     }
   }, [demos, loading]);
 
   // 视频上传处理
   const handleVideoUpload = (demoId: number, file: File) => {
     if (file.size > 15 * 1024 * 1024) {
       message.warning('视频超过 15MB，可能导致存储失败');
     }
     const reader = new FileReader();
     reader.onload = () => {
       const base64 = reader.result as string;
       setDemos((prev) =>
         prev.map((d) =>
           d.id === demoId ? { ...d, demo_video_data: base64 } : d
         )
       );
       message.success('视频上传成功');
     };
     reader.onerror = () => message.error('视频读取失败');
     reader.readAsDataURL(file);
   };
 
   // 视频导出处理
   const handleVideoExport = (demo: DemoProject) => {
     const src = demo.demo_video_data || demo.demo_video_url;
     if (!src) return;
     if (src.startsWith('data:')) {
       const a = document.createElement('a');
       a.href = src;
       a.download = `${demo.title}-demo.mp4`;
       a.click();
     } else {
       fetch(src)
         .then((r) => r.blob())
         .then((blob) => {
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `${demo.title}-demo.mp4`;
           a.click();
           URL.revokeObjectURL(url);
         })
         .catch(() => message.error('视频导出失败'));
     }
   };
 
  if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  if (demos.length === 0) {
    return <Empty description="暂无 Demo 作品" style={{ marginTop: 40 }} />;
  }

  // 平台分布统计
  const platformCount: Record<string, number> = {};
  demos.forEach((d) => {
    platformCount[d.platform] = (platformCount[d.platform] || 0) + 1;
  });

  // 作品列表视图
  if (!selectedId) {
    return (
      <div
        className="maker-grid-bg maker-paper-noise"
        style={{
          padding: 16,
          background: isDark ? mTheme.bgDark : mTheme.bgLight,
          borderRadius: 12,
          minHeight: '100%',
          '--maker-grid-line': isDark ? mTheme.glowColor : 'rgba(90,90,80,0.05)',
        } as React.CSSProperties}
      >
        {/* 面板头部：案号徽章 + 标题 */}
        <div
          className="maker-fade-in-up"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 12,
            background: isDark ? mTheme.gradient : mTheme.gradientLight,
            marginBottom: 16,
            border: `1px solid ${borderColor}`,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: mTheme.sealColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MAKER_FONT_SERIF,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              boxShadow: `0 0 12px ${mTheme.glowColor}`,
              flexShrink: 0,
            }}
          >
            {mTheme.caseNo}
          </div>
          <div>
            <div
              style={{
                fontFamily: MAKER_FONT_SERIF,
                fontSize: 18,
                fontWeight: 700,
                color: isDark ? mTheme.textDark : mTheme.textLight,
                letterSpacing: 2,
              }}
            >
              {mTheme.title}
            </div>
            <div
              style={{
                fontFamily: MAKER_FONT_SERIF,
                fontSize: 11,
                color: mTheme.accentColor,
                letterSpacing: 3,
                opacity: 0.85,
              }}
            >
              PROTOTYPE SHOWCASE
            </div>
          </div>
        </div>

        {/* 分区1：作品概览 */}
        <MakerSection title="作品概览" subtitle="OVERVIEW" theme={mTheme} isDark={isDark} stagger={1}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                background: isDark ? mTheme.surfaceDark : '#fff',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF }}>
                {demos.length}
              </div>
              <div style={{ fontSize: 11, color: textColor, opacity: 0.55, fontFamily: MAKER_FONT_SERIF }}>
                作品总数
              </div>
            </div>
            {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => {
              const count = platformCount[key] || 0;
              return (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    minWidth: 110,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    background: isDark ? mTheme.surfaceDark : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: mTheme.accentColor }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: textColor, fontFamily: MAKER_FONT_SERIF }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 10.5, color: textColor, opacity: 0.55, fontFamily: MAKER_FONT_SERIF }}>
                      {cfg.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </MakerSection>

        {/* 分区2：作品库 */}
        <div style={{ marginTop: 16 }}>
          <MakerSection title="作品库" subtitle="SHOWCASE" theme={mTheme} isDark={isDark} stagger={2}>
            <Row gutter={[14, 14]}>
              {demos.map((demo, i) => {
                const platform = PLATFORM_CONFIG[demo.platform];
                return (
                  <Col xs={24} sm={12} lg={12} key={demo.id}>
                    <div
                      className={`maker-fade-in-up maker-stagger-${Math.min(i + 1, 9)}`}
                      onClick={() => setSelectedId(demo.id)}
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${borderColor}`,
                        borderTop: `3px solid ${mTheme.accentColor}`,
                        background: isDark ? mTheme.surfaceDark : '#fff',
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        gap: 12,
                      }}
                    >
                      {/* 封面占位 */}
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                          background: `${mTheme.accentColor}12`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: 24,
                          color: mTheme.accentColor,
                        }}
                      >
                        {platform.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Text strong style={{ fontSize: 15, color: textColor, fontFamily: MAKER_FONT_SERIF }} ellipsis>
                            {demo.title}
                          </Text>
                          <Tag color={platform.color} style={{ fontSize: 11 }}>
                            {platform.label}
                          </Tag>
                        </div>
                        <Text
                          style={{
                            fontSize: 12,
                            color: textColor,
                            opacity: 0.65,
                            display: 'block',
                            marginBottom: 6,
                            fontFamily: MAKER_FONT_SERIF,
                          }}
                          ellipsis
                        >
                          {demo.description}
                        </Text>
                        <Space size={8}>
                          <Tag color={STAGE_COLORS[demo.stage] || 'default'} style={{ fontSize: 11 }}>
                            {demo.stage}
                          </Tag>
                          <Tag color={demo.team_type === 'OPC' ? 'green' : 'orange'} style={{ fontSize: 11 }}>
                            {demo.team_type === 'OPC' ? '个人 OPC' : '多人 OTC'}
                          </Tag>
                          {demo.preview_url && (
                            <Badge dot color="green">
                              <Text style={{ fontSize: 11, color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF }}>
                                可预览
                              </Text>
                            </Badge>
                          )}
                        </Space>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </MakerSection>
        </div>
      </div>
    );
  }

  // 详情视图
  const detail = demos.find((d) => d.id === selectedId)!;
  const platform = PLATFORM_CONFIG[detail.platform];

  return (
    <div>
      {/* 返回栏 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<LeftOutlined />} size="small" onClick={() => setSelectedId(null)}>
          返回列表
        </Button>
        <Text strong style={{ margin: 0, fontSize: 17, color: textColor, fontFamily: MAKER_FONT_SERIF }}>
          {detail.title}
        </Text>
        <Tag color={platform.color} icon={platform.icon}>
          {platform.label}
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：预览区 */}
        <Col xs={24} lg={14}>
          <Card
            bodyStyle={{ padding: 0 }}
            title={
              <Tabs
                activeKey={previewTab}
                onChange={(k) => setPreviewTab(k as typeof previewTab)}
                size="small"
                items={[
                  {
                    key: 'preview',
                    label: (
                      <span>
                        <EyeOutlined /> 在线预览
                      </span>
                    ),
                  },
                  {
                    key: 'video',
                    label: (
                      <span>
                        <VideoCameraOutlined /> 功能演示
                      </span>
                    ),
                  },
                ]}
              />
            }
          >
            {previewTab === 'preview' && (
              <div style={{ height: 420, background: '#f5f5f5', position: 'relative' }}>
                {detail.platform === 'web' && detail.preview_url ? (
                  <iframe
                    src={detail.preview_url}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '0 0 6px 6px' }}
                    title={detail.title}
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : detail.platform === 'miniapp' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 16,
                    }}
                  >
                    <Text type="secondary">扫码体验小程序</Text>
                    <QRCode value={detail.preview_url || 'https://example.com'} size={180} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      使用微信扫一扫
                    </Text>
                  </div>
                ) : detail.platform === 'app' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 16,
                    }}
                  >
                    <MobileOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    <Text type="secondary">APP 请下载安装包预览</Text>
                    {detail.preview_url && (
                      <QRCode value={detail.preview_url} size={160} />
                    )}
                  </div>
                ) : detail.platform === 'desktop' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 16,
                    }}
                  >
                    <DesktopOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />
                    <Text type="secondary">桌面端应用请下载后安装体验</Text>
                    <Button type="primary">下载安装包</Button>
                  </div>
                ) : (
                  <Empty description="暂无预览链接" style={{ paddingTop: 120 }} />
                )}
              </div>
            )}
            {previewTab === 'video' && (
               <div style={{ height: 420, background: '#000', position: 'relative' }}>
                 {detail.demo_video_data || detail.demo_video_url ? (
                   <>
                     <video
                       src={detail.demo_video_data || detail.demo_video_url}
                       controls
                       style={{ maxWidth: '100%', maxHeight: '100%' }}
                     />
                     {/* 导出视频按钮 */}
                     <Button
                       icon={<DownloadOutlined />}
                       size="small"
                       style={{ position: 'absolute', top: 8, right: 8 }}
                       onClick={() => handleVideoExport(detail)}
                     >
                       导出视频
                     </Button>
                   </>
                 ) : (
                   <Space direction="vertical" align="center" style={{ paddingTop: 120 }}>
                     <VideoCameraOutlined style={{ fontSize: 48, color: '#666' }} />
                     <Text style={{ color: '#999' }}>暂无功能演示视频</Text>
                     <Upload
                       accept="video/*"
                       showUploadList={false}
                       beforeUpload={(file) => {
                         handleVideoUpload(detail.id, file);
                         return false;
                       }}
                     >
                       <Button type="primary" icon={<UploadOutlined />}>
                         上传 Demo 视频
                       </Button>
                     </Upload>
                     <Text type="secondary" style={{ fontSize: 11, color: '#666' }}>
                       支持 MP4/WebM，建议小于 15MB
                     </Text>
                   </Space>
                 )}
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：项目信息 */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {/* 基本信息 */}
            <Card size="small" title="项目信息">
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color={STAGE_COLORS[detail.stage] || 'default'}>{detail.stage}</Tag>
                <Tag color={detail.team_type === 'OPC' ? 'green' : 'orange'}>
                  {detail.team_type === 'OPC' ? '个人 OPC' : '多人 OTC'}
                </Tag>
              </Space>
              <Text style={{ display: 'block', lineHeight: 1.8 }}>{detail.description}</Text>
              {detail.team_type === 'OTC' && detail.team_members && (
                <div style={{ background: '#f6ffed', padding: 10, borderRadius: 6, marginTop: 10 }}>
                  <Text strong style={{ fontSize: 12 }}>团队成员：</Text>
                  <Text style={{ fontSize: 12 }}>{detail.team_members}</Text>
                </div>
              )}
            </Card>

            {/* 外部链接 */}
            <Card size="small" title="相关链接">
              <Row gutter={[8, 8]}>
                {detail.github_url && (
                  <Col>
                    <Tooltip title="GitHub">
                      <Button icon={<GithubOutlined />} href={detail.github_url} target="_blank" size="small">
                        GitHub
                      </Button>
                    </Tooltip>
                  </Col>
                )}
                {detail.gitee_url && (
                  <Col>
                    <Button icon={<GlobalOutlined />} href={detail.gitee_url} target="_blank" size="small">
                      Gitee
                    </Button>
                  </Col>
                )}
                {detail.douyin_url && (
                  <Col>
                    <Button href={detail.douyin_url} target="_blank" size="small">
                      抖音
                    </Button>
                  </Col>
                )}
                {detail.bilibili_url && (
                  <Col>
                    <Button href={detail.bilibili_url} target="_blank" size="small">
                      哔哩哔哩
                    </Button>
                  </Col>
                )}
                {detail.x_url && (
                  <Col>
                    <Button href={detail.x_url} target="_blank" size="small">
                      X
                    </Button>
                  </Col>
                )}
                {detail.xiaohongshu_url && (
                  <Col>
                    <Button href={detail.xiaohongshu_url} target="_blank" size="small">
                      小红书
                    </Button>
                  </Col>
                )}
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default PrototypeDemoPanel;
