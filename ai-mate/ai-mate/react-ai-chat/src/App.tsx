/**
 * 青宸智汇 Chat - 主应用组件
 * 简单的 Hash 路由，支持四大AI角色页面切换
 */

import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  SearchOutlined,
  BulbOutlined,
  ToolOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import ScoutAI from './pages/ScoutAI';
import SageAI from './pages/SageAI';
import MakerAI from './pages/MakerAI';
import ButlerAI from './pages/ButlerAI';

const { Header, Content } = Layout;
const { Title } = Typography;

type PageKey = 'scout' | 'sage' | 'maker' | 'butler';

const menuConfig = [
  { key: 'scout', label: '探路者AI', icon: <SearchOutlined />, description: '资源对接' },
  { key: 'sage', label: '军师AI', icon: <BulbOutlined />, description: '运营策略' },
  { key: 'maker', label: '工匠AI', icon: <ToolOutlined />, description: '内容生成' },
  { key: 'butler', label: '管家AI', icon: <CustomerServiceOutlined />, description: '客户服务' },
];

const pageComponents: Record<PageKey, React.FC> = {
  scout: ScoutAI,
  sage: SageAI,
  maker: MakerAI,
  butler: ButlerAI,
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('scout');

  const PageComponent = pageComponents[currentPage];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Title level={4} style={{ margin: '0 24px 0 0', whiteSpace: 'nowrap' }}>
          青宸智汇
        </Title>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          onClick={({ key }) => setCurrentPage(key as PageKey)}
          items={menuConfig.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          style={{ flex: 1, border: 'none' }}
        />
      </Header>
      <Content style={{ background: '#f5f5f5' }}>
        <PageComponent />
      </Content>
    </Layout>
  );
};

export default App;
