/**
 * Sage（军师）AI 员工 - 主应用组件
 * React Router 路由管理（HashRouter 兼容 qiankun 微前端）
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BPTemplateList from './pages/BPTemplateList';
import BPEditor from './pages/BPEditor';
import BPPreview from './pages/BPPreview';
import AIReview from './pages/AIReview';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/templates" replace />} />
        <Route path="/templates" element={<BPTemplateList />} />
        <Route path="/editor/:id?" element={<BPEditor />} />
        <Route path="/preview/:id" element={<BPPreview />} />
        <Route path="/review/:id" element={<AIReview />} />
        <Route path="*" element={<Navigate to="/templates" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
