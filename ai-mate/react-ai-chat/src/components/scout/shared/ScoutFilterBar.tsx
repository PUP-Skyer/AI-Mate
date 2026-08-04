/**
 * Scout 通用筛选工具栏组件
 */
import React from 'react';
import { Select, Button, Row, Col } from 'antd';
import { useTheme } from '../../../contexts/ThemeContext';
import { panelThemes } from './scout-panel-theme';

interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

interface FilterField {
  key: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  span?: number;
}

interface ScoutFilterBarProps {
  fields: FilterField[];
  primaryAction: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    activeLabel?: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  };
  themeKey?: string;
}

const ScoutFilterBar: React.FC<ScoutFilterBarProps> = ({
  fields,
  primaryAction,
  secondaryAction,
  themeKey = 'market',
}) => {
  const { isDarkMode } = useTheme();
  const theme = panelThemes[themeKey] || panelThemes.market;

  const totalSpan = fields.reduce((sum, f) => sum + (f.span || Math.floor(24 / fields.length)), 0);

  return (
    <div style={{ padding: '16px 16px 12px' }}>
      <Row gutter={10}>
        {fields.map((field) => (
          <Col span={field.span || Math.floor(24 / fields.length)} key={field.key}>
            <Select
              placeholder={field.placeholder}
              value={field.value}
              onChange={field.onChange}
              style={{ width: '100%', borderRadius: 8 }}
              size="large"
            >
              {field.options.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ))}
      </Row>
      <Row gutter={10} style={{ marginTop: 10 }}>
        <Col span={secondaryAction ? 12 : 24}>
          <Button
            type="primary"
            icon={primaryAction.icon}
            onClick={primaryAction.onClick}
            loading={primaryAction.loading}
            block
            size="large"
            style={{
              borderRadius: 8,
              height: 44,
              background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentDark})`,
              border: 'none',
              fontWeight: 600,
            }}
          >
            {primaryAction.label}
          </Button>
        </Col>
        {secondaryAction && (
          <Col span={12}>
            <Button
              type={secondaryAction.isActive ? 'primary' : 'default'}
              icon={secondaryAction.isActive ? (secondaryAction.activeIcon || secondaryAction.icon) : secondaryAction.icon}
              onClick={secondaryAction.onClick}
              block
              size="large"
              style={{
                borderRadius: 8,
                height: 44,
                background: secondaryAction.isActive ? 'linear-gradient(135deg, #10B981, #047857)' : undefined,
                borderColor: secondaryAction.isActive ? '#10B981' : undefined,
                color: secondaryAction.isActive ? '#fff' : undefined,
                fontWeight: 600,
              }}
            >
              {secondaryAction.isActive ? (secondaryAction.activeLabel || secondaryAction.label) : secondaryAction.label}
            </Button>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ScoutFilterBar;
