/**
 * 全局 Providers：antd 国际化 + 主题算法
 * 语言/主题来自 aiStore.settings，切换即时生效
 */
import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useAIStore } from '../store/aiStore';

const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = useAIStore((s) => s.settings);
  const isDark = settings.theme === 'dark';
  const isEn = settings.language === 'en';

  // 同步 dayjs locale（时间显示语言）
  React.useEffect(() => {
    dayjs.locale(isEn ? 'en' : 'zh-cn');
  }, [isEn]);

  return (
    <ConfigProvider
      locale={isEn ? enUS : zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AppProviders;
