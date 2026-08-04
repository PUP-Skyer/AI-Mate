/**
 * 用户画像锁定 - 标签式输入
 * 四类预置维度（年龄/场景/预算/聚集地）+ 自定义，均可增删标签
 */
import React, { useState } from 'react';
import { Tag, Input, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { PERSONA_FIELDS, type PersonaData } from './bmc-utils';

interface PersonaTagsProps {
  value: PersonaData;
  onChange: (next: PersonaData) => void;
  theme: SageTheme;
  isDark: boolean;
}

const PersonaTags: React.FC<PersonaTagsProps> = ({ value, onChange, theme, isDark }) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const addTag = (field: string) => {
    const text = (drafts[field] || '').trim();
    if (!text) return;
    const list = value[field as keyof PersonaData] || [];
    const next = list.includes(text) ? list : [...list, text];
    onChange({ ...value, [field]: next });
    setDrafts((d) => ({ ...d, [field]: '' }));
  };

  const removeTag = (field: string, tag: string) => {
    onChange({
      ...value,
      [field]: (value[field as keyof PersonaData] || []).filter((t) => t !== tag),
    });
  };

  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {PERSONA_FIELDS.map((f) => {
        const tags = value[f.key] || [];
        return (
          <div key={f.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: SAGE_FONT_SERIF, fontSize: 12.5, color: textColor, width: 56, flexShrink: 0 }}>
                {f.label}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                {tags.map((t) => (
                  <Tag
                    key={t}
                    closable
                    onClose={() => removeTag(f.key, t)}
                    style={{
                      fontFamily: SAGE_FONT_SERIF, fontSize: 12, borderRadius: 4,
                      background: `${theme.accentColor}14`, borderColor: `${theme.accentColor}55`,
                      color: textColor, marginInlineEnd: 0,
                    }}
                  >
                    {t}
                  </Tag>
                ))}
                {tags.length === 0 && (
                  <span style={{ fontSize: 11, color: textColor, opacity: 0.35, fontFamily: SAGE_FONT_SERIF }}>
                    {f.suggestions?.length ? `建议：${f.suggestions.join(' / ')}` : '尚未锁定'}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 64 }}>
              <Input
                size="small"
                value={drafts[f.key] || ''}
                placeholder={f.placeholder}
                onChange={(e) => setDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                onPressEnter={() => addTag(f.key)}
                onBlur={() => addTag(f.key)}
                style={{
                  flex: 1, background: isDark ? theme.surfaceDark : '#fff',
                  borderColor, color: textColor, fontFamily: SAGE_FONT_SERIF, borderRadius: 6,
                }}
              />
              <Tooltip title="添加">
                <span
                  onClick={() => addTag(f.key)}
                  style={{ cursor: 'pointer', color: theme.accentColor, display: 'flex', alignItems: 'center' }}
                >
                  <PlusOutlined />
                </span>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonaTags;
