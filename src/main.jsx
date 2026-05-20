// ═══════════════════════════════════════════════════════════
//  React 应用入口 — 挂载根组件到 DOM
// ═══════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// 使用 React 18 的 createRoot API 渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
