/**
 * Skill 库页面
 * 参考 Grok Build Skills 系统设计
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
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
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  MoreOutlined,
  BookOutlined,
  DesktopOutlined,
  PictureOutlined,
  DollarOutlined,
  AppstoreOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useSkillStore } from '../store/skillStore';
import { useI18n } from '../i18n';
import { ToolEmptyState } from '../components/tools/shared';
import type { Skill, SkillCategory } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SkillLibrary: React.FC = () => {
  const { t, lang } = useI18n();

  // 分类配置（标签跟随语言切换）
  const categoryConfig = useMemo<
    Record<SkillCategory | 'all', { label: string; icon: React.ReactNode; color: string }>
  >(
    () => ({
      all: { label: t('skillLib.cat.all'), icon: <MoreOutlined />, color: '#1677ff' },
      marketing: { label: t('skillLib.cat.marketing'), icon: <ShoppingOutlined />, color: '#f5222d' },
      analysis: { label: t('skillLib.cat.analysis'), icon: <BarChartOutlined />, color: '#722ed1' },
      writing: { label: t('skillLib.cat.writing'), icon: <FileTextOutlined />, color: '#13c2c2' },
      coding: { label: t('skillLib.cat.coding'), icon: <CodeOutlined />, color: '#52c41a' },
      knowledge: { label: t('skillLib.cat.knowledge'), icon: <BookOutlined />, color: '#eb2f96' },
      office: { label: t('skillLib.cat.office'), icon: <DesktopOutlined />, color: '#2f54eb' },
      design: { label: t('skillLib.cat.design'), icon: <PictureOutlined />, color: '#fa541c' },
      finance: { label: t('skillLib.cat.finance'), icon: <DollarOutlined />, color: '#faad14' },
      product: { label: t('skillLib.cat.product'), icon: <AppstoreOutlined />, color: '#13c2c2' },
      automation: { label: t('skillLib.cat.automation'), icon: <RobotOutlined />, color: '#531dab' },
      custom: { label: t('skillLib.cat.custom'), icon: <ThunderboltOutlined />, color: '#fa8c16' },
    }),
    [lang]
  );

  const {
    skills,
    searchQuery,
    activeCategory,
    setSearchQuery,
    setActiveCategory,
    addSkill,
    updateSkill,
    deleteSkill,
    toggleSkill,
    getFilteredSkills,
  } = useSkillStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form] = Form.useForm();

  const filteredSkills = getFilteredSkills();

  const handleOpenDrawer = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      form.setFieldsValue({
        name: skill.name,
        description: skill.description,
        category: skill.category,
        promptTemplate: skill.promptTemplate,
        triggerCommand: skill.triggerCommand,
      });
    } else {
      setEditingSkill(null);
      form.resetFields();
      form.setFieldsValue({ category: 'custom', triggerCommand: '/' });
    }
    setDrawerOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingSkill) {
        updateSkill(editingSkill.id, { ...values, updatedAt: Date.now() });
      } else {
        addSkill({
          ...values,
          autoTriggers: [],
          isEnabled: true,
        });
      }
      setDrawerOpen(false);
      form.resetFields();
    });
  };

  return (
    <div
      className="tool-dot-bg"
      style={{
        padding: 24,
        height: '100%',
        overflow: 'auto',
        '--tool-accent': '#00b96b',
        '--tool-accent-glow': 'rgba(0,185,107,0.12)',
      } as React.CSSProperties}
    >
      {/* 顶部操作栏 */}
      <div
        className="tool-glass-card tool-fade-in-up"
        style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00b96b, #95de64)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>{t('skillLib.title')}</Title>
            <Text type="secondary">{t('skillLib.subtitle')}</Text>
          </div>
        </div>
        <Button className="tool-pill-btn" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
          {t('skillLib.newSkill')}
        </Button>
      </div>

      {/* 搜索与筛选 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col flex="auto">
          <Input
            className="tool-pill-input"
            placeholder={t('skillLib.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </Col>
        <Col>
          <Space>
            {(Object.keys(categoryConfig) as (SkillCategory | 'all')[]).map((cat, index) => (
              <Button
                key={cat}
                className={`tool-pill-btn tool-fade-in-up tool-stagger-${index + 1}`}
                type={activeCategory === cat ? 'primary' : 'default'}
                size="small"
                icon={categoryConfig[cat].icon}
                onClick={() => setActiveCategory(cat)}
                style={activeCategory === cat ? { backgroundColor: categoryConfig[cat].color, borderColor: categoryConfig[cat].color } : undefined}
              >
                {categoryConfig[cat].label}
                {cat !== 'all' && (
                  <Badge
                    count={skills.filter((s) => s.category === cat).length}
                    style={{ marginLeft: 6, backgroundColor: '#d9d9d9', color: '#666', fontSize: 10 }}
                  />
                )}
              </Button>
            ))}
          </Space>
        </Col>
      </Row>

      {/* Skill 卡片网格 */}
      {filteredSkills.length === 0 ? (
        <ToolEmptyState
          icon={<ThunderboltOutlined />}
          title={t('skillLib.empty')}
          subtitle={t('skillLib.searchPlaceholder')}
          accent="#00b96b"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredSkills.map((skill, index) => (
            <Col xs={24} sm={12} lg={8} key={skill.id}>
              <Card
                className={`tool-glass-card tool-card-rise tool-stagger-${index + 1}`}
                hoverable
                size="small"
                style={{ borderRadius: 16 }}
                styles={{
                  body: { padding: 16 },
                }}
                actions={[
                  <Tooltip title={t('common.edit')} key="edit">
                    <EditOutlined onClick={() => handleOpenDrawer(skill)} />
                  </Tooltip>,
                  <Tooltip title={t('common.delete')} key="delete">
                    <DeleteOutlined onClick={() => deleteSkill(skill.id)} style={{ color: '#ff4d4f' }} />
                  </Tooltip>,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${categoryConfig[skill.category].color}, ${categoryConfig[skill.category].color}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      {categoryConfig[skill.category].icon}
                    </div>
                    <Text strong style={{ fontSize: 15 }}>{skill.name}</Text>
                  </div>
                  <Switch size="small" checked={skill.isEnabled} onChange={() => toggleSkill(skill.id)} />
                </div>

                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12, minHeight: 36 }}>
                  {skill.description}
                </Text>

                <Space size="small" wrap>
                  <Tag color="blue" style={{ fontSize: 12 }}>
                    {skill.triggerCommand}
                  </Tag>
                  {skill.autoTriggers.length > 0 && (
                    <Tooltip title={t('skillLib.autoTriggerRules', { count: skill.autoTriggers.length })}>
                      <Badge dot color="green">
                        <Tag color="green" style={{ fontSize: 12 }}>{t('skillLib.autoTrigger')}</Tag>
                      </Badge>
                    </Tooltip>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('skillLib.usedCount', { count: skill.usageCount })}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 新建/编辑 Drawer */}
      <Drawer
        title={editingSkill ? t('skillLib.editTitle') : t('skillLib.createTitle')}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleSubmit}>
              {editingSkill ? t('common.save') : t('skillLib.create')}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('skillLib.name')}
            rules={[{ required: true, message: t('skillLib.nameRequired') }]}
          >
            <Input placeholder={t('skillLib.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="category"
            label={t('skillLib.category')}
            rules={[{ required: true }]}
          >
            <Select placeholder={t('skillLib.categoryPlaceholder')}>
              <Option value="marketing">{t('skillLib.cat.marketing')}</Option>
              <Option value="analysis">{t('skillLib.cat.analysis')}</Option>
              <Option value="writing">{t('skillLib.cat.writing')}</Option>
              <Option value="coding">{t('skillLib.cat.coding')}</Option>
              <Option value="knowledge">{t('skillLib.cat.knowledge')}</Option>
              <Option value="office">{t('skillLib.cat.office')}</Option>
              <Option value="design">{t('skillLib.cat.design')}</Option>
              <Option value="finance">{t('skillLib.cat.finance')}</Option>
              <Option value="product">{t('skillLib.cat.product')}</Option>
              <Option value="automation">{t('skillLib.cat.automation')}</Option>
              <Option value="custom">{t('skillLib.cat.custom')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={t('skillLib.description')}
            rules={[{ required: true, message: t('skillLib.descriptionRequired') }]}
          >
            <Input.TextArea rows={2} placeholder={t('skillLib.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="triggerCommand"
            label={t('skillLib.triggerCommand')}
            rules={[{ required: true, message: t('skillLib.triggerCommandRequired') }]}
          >
            <Input placeholder={t('skillLib.triggerCommandPlaceholder')} prefix="/" />
          </Form.Item>

          <Form.Item
            name="promptTemplate"
            label={t('skillLib.promptTemplate')}
            rules={[{ required: true, message: t('skillLib.promptTemplateRequired') }]}
          >
            <TextArea
              rows={8}
              placeholder={t('skillLib.promptTemplatePlaceholder')}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default SkillLibrary;
