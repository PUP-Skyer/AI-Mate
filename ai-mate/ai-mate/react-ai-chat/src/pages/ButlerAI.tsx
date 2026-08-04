/**
 * 管家AI (ButlerAI) - 客户服务
 */

import React from 'react';
import { CustomerServiceOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import ChatLayout from '../components/ChatLayout';

const ButlerAI: React.FC = () => {
  const menuItems: MenuProps['items'] = [
    { key: 'faq', label: '常见问题解答' },
    { key: 'guide', label: '新手使用引导' },
    { key: 'feedback', label: '问题反馈提交' },
    { key: 'aftercare', label: '售后服务咨询' },
    { key: 'account', label: '账户问题处理' },
  ];

  return (
    <ChatLayout
      role="butler"
      title="管家AI"
      icon={<CustomerServiceOutlined />}
      description="客户服务管家 - 贴心专业的服务支持"
      menuItems={menuItems}
    />
  );
};

export default ButlerAI;
