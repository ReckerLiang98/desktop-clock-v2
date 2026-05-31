// ═══════════════════════════════════════════════════════════
//  TitleBar — 窗口标题栏
// ═══════════════════════════════════════════════════════════
//
// 固定在窗口顶部的自定义标题栏，包含：
//   - 应用名称标签
//   - 窗口置顶按钮
//   - 最小化按钮
//   - 关闭按钮（悬停变红）
// 整个标题栏区域可拖拽移动窗口（-webkit-app-region: drag）

import { memo } from 'react';

function TitleBar({ topEnabled, onMinimize, onToggleTop, onClose }) {
  return (
    <div className="title-bar">
      <span className="title-label">桌面时钟</span>
      <div className="win-btns">
        {/* 窗口置顶切换 */}
        <button className={'win-btn' + (topEnabled ? ' on' : '')} onClick={onToggleTop} title="窗口置顶">
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path d="M3 2h10v1.5H3z" fill="currentColor"/>
            <path d="M8 3.5l-4 6h8z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="6" y="10" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.5"/>
          </svg>
        </button>
        {/* 最小化按钮 */}
        <button className="win-btn" onClick={onMinimize} title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect y="5.5" width="12" height="1" fill="currentColor"/>
          </svg>
        </button>
        {/* 关闭按钮（红色悬停） */}
        <button className="win-btn close" onClick={onClose} title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(TitleBar);
