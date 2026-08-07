/**
 * 融资方网格卡片组件
 * 机构/个人分组展示 + 点击卡片查看详情弹窗
 * 尝试从API获取扩展信息，后端不可用时显示AI生成的基础信息
 */
import React, { useState } from 'react';
import { Modal, Row, Col, Tag, Typography, Spin, Divider } from 'antd';
import {
  BankOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import type { FinancingProvider, ProviderDetail } from './finance-utils';
import { fetchProviderDetail } from '../../services/financingService';

const { Paragraph } = Typography;

interface FinancingCardsProps {
  providers: FinancingProvider[];
  theme: SageTheme;
  isDark: boolean;
}

const FinancingCards: React.FC<FinancingCardsProps> = ({ providers, theme, isDark }) => {
  const [selectedProvider, setSelectedProvider] = useState<FinancingProvider | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [providerDetail, setProviderDetail] = useState<ProviderDetail | null>(null);

  const textColor = isDark ? theme.textDark : theme.textLight;
  const subTextColor = isDark ? 'rgba(245,239,227,0.6)' : 'rgba(41,37,36,0.6)';
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  // 分组
  const institutions = providers.filter(p => p.type === 'institution');
  const individuals = providers.filter(p => p.type === 'individual');

  const handleCardClick = async (provider: FinancingProvider) => {
    setSelectedProvider(provider);
    setProviderDetail(null);
    setDetailLoading(true);
    // 尝试从API获取扩展详情
    const detail = await fetchProviderDetail(provider.id);
    if (detail) setProviderDetail(detail);
    setDetailLoading(false);
  };

  const handleCloseModal = () => {
    setSelectedProvider(null);
    setProviderDetail(null);
  };

  // 渲染单张卡片
  const renderCard = (provider: FinancingProvider, index: number) => {
    const isInstitution = provider.type === 'institution';
    const icon = isInstitution ? <BankOutlined /> : <UserOutlined />;
    const typeLabel = isInstitution ? '机构' : '个人';
    const typeColor = isInstitution ? theme.chartColors[0] : theme.chartColors[2];

    return (
      <Col xs={24} sm={12} lg={8} key={provider.id}>
        <div
          className={`sage-fade-in-up sage-stagger-${Math.min(index + 1, 9)}`}
          onClick={() => handleCardClick(provider)}
          style={{
            background: isDark ? theme.surfaceDark : theme.surfaceLight,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: '14px 16px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
            height: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 16px ${theme.glowColor}`;
            e.currentTarget.style.borderColor = theme.accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = borderColor;
          }}
        >
          {/* 顶部色带 */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${typeColor}, ${typeColor}66)`,
          }} />

          {/* 头部：图标+名称 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `${typeColor}15`,
              color: typeColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 14, fontWeight: 700,
                color: textColor,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {provider.name}
              </div>
              <Tag
                color={isInstitution ? 'blue' : 'purple'}
                style={{ marginTop: 2, fontSize: 10, fontFamily: SAGE_FONT_SERIF }}
              >
                {typeLabel} · {provider.category}
              </Tag>
            </div>
          </div>

          {/* 关注领域 */}
          {provider.focusArea && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>
                关注领域
              </span>
              <div style={{
                fontSize: 12, color: textColor,
                fontFamily: SAGE_FONT_SERIF, lineHeight: 1.6,
              }}>
                {provider.focusArea}
              </div>
            </div>
          )}

          {/* 典型投资额度 */}
          {provider.typicalTicket && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 8, paddingTop: 8,
              borderTop: `1px dashed ${borderColor}`,
            }}>
              <span style={{ fontSize: 10.5, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>
                典型投资额度
              </span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: theme.accentColor,
                fontFamily: SAGE_FONT_SERIF,
              }}>
                {provider.typicalTicket}
              </span>
            </div>
          )}

          {/* 点击提示 */}
          <div style={{
            position: 'absolute',
            bottom: 8, right: 10,
            fontSize: 10, color: theme.accentColor,
            opacity: 0.5, fontFamily: SAGE_FONT_SERIF,
          }}>
            点击查看详情 →
          </div>
        </div>
      </Col>
    );
  };

  // 渲染详情弹窗内容
  const renderModalContent = () => {
    if (!selectedProvider) return null;
    const detail = (providerDetail || selectedProvider) as ProviderDetail;
    const isInstitution = selectedProvider.type === 'institution';

    return (
      <div style={{ fontFamily: SAGE_FONT_SERIF }}>
        {detailLoading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin />
            <div style={{ marginTop: 8, fontSize: 12, color: subTextColor }}>
              正在获取详细信息...
            </div>
          </div>
        )}

        {!detailLoading && (
          <>
            {/* 基本信息 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Tag color={isInstitution ? 'blue' : 'purple'} style={{ fontSize: 11 }}>
                  {isInstitution ? '机构投资方' : '个人投资方'}
                </Tag>
                <Tag style={{ fontSize: 11 }}>{detail.category}</Tag>
                {detail.stagePreference && (
                  <Tag color="cyan" style={{ fontSize: 11 }}>{detail.stagePreference}</Tag>
                )}
              </div>

              <Row gutter={[12, 12]}>
                {detail.focusArea && (
                  <Col span={12}>
                    <div style={{ fontSize: 10.5, color: subTextColor, marginBottom: 2 }}>关注领域</div>
                    <div style={{ fontSize: 13, color: textColor }}>{detail.focusArea}</div>
                  </Col>
                )}
                {detail.typicalTicket && (
                  <Col span={12}>
                    <div style={{ fontSize: 10.5, color: subTextColor, marginBottom: 2 }}>典型投资额度</div>
                    <div style={{ fontSize: 13, color: theme.accentColor, fontWeight: 700 }}>{detail.typicalTicket}</div>
                  </Col>
                )}
                {detail.investmentRange && (
                  <Col span={12}>
                    <div style={{ fontSize: 10.5, color: subTextColor, marginBottom: 2 }}>投资额度范围</div>
                    <div style={{ fontSize: 13, color: textColor }}>{detail.investmentRange}</div>
                  </Col>
                )}
                {detail.geographicFocus && (
                  <Col span={12}>
                    <div style={{ fontSize: 10.5, color: subTextColor, marginBottom: 2 }}>地域偏好</div>
                    <div style={{ fontSize: 13, color: textColor }}>{detail.geographicFocus}</div>
                  </Col>
                )}
              </Row>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* 简介 */}
            {detail.description && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentColor, marginBottom: 4 }}>
                  简介
                </div>
                <Paragraph style={{ fontSize: 13, color: textColor, lineHeight: 1.8, margin: 0 }}>
                  {detail.description}
                </Paragraph>
              </div>
            )}

            {/* 匹配理由 */}
            {detail.matchReason && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentColor, marginBottom: 4 }}>
                  匹配理由
                </div>
                <Paragraph style={{ fontSize: 13, color: textColor, lineHeight: 1.8, margin: 0 }}>
                  {detail.matchReason}
                </Paragraph>
              </div>
            )}

            {/* 接触建议 */}
            {detail.contactStrategy && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentColor, marginBottom: 4 }}>
                  接触建议
                </div>
                <Paragraph style={{ fontSize: 13, color: textColor, lineHeight: 1.8, margin: 0 }}>
                  {detail.contactStrategy}
                </Paragraph>
              </div>
            )}

            {/* API扩展信息 */}
            {detail.portfolio && detail.portfolio.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentColor, marginBottom: 4 }}>
                  投资组合 / 代表项目
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {detail.portfolio.map((p, i) => (
                    <Tag key={i} icon={<CheckCircleOutlined />} style={{ fontSize: 11 }}>
                      {p}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {detail.successCases && detail.successCases.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accentColor, marginBottom: 4 }}>
                  成功投资案例
                </div>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {detail.successCases.map((c, i) => (
                    <li key={i} style={{ fontSize: 12.5, color: textColor, lineHeight: 1.8 }}>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.contactInfo && (
              <div style={{
                padding: '10px 12px',
                background: `${theme.accentColor}08`,
                borderRadius: 8,
                border: `1px solid ${theme.accentColor}22`,
              }}>
                <div style={{ fontSize: 10.5, color: subTextColor, marginBottom: 2 }}>联系方式</div>
                <div style={{ fontSize: 13, color: theme.accentColor, fontWeight: 700 }}>
                  {detail.contactInfo}
                </div>
              </div>
            )}

            {/* API不可用提示 */}
            {!providerDetail && (
              <div style={{
                marginTop: 12, padding: '8px 10px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                borderRadius: 6, fontSize: 11, color: subTextColor, textAlign: 'center',
              }}>
                以上信息由AI生成 · 融资端API接入后将显示实时详细资料
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (providers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: subTextColor, fontFamily: SAGE_FONT_SERIF }}>
        暂无融资方推荐数据
      </div>
    );
  }

  return (
    <div>
      {/* 机构投资方 */}
      {institutions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          }}>
            <BankOutlined style={{ color: theme.chartColors[0], fontSize: 16 }} />
            <span style={{
              fontFamily: SAGE_FONT_SERIF, fontSize: 14, fontWeight: 700,
              color: textColor, letterSpacing: 1,
            }}>
              机构投资方
            </span>
            <Tag color="blue" style={{ fontSize: 10, fontFamily: SAGE_FONT_SERIF }}>
              {institutions.length} 家
            </Tag>
          </div>
          <Row gutter={[12, 12]}>
            {institutions.map((p, i) => renderCard(p, i))}
          </Row>
        </div>
      )}

      {/* 个人投资方 */}
      {individuals.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          }}>
            <UserOutlined style={{ color: theme.chartColors[2], fontSize: 16 }} />
            <span style={{
              fontFamily: SAGE_FONT_SERIF, fontSize: 14, fontWeight: 700,
              color: textColor, letterSpacing: 1,
            }}>
              个人投资方
            </span>
            <Tag color="purple" style={{ fontSize: 10, fontFamily: SAGE_FONT_SERIF }}>
              {individuals.length} 位
            </Tag>
          </div>
          <Row gutter={[12, 12]}>
            {individuals.map((p, i) => renderCard(p, i + institutions.length))}
          </Row>
        </div>
      )}

      {/* 详情弹窗 */}
      <Modal
        open={!!selectedProvider}
        onCancel={handleCloseModal}
        footer={null}
        width={520}
        title={
          selectedProvider && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {selectedProvider.type === 'institution'
                ? <BankOutlined style={{ color: theme.accentColor }} />
                : <UserOutlined style={{ color: theme.accentColor }} />}
              <span style={{ fontFamily: SAGE_FONT_SERIF }}>{selectedProvider.name}</span>
            </div>
          )
        }
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default FinancingCards;
