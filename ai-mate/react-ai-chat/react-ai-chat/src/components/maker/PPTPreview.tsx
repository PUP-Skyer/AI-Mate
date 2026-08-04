/**
 * 工匠AI - HTML PPT 应用内预览组件
 * 用 antd Modal + iframe 内联渲染 PPT，避免 window.open 弹窗拦截与沙箱问题
 */
import React, { useState, useMemo } from 'react';
import { Modal, Button, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, FilePptOutlined, FullscreenOutlined } from '@ant-design/icons';
import { MAKER_FONT_SERIF, type MakerTheme } from './maker-theme';
import { generateHTMLPPT, downloadHTMLPPT } from './maker-ppt';

interface PPTPreviewProps {
  title: string;
  markdown: string;
  mTheme: MakerTheme;
  isDark: boolean;
}

const PPTPreview: React.FC<PPTPreviewProps> = ({ title, markdown, mTheme, isDark }) => {
  const [open, setOpen] = useState(false);
  const html = useMemo(() => generateHTMLPPT(title, markdown), [title, markdown]);

  return (
    <>
      <Space>
        <Tooltip title="应用内预览，方向键翻页">
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => setOpen(true)}
            style={{
              color: mTheme.sealColor,
              borderColor: mTheme.sealColor,
              fontFamily: MAKER_FONT_SERIF,
              fontSize: 12.5,
            }}
          >
            预览 PPT
          </Button>
        </Tooltip>
        <Button
          type="primary"
          icon={<FilePptOutlined />}
          onClick={() => downloadHTMLPPT(title, markdown)}
          style={{
            background: mTheme.sealColor,
            border: 'none',
            borderRadius: 8,
            fontFamily: MAKER_FONT_SERIF,
            fontSize: 12.5,
          }}
        >
          下载 HTML PPT
        </Button>
      </Space>

      {/* 应用内预览弹窗 */}
      <Modal
        title={
          <span style={{ fontFamily: MAKER_FONT_SERIF, fontSize: 14, fontWeight: 700 }}>
            <FullscreenOutlined style={{ marginRight: 8, color: mTheme.accentColor }} />
            {title} — 预览（← → 方向键翻页 · F 全屏）
          </span>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width="min(1080px, 96vw)"
        styles={{ body: { padding: 0, height: '70vh' } }}
        destroyOnClose
      >
        <iframe
          title={`${title}-preview`}
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '0 0 8px 8px',
            background: '#111827',
          }}
        />
      </Modal>
    </>
  );
};

export default PPTPreview;
