/**
 * 合作伙伴推荐面板 - 探路Scout 功能组件
 */

import React, { useState } from 'react';
import { Card, Form, Select, Button, Tag, Rate, Empty, Spin, Space, Badge, Statistic, Row, Col, Avatar, Progress, Typography } from 'antd';
import { TeamOutlined, GlobalOutlined, DollarOutlined, StarOutlined, RiseOutlined, EnvironmentOutlined, CheckCircleOutlined, PhoneOutlined, MailOutlined, BarChartOutlined } from '@ant-design/icons';
import { getPartners, type Partner } from '../../services/scoutService';

const { Text } = Typography;

const regionOptions = [
  { value: 'all', label: '全部地域', color: '#1890ff' },
  { value: 'east', label: '华东', color: '#1890ff' },
  { value: 'south', label: '华南', color: '#52c41a' },
  { value: 'north', label: '华北', color: '#faad14' },
  { value: 'central', label: '华中', color: '#722ed1' },
  { value: 'southwest', label: '西南', color: '#eb2f96' },
  { value: 'northwest', label: '西北', color: '#13c2c2' },
  { value: 'northeast', label: '东北', color: '#fa541c' },
];

const investmentOptions = [
  { value: 'all', label: '全部区间' },
  { value: '0-100', label: '0-100万' },
  { value: '100-500', label: '100-500万' },
  { value: '500-1000', label: '500-1000万' },
  { value: '1000-5000', label: '1000-5000万' },
  { value: '5000+', label: '5000万以上' },
];

const industryOptions = [
  { value: 'all', label: '全部行业', color: '#1890ff', icon: '🏭' },
  { value: 'tech', label: '科技', color: '#1890ff', icon: '💻' },
  { value: 'finance', label: '金融', color: '#52c41a', icon: '💰' },
  { value: 'healthcare', label: '医疗', color: '#eb2f96', icon: '🏥' },
  { value: 'education', label: '教育', color: '#722ed1', icon: '📚' },
  { value: 'retail', label: '零售', color: '#faad14', icon: '🛍️' },
  { value: 'manufacturing', label: '制造', color: '#13c2c2', icon: '⚙️' },
  { value: 'energy', label: '能源', color: '#fa541c', icon: '⚡' },
];

const regionLabelMap: Record<string, string> = {
  east: '华东', south: '华南', north: '华北', central: '华中',
  southwest: '西南', northwest: '西北', northeast: '东北',
};

const industryLabelMap: Record<string, string> = {
  tech: '科技', finance: '金融', healthcare: '医疗', education: '教育',
  retail: '零售', manufacturing: '制造', energy: '能源',
};

// 模拟合作伙伴数据
const mockPartners: Partner[] = [
  {
    id: '1', name: '红杉资本中国', region: 'east', industry: 'finance',
    investmentRange: '1000-5000万', rating: 4.9,
    description: '全球知名风险投资机构，专注于科技、医疗、消费等领域的早期和成长期投资。管理资产规模超300亿美元，投资了超500家企业',
    contact: 'contact@sequoiacap.cn',
    companyImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop',
  },
  {
    id: '2', name: 'IDG资本', region: 'north', industry: 'tech',
    investmentRange: '500-1000万', rating: 4.8,
    description: '专注于中国市场的领先投资机构，在TMT、医疗健康、消费升级等领域有丰富投资经验。累计投资超500家企业，覆盖初创期到成熟期全阶段',
    contact: 'info@idgcapital.com',
    companyImage: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=200&fit=crop',
  },
  {
    id: '3', name: '深创投', region: 'south', industry: 'manufacturing',
    investmentRange: '5000万以上', rating: 4.7,
    description: '深圳市创新投资集团有限公司，国内领先的创业投资机构，管理各类资金总规模超4000亿元。重点投资高新技术企业和战略性新兴产业',
    contact: 'szvc@szvc.com.cn',
    companyImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
  },
  {
    id: '4', name: '高瓴资本', region: 'east', industry: 'healthcare',
    investmentRange: '1000-5000万', rating: 4.9,
    description: '专注于长期结构性价值投资，覆盖医疗健康、消费零售、TMT、企业服务等领域。管理资产规模超500亿美元，投资了腾讯、京东、美团等知名企业',
    contact: 'ir@hillhouseinvestment.com',
    companyImage: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=200&fit=crop',
  },
  {
    id: '5', name: '真格基金', region: 'north', industry: 'education',
    investmentRange: '100-500万', rating: 4.6,
    description: '专注于早期项目投资，致力于支持具有创新精神的创业者。已投资超过500家创业公司，包括小红书、VIPKID、依图科技等明星企业',
    contact: 'hello@zhenfund.com',
    companyImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=200&fit=crop',
  },
  {
    id: '6', name: '经纬中国', region: 'east', industry: 'retail',
    investmentRange: '500-1000万', rating: 4.5,
    description: '专注于早期和成长期投资，重点关注科技、媒体和电信（TMT）领域的创新型公司。累计投资超300家企业，管理多支美元和人民币基金',
    contact: 'contact@matrixpartners.com.cn',
    companyImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop',
  },
];

const PartnerRecommendationPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Partner[]>(mockPartners);
  const [hasSearched, setHasSearched] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleSearch = async () => {
    const values = await form.validateFields();
    setLoading(true);
    setHasSearched(true);
    setSelectedPartner(null);
    try {
      const data = await getPartners({
        region: values.region === 'all' ? undefined : values.region,
        investmentRange: values.investmentRange === 'all' ? undefined : values.investmentRange,
        industry: values.industry === 'all' ? undefined : values.industry,
      });
      setResults(data.length > 0 ? data : mockPartners);
    } catch (error) {
      console.error('获取合作伙伴失败:', error);
      setResults(mockPartners);
    } finally {
      setLoading(false);
    }
  };

  // 统计数据
  const avgRating = results.length > 0 ? (results.reduce((sum, p) => sum + p.rating, 0) / results.length).toFixed(1) : '0';
  const industryCount = new Set(results.map(p => p.industry)).size;

  return (
    <Card
      title={
        <Space>
          <TeamOutlined style={{ color: '#1890ff', fontSize: 18 }} />
          <span style={{ fontWeight: 'bold' }}>合作伙伴推荐</span>
        </Space>
      }
      size="small"
      styles={{ body: { padding: '12px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' } }}
    >
      {/* 统计卡片 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #d6e4ff' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}><TeamOutlined /> 合作伙伴</span>}
              value={results.length}
              styles={{ content: { color: '#1890ff', fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #d9f7be' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}><StarOutlined /> 平均评分</span>}
              value={avgRating}
              suffix="/5"
              styles={{ content: { color: '#52c41a', fontSize: 20 } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffe7ba' }}>
            <Statistic
              title={<span style={{ fontSize: 12 }}><RiseOutlined /> 覆盖行业</span>}
              value={industryCount}
              suffix="个"
              styles={{ content: { color: '#fa8c16', fontSize: 20 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 平台注册投资*/}
      <div style={{ marginBottom: 16, padding: '12px', background: '#f0f5ff', borderRadius: 12, border: '1px solid #d6e4ff' }}>
        <div style={{ fontSize: 13, color: '#1890ff', marginBottom: 8, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TeamOutlined /> 平台注册投资          <Tag color="blue" size="small">实时同步</Tag>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: '张投资人', company: '创新资本投资有限公司', stage: '天使轮、Pre-A轮', industry: '人工智能、新能源', amount: '¥5,000万' },
            { name: '李创投', company: '未来资本', stage: '种子轮、天使轮', industry: '生物医药、教育科技', amount: '¥2,000万' },
          ].map((investor, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--bg-card)',
              borderRadius: 8,
              gap: 12,
            }}>
              <Avatar size={36} style={{ background: '#1890ff' }}>{investor.name[0]}</Avatar>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{investor.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{investor.company}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {investor.stage} · {investor.industry}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff' }}>{investor.amount}</div>
                <Tag color="success" size="small">可联系</Tag>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 行业快捷选择 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 'bold' }}>
          <BarChartOutlined /> 热门行业
        </div>
        <Space wrap>
          {industryOptions.filter(i => i.value !== 'all').map(ind => (
            <Tag
              key={ind.value}
              color={ind.color}
              style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 13 }}
              onClick={() => form.setFieldsValue({ industry: ind.value })}
            >
              <span style={{ marginRight: 4 }}>{ind.icon}</span>
              {ind.label}
            </Tag>
          ))}
        </Space>
      </div>

      <Form form={form} layout="vertical" size="small">
        <Form.Item name="region" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 13 }}>地域</span>} initialValue="all">
          <Select
            showSearch
            placeholder="搜索选择地域"
            optionFilterProp="label"
            options={regionOptions}
            style={{ borderRadius: 8 }}
            size="middle"
          />
        </Form.Item>
        <Form.Item name="investmentRange" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 13 }}>投资区间</span>} initialValue="all">
          <Select
            showSearch
            placeholder="搜索选择投资区间"
            optionFilterProp="label"
            options={investmentOptions}
            style={{ borderRadius: 8 }}
            size="middle"
          />
        </Form.Item>
        <Form.Item name="industry" label={<span style={{ color: '#374151', fontWeight: 600, fontSize: 13 }}>行业</span>} initialValue="all">
          <Select
            showSearch
            placeholder="搜索选择行业"
            optionFilterProp="label"
            options={industryOptions.map(i => ({ value: i.value, label: `${i.icon} ${i.label}` }))}
            style={{ borderRadius: 8 }}
            size="middle"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            icon={<TeamOutlined />}
            onClick={handleSearch}
            loading={loading}
            block
            size="large"
            style={{ borderRadius: 8 }}
          >
            搜索合作伙伴
          </Button>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        {hasSearched && results.length === 0 ? (
          <Empty description="未找到匹配的合作伙伴" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item) => {
              const indConfig = industryOptions.find(i => i.value === item.industry);
              const regConfig = regionOptions.find(r => r.value === item.region);
              return (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <Card
                    hoverable
                    onClick={() => setSelectedPartner(item)}
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* 企业形象背景 - 占满卡片上部 */}
                    <div
                      style={{
                        height: 180,
                        background: item.companyImage
                          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${item.companyImage})`
                          : `linear-gradient(135deg, ${indConfig.color || '#667eea'} 0%, #764ba2 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: 16,
                      }}
                    >
                      <div style={{ color: '#ffffff', width: '100%' }}>
                        <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 13, color: '#f1f5f9', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                          <StarOutlined /> {item.rating} ?· {item.investmentRange}
                        </div>
                      </div>
                    </div>

                    {/* 卡片内容 - 占满剩余空间 */}
                    <div style={{ padding: 16 }}>
                      <Space size={8} wrap style={{ marginBottom: 12 }}>
                        <Tag color={indConfig.color || 'blue'} icon={<DollarOutlined />}>
                          {industryLabelMap[item.industry] || item.industry}
                        </Tag>
                        <Tag icon={<EnvironmentOutlined />} color={regConfig.color || 'default'}>
                          {regionLabelMap[item.region] || item.region}
                        </Tag>
                        <Tag icon={<CheckCircleOutlined />} color="success">
                          已认证
                        </Tag>
                      </Space>
                      
                      {/* 评分进度*/}
                      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                        <Rate disabled defaultValue={item.rating} style={{ fontSize: 14 }} />
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8, fontWeight: 'bold' }}>
                          {item.rating.toFixed(1)}
                        </span>
                        <Progress
                          percent={item.rating * 20}
                          showInfo={false}
                          strokeColor={item.rating >= 4.5 ? '#52c41a' : '#faad14'}
                          style={{ width: 80, marginLeft: 12 }}
                          size="small"
                        />
                      </div>
                      
                      {/* 描述文字 */}
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {item.description}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </Spin>

      {/* 合作伙伴详情弹窗 */}
      {selectedPartner && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedPartner(null)}
        >
          <Card
            style={{ width: 520, maxWidth: '90vw', borderRadius: 16 }}
            onClick={(e) => e.stopPropagation()}
            title={
              <Space>
                <Avatar style={{ background: industryOptions.find(i => i.value === selectedPartner.industry)?.color || '#1890ff' }}>
                  {industryOptions.find(i => i.value === selectedPartner.industry)?.icon || '💼'}
                </Avatar>
                <span style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedPartner.name}</span>
              </Space>
            }
            extra={<Button size="small" onClick={() => setSelectedPartner(null)}>关闭</Button>}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  height: 160,
                  background: selectedPartner.companyImage
                    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${selectedPartner.companyImage})`
                    : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 12,
                }}
              >
                <div style={{ color: '#ffffff' }}>
                  <div style={{ fontSize: 22, fontWeight: 'bold', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>{selectedPartner.name}</div>
                </div>
              </div>
            </div>
            <Space size={8} wrap style={{ marginBottom: 12 }}>
              <Tag color="blue" icon={<EnvironmentOutlined />}>
                {regionLabelMap[selectedPartner.region] || selectedPartner.region}
              </Tag>
              <Tag color="green" icon={<DollarOutlined />}>
                {industryLabelMap[selectedPartner.industry] || selectedPartner.industry}
              </Tag>
              <Tag color="orange" icon={<RiseOutlined />}>
                {selectedPartner.investmentRange}
              </Tag>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                已认证
              </Tag>
            </Space>
            <div style={{ marginBottom: 12 }}>
              <Rate disabled defaultValue={selectedPartner.rating} />
              <span style={{ marginLeft: 8, fontWeight: 'bold' }}>{selectedPartner.rating.toFixed(1)}</span>
              <Progress percent={selectedPartner.rating * 20} showInfo={false} style={{ width: 100, marginLeft: 8 }} size="small" />
            </div>
            <Card size="small" style={{ background: '#f5f5f5', marginBottom: 12 }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selectedPartner.description}</p>
            </Card>
            {selectedPartner.contact && (
              <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1890ff' }}>
                  <MailOutlined /> 联系方式
                </div>
                <div style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {selectedPartner.contact}
                </div>
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button type="primary" block icon={<TeamOutlined />}>联系合作</Button>
              <Button block icon={<StarOutlined />}>收藏</Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default PartnerRecommendationPanel;
