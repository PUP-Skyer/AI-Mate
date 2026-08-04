/**
 * 工匠 Maker - 主应用组件
 * React Router 路由管理
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CollabSpace from './pages/CollabSpace';
import CollabEditor from './pages/CollabEditor';
import TaskBoard from './pages/TaskBoard';

const App: React.FC = () => {
  return (
    <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/collab' : '/'}>
      <Routes>
        <Route path="/" element={<CollabSpace />} />
        <Route path="/editor" element={<CollabEditor />} />
        <Route path="/editor/:id" element={<CollabEditor />} />
        <Route path="/tasks" element={<TaskBoard />} />
        <Route path="/tasks/:id" element={<TaskBoard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
