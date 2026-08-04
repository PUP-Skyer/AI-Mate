/**
 * 工匠AI - 项目脚手架面板（案一 · 钢蓝）
 * 分区式结构：工程设定 / 目录结构 / 智能体指引 / 检查清单
 * 动画：分区交错入场 / 铆钉 CTA
 */

import React, { useState } from 'react';
import {
  Select,
  Button,
  Tree,
  Typography,
  Space,
  Tag,
  Checkbox,
  List,
  message,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  FileTextOutlined,
  RobotOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { useAIStore } from '../../store/aiStore';
import { MAKER_THEMES, MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
import './maker-animations.css';
import { MakerSection } from './shared';

const { Text } = Typography;
const { Option } = Select;

type ProjectType = 'python-web' | 'data-science' | 'monorepo' | 'fullstack' | 'custom';

interface ScaffoldConfig {
  label: string;
  color: string;
  tree: DataNode[];
  claudeMd: string;
  agentsMd: string;
  checklist: string[];
}

const SCAFFOLD_MAP: Record<ProjectType, ScaffoldConfig> = {
  'python-web': {
    label: 'Python Web',
    color: 'blue',
    tree: [
      {
        title: 'my-project',
        key: 'root',
        icon: <FolderOutlined />,
        children: [
          { title: 'app/', key: 'app', icon: <FolderOutlined />, children: [
            { title: '__init__.py', key: 'app-init', icon: <FileOutlined /> },
            { title: 'routes.py', key: 'routes', icon: <FileOutlined /> },
            { title: 'models.py', key: 'models', icon: <FileOutlined /> },
            { title: 'services.py', key: 'services', icon: <FileOutlined /> },
          ]},
          { title: 'tests/', key: 'tests', icon: <FolderOutlined />, children: [
            { title: 'test_routes.py', key: 'test-routes', icon: <FileOutlined /> },
          ]},
          { title: 'requirements.txt', key: 'req', icon: <FileTextOutlined /> },
          { title: 'Dockerfile', key: 'docker', icon: <FileTextOutlined /> },
          { title: 'README.md', key: 'readme', icon: <FileTextOutlined /> },
          { title: '.env.example', key: 'env', icon: <FileTextOutlined /> },
        ],
      },
    ],
    claudeMd: `# CLAUDE.md

## Project Overview
Python Web application using Flask/FastAPI.

## Architecture
- MVC pattern with clear separation
- SQLAlchemy for ORM
- pytest for testing

## Commands
- \`python -m pytest\` — run tests
- \`python app.py\` — start dev server
`,
    agentsMd: `# AGENTS.md

## Roles
- **BackendDev**: Handles API routes, models, business logic
- **TestEngineer**: Writes unit/integration tests
- **DevOps**: Dockerfile, CI/CD, deployment

## Workflows
1. BackendDev implements feature branch
2. TestEngineer writes tests in parallel
3. Code review via PR before merge
`,
    checklist: [
      '创建虚拟环境 (venv/conda)',
      '安装依赖 requirements.txt',
      '配置 .env 环境变量',
      '初始化数据库迁移',
      '编写第一个单元测试',
      '配置 Dockerfile',
      '编写 README 项目说明',
      '配置 CI/CD 流水线',
      '代码风格检查 (black/flake8)',
      'API 文档 (OpenAPI/Swagger)',
    ],
  },
  'data-science': {
    label: '数据科学',
    color: 'cyan',
    tree: [
      {
        title: 'data-project',
        key: 'root',
        icon: <FolderOutlined />,
        children: [
          { title: 'data/', key: 'data', icon: <FolderOutlined />, children: [
            { title: 'raw/', key: 'raw', icon: <FolderOutlined /> },
            { title: 'processed/', key: 'processed', icon: <FolderOutlined /> },
            { title: 'external/', key: 'external', icon: <FolderOutlined /> },
          ]},
          { title: 'notebooks/', key: 'notebooks', icon: <FolderOutlined />, children: [
            { title: '01_eda.ipynb', key: 'eda', icon: <FileOutlined /> },
            { title: '02_modeling.ipynb', key: 'modeling', icon: <FileOutlined /> },
          ]},
          { title: 'src/', key: 'src', icon: <FolderOutlined />, children: [
            { title: 'features.py', key: 'features', icon: <FileOutlined /> },
            { title: 'model.py', key: 'model', icon: <FileOutlined /> },
            { title: 'evaluate.py', key: 'evaluate', icon: <FileOutlined /> },
          ]},
          { title: 'reports/', key: 'reports', icon: <FolderOutlined /> },
          { title: 'requirements.txt', key: 'req', icon: <FileTextOutlined /> },
          { title: 'README.md', key: 'readme', icon: <FileTextOutlined /> },
        ],
      },
    ],
    claudeMd: `# CLAUDE.md

## Project Overview
Data Science project following Cookiecutter structure.

## Architecture
- Jupyter notebooks for exploration
- \`src/\` for production code
- \`data/\` with raw/processed separation

## Commands
- \`jupyter lab\` — start notebook server
- \`python src/model.py\` — train model
`,
    agentsMd: `# AGENTS.md

## Roles
- **DataScientist**: EDA, feature engineering, modeling
- **MLEngineer**: Production pipeline, deployment
- **DomainExpert**: Business context, feature validation

## Workflows
1. DataScientist explores data in notebooks
2. MLEngineer converts notebook to production code
3. DomainExpert validates model predictions
`,
    checklist: [
      '下载/收集原始数据',
      '数据清洗与质量检查',
      '探索性数据分析 (EDA)',
      '特征工程与选择',
      '建立基线模型',
      '模型调参与对比',
      '模型可解释性分析',
      '生成分析报告',
      '部署模型服务',
      '监控模型性能',
    ],
  },
  'monorepo': {
    label: 'Monorepo',
    color: 'purple',
    tree: [
      {
        title: 'monorepo',
        key: 'root',
        icon: <FolderOutlined />,
        children: [
          { title: 'apps/', key: 'apps', icon: <FolderOutlined />, children: [
            { title: 'web/', key: 'web', icon: <FolderOutlined /> },
            { title: 'api/', key: 'api', icon: <FolderOutlined /> },
            { title: 'mobile/', key: 'mobile', icon: <FolderOutlined /> },
          ]},
          { title: 'packages/', key: 'packages', icon: <FolderOutlined />, children: [
            { title: 'ui/', key: 'ui-pkg', icon: <FolderOutlined /> },
            { title: 'utils/', key: 'utils-pkg', icon: <FolderOutlined /> },
            { title: 'types/', key: 'types-pkg', icon: <FolderOutlined /> },
          ]},
          { title: 'turbo.json', key: 'turbo', icon: <FileTextOutlined /> },
          { title: 'pnpm-workspace.yaml', key: 'pnpm', icon: <FileTextOutlined /> },
          { title: 'package.json', key: 'pkg', icon: <FileTextOutlined /> },
        ],
      },
    ],
    claudeMd: `# CLAUDE.md

## Project Overview
Turborepo monorepo with shared packages.

## Architecture
- \`apps/\`: deployable applications
- \`packages/\`: shared libraries
- Turbo pipeline for task orchestration
`,
    agentsMd: `# AGENTS.md

## Roles
- **AppDev**: Works in apps/web or apps/api
- **PackageDev**: Maintains shared packages/ui
- **ReleaseManager**: Versioning, publishing, changelogs

## Workflows
1. PackageDev publishes shared component update
2. AppDev bumps dependency and integrates
3. ReleaseManager tags release
`,
    checklist: [
      '初始化 Turborepo / Nx',
      '配置 pnpm workspace',
      '创建共享 packages 结构',
      '配置 turbo.json pipeline',
      '设置 TypeScript 共享配置',
      '配置 ESLint / Prettier 统一规范',
      '设置 Changesets 版本管理',
      '配置 CI/CD 缓存策略',
      '文档站点搭建',
      '首次发布共享包',
    ],
  },
  'fullstack': {
    label: 'Full-Stack',
    color: 'geekblue',
    tree: [
      {
        title: 'fullstack-app',
        key: 'root',
        icon: <FolderOutlined />,
        children: [
          { title: 'frontend/', key: 'frontend', icon: <FolderOutlined />, children: [
            { title: 'src/', key: 'fe-src', icon: <FolderOutlined /> },
            { title: 'package.json', key: 'fe-pkg', icon: <FileTextOutlined /> },
            { title: 'vite.config.ts', key: 'vite', icon: <FileTextOutlined /> },
          ]},
          { title: 'backend/', key: 'backend', icon: <FolderOutlined />, children: [
            { title: 'src/', key: 'be-src', icon: <FolderOutlined /> },
            { title: 'package.json', key: 'be-pkg', icon: <FileTextOutlined /> },
            { title: 'Dockerfile', key: 'be-docker', icon: <FileTextOutlined /> },
          ]},
          { title: 'shared/', key: 'shared', icon: <FolderOutlined />, children: [
            { title: 'types.ts', key: 'types', icon: <FileOutlined /> },
            { title: 'constants.ts', key: 'constants', icon: <FileOutlined /> },
          ]},
          { title: 'docker-compose.yml', key: 'compose', icon: <FileTextOutlined /> },
          { title: 'README.md', key: 'readme', icon: <FileTextOutlined /> },
        ],
      },
    ],
    claudeMd: `# CLAUDE.md

## Project Overview
Full-stack application with React frontend + Node.js backend.

## Architecture
- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Shared: Common types and constants
`,
    agentsMd: `# AGENTS.md

## Roles
- **FrontendDev**: UI/UX, React components, state management
- **BackendDev**: API design, database, auth
- **FullStackDev**: Integration, deployment, DevOps

## Workflows
1. BackendDev defines API contract (OpenAPI)
2. FrontendDev implements UI against mock API
3. FullStackDev wires frontend to real backend
`,
    checklist: [
      '初始化前端项目 (Vite/React)',
      '初始化后端项目 (Express/Nest)',
      '创建共享 types/constants',
      '配置数据库连接',
      '实现用户认证 (JWT)',
      '设计 API 接口规范',
      '前端路由与状态管理',
      '前后端联调测试',
      '配置 Docker Compose',
      '部署到云服务器',
    ],
  },
  'custom': {
    label: '自定义',
    color: 'default',
    tree: [
      {
        title: 'custom-project',
        key: 'root',
        icon: <FolderOutlined />,
        children: [
          { title: 'src/', key: 'src', icon: <FolderOutlined /> },
          { title: 'docs/', key: 'docs', icon: <FolderOutlined /> },
          { title: 'README.md', key: 'readme', icon: <FileTextOutlined /> },
        ],
      },
    ],
    claudeMd: `# CLAUDE.md

## Project Overview
自定义项目结构，根据团队需求灵活调整。

## Getting Started
1. 定义项目目标和范围
2. 选择技术栈
3. 设计目录结构
`,
    agentsMd: `# AGENTS.md

## Roles
- **ProjectLead**: 项目规划、任务分配、进度跟踪
- **Developer**: 核心开发
- **QA**: 质量保证
`,
    checklist: [
      '明确项目目标与范围',
      '选择技术栈与架构',
      '设计目录结构',
      '配置开发环境',
      '制定编码规范',
      '搭建基础框架',
      '编写第一个功能',
      '配置测试环境',
      '编写项目文档',
      '团队分工与排期',
    ],
  },
};

const ProjectScaffold: React.FC = () => {
  const [projectType, setProjectType] = useState<ProjectType>('python-web');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const mTheme: MakerTheme = MAKER_THEMES.scaffold;
  const textColor = isDark ? mTheme.textDark : mTheme.textLight;
  const borderColor = isDark ? mTheme.borderDark : mTheme.borderLight;

  const config = SCAFFOLD_MAP[projectType];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} 已复制到剪贴板`);
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const checkedCount = config.checklist.filter((item) => checkedItems[item]).length;
  const progress = Math.round((checkedCount / config.checklist.length) * 100);

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
            PROJECT SCAFFOLD
          </div>
        </div>
      </div>

      {/* 分区1：工程设定 */}
      <MakerSection title="工程设定" subtitle="PROJECT SETUP" theme={mTheme} isDark={isDark} stagger={1}>
        <Space wrap>
          <Text strong style={{ color: textColor, fontFamily: MAKER_FONT_SERIF, fontSize: 13 }}>
            项目类型：
          </Text>
          <Select
            value={projectType}
            onChange={(v) => {
              setProjectType(v as ProjectType);
              setCheckedItems({});
            }}
            style={{ width: 200 }}
          >
            <Option value="python-web">Python Web</Option>
            <Option value="data-science">数据科学</Option>
            <Option value="monorepo">Monorepo</Option>
            <Option value="fullstack">Full-Stack</Option>
            <Option value="custom">自定义</Option>
          </Select>
          <Tag color={config.color} style={{ fontFamily: MAKER_FONT_SERIF }}>
            {config.label}
          </Tag>
          <Tag color={progress === 100 ? 'success' : 'processing'} style={{ fontFamily: MAKER_FONT_SERIF }}>
            清单 {progress}%
          </Tag>
        </Space>
      </MakerSection>

      {/* 分区2：目录结构 */}
      <div style={{ marginTop: 16 }}>
        <MakerSection title="目录结构" subtitle="DIRECTORY TREE" theme={mTheme} isDark={isDark} stagger={2}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(JSON.stringify(config.tree, null, 2), '目录结构')}
              style={{ color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF, fontSize: 12 }}
            >
              复制
            </Button>
          </div>
          <div
            style={{
              background: isDark ? 'rgba(0,0,0,0.25)' : '#F7F7F5',
              borderRadius: 8,
              border: `1px solid ${borderColor}`,
              padding: 12,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            <Tree
              treeData={config.tree}
              defaultExpandAll
              showIcon
              blockNode
              style={{ background: 'transparent' }}
            />
          </div>
        </MakerSection>
      </div>

      {/* 分区3：智能体指引 */}
      <div style={{ marginTop: 16 }}>
        <MakerSection title="智能体指引" subtitle="AGENT GUIDES" theme={mTheme} isDark={isDark} stagger={3}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <RobotOutlined style={{ color: mTheme.accentColor }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: textColor, fontFamily: MAKER_FONT_SERIF }}>
                  CLAUDE.md（AI 项目上下文）
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(config.claudeMd, 'CLAUDE.md')}
                  style={{ color: mTheme.accentColor, fontSize: 11 }}
                />
              </div>
              <pre
                style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#F7F7F5',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11.5,
                  lineHeight: 1.6,
                  margin: 0,
                  overflow: 'auto',
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  maxHeight: 220,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                }}
              >
                {config.claudeMd}
              </pre>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileTextOutlined style={{ color: mTheme.accentColor }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: textColor, fontFamily: MAKER_FONT_SERIF }}>
                  AGENTS.md（AI 角色分工）
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(config.agentsMd, 'AGENTS.md')}
                  style={{ color: mTheme.accentColor, fontSize: 11 }}
                />
              </div>
              <pre
                style={{
                  background: isDark ? 'rgba(0,0,0,0.3)' : '#F7F7F5',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 11.5,
                  lineHeight: 1.6,
                  margin: 0,
                  overflow: 'auto',
                  color: textColor,
                  border: `1px solid ${borderColor}`,
                  maxHeight: 220,
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                }}
              >
                {config.agentsMd}
              </pre>
            </div>
          </div>
        </MakerSection>
      </div>

      {/* 分区4：检查清单 */}
      <div style={{ marginTop: 16 }}>
        <MakerSection title="项目检查清单" subtitle="CHECKLIST" theme={mTheme} isDark={isDark} stagger={4}>
          {/* 进度条 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: textColor, opacity: 0.6, fontFamily: MAKER_FONT_SERIF }}>
                已完成 {checkedCount}/{config.checklist.length} 项
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 700, color: mTheme.accentColor, fontFamily: MAKER_FONT_SERIF }}>
                {progress}%
              </Text>
            </div>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${mTheme.accentColor}, ${mTheme.accentColor}88)`,
                  borderRadius: 5,
                  transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>
          <List
            dataSource={config.checklist}
            renderItem={(item, idx) => (
              <List.Item
                className={`maker-fade-in-up maker-stagger-${Math.min(idx + 1, 9)}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${checkedItems[item] ? mTheme.accentColor + '44' : borderColor}`,
                  background: checkedItems[item] ? `${mTheme.accentColor}0A` : 'transparent',
                  marginBottom: 6,
                  transition: 'all 0.25s ease',
                }}
              >
                <Checkbox
                  checked={!!checkedItems[item]}
                  onChange={() => toggleCheck(item)}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: textColor,
                    textDecoration: checkedItems[item] ? 'line-through' : 'none',
                    opacity: checkedItems[item] ? 0.55 : 1,
                    fontFamily: MAKER_FONT_SERIF,
                    fontSize: 13,
                  }}
                >
                  {item}
                </Text>
              </List.Item>
            )}
          />
        </MakerSection>
      </div>
    </div>
  );
};

export default ProjectScaffold;
