/**
 * 军师AI - 项目计划面板（案五 · 紫兰）
 * 分区式结构：项目设定 + 横向打卡线 + 阶段任务 + 交付进度
 * 交互：点击打卡节点查看阶段任务，勾选任务推进进度条，直至可交付
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Form, Input, Button, Spin, Typography, Checkbox } from 'antd';
import { SendOutlined, DownloadOutlined, CheckOutlined } from '@ant-design/icons';
import { chatWithZhipu } from '../../services/aiService';
import { useAIStore } from '../../store/aiStore';
import { SAGE_THEMES, SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import './sage-animations.css';
import { SageSection } from './shared';
import { splitByH2, extractListItems } from './sage-markdown';

const { TextArea } = Input;
const { Text } = Typography;

// ─── 数据结构 ─────────────────────────────────────────────

interface StageTask {
  id: string;
  text: string;
  done: boolean;
}

interface ProjectStage {
  id: string;
  name: string;
  desc: string;
  tasks: StageTask[];
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// 示例项目大纲（未配置模型时兜底，保证打卡线可交互体验）
const DEMO_STAGES: ProjectStage[] = [
  {
    id: 's1',
    name: '需求调研',
    desc: '验证目标用户与核心痛点',
    tasks: [
      { id: 't1-1', text: '完成 30 份目标用户访谈', done: false },
      { id: 't1-2', text: '输出竞品分析报告', done: false },
      { id: 't1-3', text: '确认核心功能清单与优先级', done: false },
    ],
  },
  {
    id: 's2',
    name: '原型设计',
    desc: '完成可点击的高保真原型',
    tasks: [
      { id: 't2-1', text: '绘制信息架构与页面流程', done: false },
      { id: 't2-2', text: '产出 8 个核心页面高保真稿', done: false },
      { id: 't2-3', text: '原型用户测试并收集反馈', done: false },
    ],
  },
  {
    id: 's3',
    name: 'MVP 开发',
    desc: '开发最小可行产品',
    tasks: [
      { id: 't3-1', text: '搭建前后端基础工程', done: false },
      { id: 't3-2', text: '实现核心业务流程闭环', done: false },
      { id: 't3-3', text: '完成基础数据埋点与日志', done: false },
    ],
  },
  {
    id: 's4',
    name: '内测迭代',
    desc: '种子用户验证与迭代',
    tasks: [
      { id: 't4-1', text: '招募 50 名种子用户', done: false },
      { id: 't4-2', text: '收集反馈并修复关键问题', done: false },
      { id: 't4-3', text: '完成 2 轮功能迭代', done: false },
    ],
  },
  {
    id: 's5',
    name: '正式交付',
    desc: '上线发布并进入运营期',
    tasks: [
      { id: 't5-1', text: '完成上线前全量回归测试', done: false },
      { id: 't5-2', text: '发布 v1.0 并完成应用商店上架', done: false },
      { id: 't5-3', text: '输出运营冷启动方案', done: false },
    ],
  },
];

// 将 AI 返回的项目大纲 Markdown 解析为阶段
const parseStages = (markdown: string): ProjectStage[] => {
  const sections = splitByH2(markdown);
  const stages: ProjectStage[] = [];
  let idx = 0;

  for (const section of sections) {
    const name = section.title.replace(/^#{1,6}\s*/, '').replace(/^阶段[一二三四五六七八九十\d]+\s*[：:.]?\s*/, '').trim();
    if (!name || name === '全文' || name === '项目大纲') continue;
    const items = extractListItems(section.content);
    if (items.length === 0) continue;
    idx += 1;
    stages.push({
      id: `stage-${idx}`,
      name,
      desc: items[0],
      tasks: items.map((text, j) => ({ id: `s${idx}-t${j}`, text, done: false })),
    });
  }
  return stages;
};

// ─── 主组件 ───────────────────────────────────────────────

const ProjectPlan: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<ProjectStage[]>(DEMO_STAGES);
  const [activeStageId, setActiveStageId] = useState<string>(DEMO_STAGES[0].id);
  const [rawResult, setRawResult] = useState('');
  const [isDemo, setIsDemo] = useState(true);

  const isDark = useAIStore((s) => s.settings.theme === 'dark');
  const theme: SageTheme = SAGE_THEMES.plan;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  const activeStage = useMemo(
    () => stages.find((s) => s.id === activeStageId) || stages[0],
    [stages, activeStageId]
  );

  // 进度统计
  const completedCount = stages.filter((s) => s.tasks.every((t) => t.done)).length;
  const progress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;
  const allDone = stages.length > 0 && completedCount === stages.length;

  const handleGenerate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    setRawResult('');

    const userContent = `项目名称：${values.projectName}\n项目目标：${values.goal}\n预计周期：${values.duration || '未指定'}`;

    try {
      const res = await chatWithZhipu(
        [{ role: 'user', content: userContent }],
        {
          system_prompt: `你是一位资深项目管理专家。请根据项目信息，输出一份完整的项目执行大纲（Markdown格式）。

输出结构（严格使用 ## 二级标题，按时间顺序 4-6 个阶段）：
# 项目大纲 — {项目名称}

## 阶段一：{阶段名称}
- {阶段目标或产出描述}
- {任务1}
- {任务2}
- {任务3}

## 阶段二：{阶段名称}
- {阶段目标或产出描述}
- {任务1}
- {任务2}

（以此类推，覆盖从启动到最终交付的完整路径，最后阶段为"正式交付"或"上线发布"）`,
        }
      );
      const content = res.data?.choices?.[0]?.message?.content || '';
      setRawResult(content);

      const parsed = parseStages(content);
      if (parsed.length >= 2) {
        setStages(parsed);
        setActiveStageId(parsed[0].id);
        setIsDemo(false);
      } else {
        setStages(DEMO_STAGES);
        setActiveStageId(DEMO_STAGES[0].id);
        setIsDemo(true);
      }
    } catch {
      setStages(DEMO_STAGES);
      setActiveStageId(DEMO_STAGES[0].id);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  // 切换任务勾选状态
  const toggleTask = useCallback((stageId: string, taskId: string) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          tasks: stage.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        };
      })
    );
  }, []);

  // 选中阶段（点击打卡节点）
  const handleSelectStage = useCallback((id: string) => {
    setActiveStageId(id);
  }, []);

  const handleDownload = () => {
    const content = rawResult || stages.map((s) => `## ${s.name}\n${s.tasks.map((t) => `- ${t.text}`).join('\n')}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '项目计划大纲.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="sage-grid-bg sage-paper-noise"
      style={{
        padding: 16,
        background: isDark ? theme.bgDark : theme.bgLight,
        borderRadius: 12,
        minHeight: '100%',
        '--sage-grid-line': isDark ? theme.glowColor : 'rgba(120,100,60,0.05)',
      } as React.CSSProperties}
    >
      {/* 面板头部：案号徽章 + 标题 */}
      <div
        className="sage-fade-in-up"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 12,
          background: isDark ? theme.gradient : theme.gradientLight,
          marginBottom: 16,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: theme.sealColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: SAGE_FONT_SERIF,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 2,
            boxShadow: `0 0 12px ${theme.glowColor}`,
            flexShrink: 0,
          }}
        >
          {theme.caseNo}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: SAGE_FONT_SERIF,
              fontSize: 18,
              fontWeight: 700,
              color: isDark ? theme.textDark : theme.textLight,
              letterSpacing: 2,
            }}
          >
            {theme.title}
          </div>
          <div
            style={{
              fontFamily: SAGE_FONT_SERIF,
              fontSize: 11,
              color: theme.accentColor,
              letterSpacing: 3,
              opacity: 0.85,
            }}
          >
            PROJECT ROADMAP
          </div>
        </div>
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          style={{ color: theme.accentColor, fontFamily: SAGE_FONT_SERIF, fontSize: 12 }}
        >
          导出大纲
        </Button>
      </div>

      {/* 分区1：项目设定 */}
      <SageSection title="项目设定" subtitle="PROJECT SETUP" theme={theme} isDark={isDark} stagger={1}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="projectName"
            label={<span style={{ fontFamily: SAGE_FONT_SERIF, color: textColor, fontSize: 13 }}>项目名称</span>}
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input
              placeholder="如：校园二手交易平台"
              style={{
                background: isDark ? theme.surfaceDark : '#fff',
                borderColor,
                color: textColor,
                borderRadius: 8,
                height: 36,
                fontFamily: SAGE_FONT_SERIF,
              }}
            />
          </Form.Item>
          <Form.Item
            name="goal"
            label={<span style={{ fontFamily: SAGE_FONT_SERIF, color: textColor, fontSize: 13 }}>项目目标</span>}
            rules={[{ required: true, message: '请输入项目目标' }]}
          >
            <TextArea
              rows={2}
              placeholder="描述项目要达成的核心目标..."
              style={{
                background: isDark ? theme.surfaceDark : '#fff',
                borderColor,
                color: textColor,
                borderRadius: 8,
                fontFamily: SAGE_FONT_SERIF,
              }}
            />
          </Form.Item>
          <Form.Item
            name="duration"
            label={<span style={{ fontFamily: SAGE_FONT_SERIF, color: textColor, fontSize: 13 }}>预计周期（可选）</span>}
          >
            <Input
              placeholder="如：3 个月 / 2026 Q3 - Q4"
              style={{
                background: isDark ? theme.surfaceDark : '#fff',
                borderColor,
                color: textColor,
                borderRadius: 8,
                height: 36,
                fontFamily: SAGE_FONT_SERIF,
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              className="sage-seal-btn"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleGenerate}
              loading={loading}
              style={{
                background: theme.sealColor,
                border: 'none',
                borderRadius: 8,
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 3,
                boxShadow: `0 4px 14px ${theme.glowColor}`,
              }}
            >
              生成项目大纲
            </Button>
          </Form.Item>
        </Form>
      </SageSection>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
          <Text style={{ display: 'block', marginTop: 12, color: textColor, fontFamily: SAGE_FONT_SERIF }}>
            正在拆解项目路径...
          </Text>
        </div>
      ) : (
        <>
          {/* 分区2：横向打卡线 */}
          <div style={{ marginTop: 16 }}>
            <SageSection title="项目打卡线" subtitle="MILESTONE TRACK" theme={theme} isDark={isDark} stagger={2}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '8px 4px 4px',
                  overflowX: 'auto',
                }}
              >
                {stages.map((stage, i) => {
                  const completed = stage.tasks.every((t) => t.done);
                  const active = stage.id === activeStageId;
                  return (
                    <React.Fragment key={stage.id}>
                      {/* 节点 */}
                      <div
                        onClick={() => handleSelectStage(stage.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: 120,
                          flexShrink: 0,
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        {/* 节点圆 */}
                        <div
                          className={active && !completed ? 'sage-pulse-dot' : ''}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                            fontWeight: 700,
                            fontFamily: SAGE_FONT_SERIF,
                            background: completed
                              ? theme.accentColor
                              : active
                                ? (isDark ? theme.surfaceDark : '#fff')
                                : (isDark ? theme.surfaceDark : '#fff'),
                            border: `2.5px solid ${completed ? theme.accentColor : active ? theme.accentColor : borderColor}`,
                            color: completed ? '#fff' : active ? theme.accentColor : (isDark ? theme.textDark : theme.textLight),
                            boxShadow: active ? `0 0 12px ${theme.glowColor}` : 'none',
                            transition: 'all 0.25s ease',
                            '--sage-glow': `${theme.accentColor}55`,
                          } as React.CSSProperties}
                        >
                          {completed ? <CheckOutlined /> : i + 1}
                        </div>
                        {/* 阶段名 */}
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12.5,
                            fontWeight: active ? 700 : 500,
                            color: active ? theme.accentColor : textColor,
                            fontFamily: SAGE_FONT_SERIF,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 110,
                          }}
                        >
                          {stage.name}
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 10,
                            color: completed ? theme.accentColor : (isDark ? theme.textDark : theme.textLight),
                            opacity: completed ? 0.9 : 0.45,
                            fontFamily: SAGE_FONT_SERIF,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 110,
                          }}
                        >
                          {completed ? '✓ 已完成' : `${stage.tasks.filter((t) => t.done).length}/${stage.tasks.length} 任务`}
                        </div>
                      </div>
                      {/* 连接线 */}
                      {i < stages.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            minWidth: 20,
                            height: 3,
                            marginTop: 17,
                            borderRadius: 2,
                            background: stages.slice(0, i + 1).every((s) => s.tasks.every((t) => t.done))
                              ? `linear-gradient(90deg, ${theme.accentColor}, ${theme.accentColor})`
                              : borderColor,
                            transition: 'background 0.4s ease',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </SageSection>
          </div>

          {/* 分区3：阶段任务 */}
          {activeStage && (
            <div style={{ marginTop: 16 }}>
              <SageSection
                title={`${activeStage.name} — 阶段任务`}
                subtitle="STAGE TASKS"
                theme={theme}
                isDark={isDark}
                stagger={3}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeStage.tasks.map((task, j) => {
                    const isLast = j === activeStage.tasks.length - 1;
                    const allOthersDone = activeStage.tasks.slice(0, j).every((t) => t.done);
                    const unlocked = j === 0 || allOthersDone;
                    return (
                      <div
                        key={task.id}
                        className={`sage-fade-in-up sage-stagger-${Math.min(j + 1, 8)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${task.done ? theme.accentColor + '55' : borderColor}`,
                          background: task.done ? `${theme.accentColor}0D` : (isDark ? theme.surfaceDark : '#fff'),
                          opacity: unlocked ? 1 : 0.45,
                          cursor: unlocked ? 'pointer' : 'not-allowed',
                          transition: 'all 0.25s ease',
                        }}
                        onClick={() => unlocked && toggleTask(activeStage.id, task.id)}
                      >
                        <Checkbox
                          checked={task.done}
                          disabled={!unlocked}
                          style={{ pointerEvents: 'none' }}
                        />
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: task.done ? (isDark ? theme.textDark : theme.textLight) : textColor,
                            fontFamily: SAGE_FONT_SERIF,
                            textDecoration: task.done ? 'line-through' : 'none',
                            opacity: task.done ? 0.7 : 1,
                          }}
                        >
                          {task.text}
                        </Text>
                        {task.done && (
                          <span style={{ color: theme.accentColor, fontSize: 12 }}>已完成</span>
                        )}
                      </div>
                    );
                  })}
                  {activeStage.tasks.length === 0 && (
                    <Text style={{ color: textColor, opacity: 0.6, fontFamily: SAGE_FONT_SERIF, fontSize: 12.5 }}>
                      该阶段暂无任务
                    </Text>
                  )}
                </div>
              </SageSection>
            </div>
          )}

          {/* 分区4：交付进度 */}
          <div style={{ marginTop: 16 }}>
            <SageSection title="交付进度" subtitle="DELIVERY PROGRESS" theme={theme} isDark={isDark} stagger={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: textColor, fontFamily: SAGE_FONT_SERIF, opacity: 0.6 }}>
                      已完成 {completedCount}/{stages.length} 个阶段
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: theme.accentColor,
                        fontFamily: SAGE_FONT_SERIF,
                      }}
                    >
                      {progress}%
                    </Text>
                  </div>
                  <div
                    style={{
                      height: 14,
                      borderRadius: 7,
                      background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      className="sage-bar-grow"
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.accentColor}88)`,
                        borderRadius: 7,
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${allDone ? theme.accentColor : borderColor}`,
                    background: allDone ? `${theme.accentColor}12` : 'transparent',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{allDone ? '🎉' : '📦'}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: allDone ? theme.accentColor : textColor,
                        fontFamily: SAGE_FONT_SERIF,
                      }}
                    >
                      {allDone ? '可交付' : '推进中'}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: textColor,
                        opacity: 0.5,
                        fontFamily: SAGE_FONT_SERIF,
                      }}
                    >
                      {allDone ? '全部阶段已完成' : `距可交付还差 ${stages.length - completedCount} 个阶段`}
                    </div>
                  </div>
                </div>
              </div>
            </SageSection>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectPlan;
