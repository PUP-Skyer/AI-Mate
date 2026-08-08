/**
 * 青宸智汇 React 子应用 - 入口文件
 * 支持 qiankun 微前端和独立运行两种模式
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppProviders from './components/AppProviders';
import './index.css';
import './components/tools/tool-animations.css';

// ========== qiankun 子应用生命周期 ==========

let root: ReactDOM.Root | null = null;

/**
 * bootstrap - 只在微应用初始化时调用一次
 */
export async function bootstrap() {
  console.log('[青宸智汇 Chat] bootstrap');
}

/**
 * mount - 每次进入微应用时调用
 */
export async function mount(props: Record<string, unknown>) {
  console.log('[青宸智汇 Chat] mount', props);

  const container = (props.container as HTMLElement) || document.getElementById('root');
  if (!container) {
    console.error('[青宸智汇 Chat] mount failed: container not found');
    return;
  }

  // 创建挂载点
  let mountNode = container.querySelector('#ai-chat-root');
  if (!mountNode) {
    mountNode = document.createElement('div');
    mountNode.id = 'ai-chat-root';
    container.appendChild(mountNode);
  }

  root = ReactDOM.createRoot(mountNode);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  );
}

/**
 * unmount - 每次离开微应用时调用
 */
export async function unmount() {
  console.log('[青宸智汇 Chat] unmount');
  if (root) {
    root.unmount();
    root = null;
  }

  // 清理挂载点
  const mountNode = document.getElementById('ai-chat-root');
  if (mountNode) {
    mountNode.remove();
  }
}

/**
 * update - 可选，主应用更新时调用
 */
export async function update(props: Record<string, unknown>) {
  console.log('[青宸智汇 Chat] update', props);
}

// ========== 独立运行模式 ==========
// 当不在 qiankun 环境中时，直接挂载到 #root
if (!(window as unknown as Record<string, unknown>).__POWERED_BY_QIANKUN__) {
  const rootNode = document.getElementById('root');
  if (rootNode) {
    root = ReactDOM.createRoot(rootNode);
    root.render(
      <React.StrictMode>
        <AppProviders>
          <App />
        </AppProviders>
      </React.StrictMode>
    );
  }
}
