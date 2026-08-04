/**
 * 协作编辑器 - qiankun 子应用入口文件
 * 支持 qiankun 微前端和独立运行两种模式
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ========== qiankun 子应用生命周期 ==========

let root: ReactDOM.Root | null = null;

/**
 * bootstrap - 只在微应用初始化时调用一次
 */
export async function bootstrap() {
  console.log('[Collab] bootstrap');
}

/**
 * mount - 每次进入微应用时调用
 */
export async function mount(props: Record<string, unknown>) {
  console.log('[Collab] mount', props);

  const container = (props.container as HTMLElement) || document.getElementById('root');
  if (!container) {
    console.error('[Collab] mount failed: container not found');
    return;
  }

  let mountNode = container.querySelector('#collab-root');
  if (!mountNode) {
    mountNode = document.createElement('div');
    mountNode.id = 'collab-root';
    container.appendChild(mountNode);
  }

  root = ReactDOM.createRoot(mountNode);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

/**
 * unmount - 每次离开微应用时调用
 */
export async function unmount() {
  console.log('[Collab] unmount');
  if (root) {
    root.unmount();
    root = null;
  }

  const mountNode = document.getElementById('collab-root');
  if (mountNode) {
    mountNode.remove();
  }
}

/**
 * update - 可选，主应用更新时调用
 */
export async function update(props: Record<string, unknown>) {
  console.log('[Collab] update', props);
}

// ========== 独立运行模式 ==========
if (!(window as unknown as Record<string, unknown>).__POWERED_BY_QIANKUN__) {
  const rootNode = document.getElementById('root');
  if (rootNode) {
    root = ReactDOM.createRoot(rootNode);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}
