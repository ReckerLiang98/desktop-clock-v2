// ═══════════════════════════════════════════════════════════
//  Toolbar — 底部工具栏
// ═══════════════════════════════════════════════════════════
//
// 四个按钮：
//   - 12h/24h 格式切换（激活时高亮）
//   - 毫秒显示切换（激活时高亮）
//   - 主题切换（深色/浅色/跟随系统，用图标表示当前状态）
//   - 手动同步网络时间

export default function Toolbar({ is24, showMs, themeMode, onToggle24, onToggleMs, onCycleTheme, onSync }) {
  const themeIcon = themeMode === 'dark'
    ? '🌙' : themeMode === 'light'
    ? '☀️' : '🔄';

  const themeLabel = themeMode === 'dark'
    ? '深色' : themeMode === 'light'
    ? '浅色' : '跟随系统';

  return (
    <div className="toolbar">
      {/* 12/24 小时制切换 */}
      <button className={'btn' + (!is24 ? ' on' : '')} onClick={onToggle24} title="切换12/24小时制 (F)">
        12h
      </button>

      {/* 毫秒显示切换 */}
      <button className={'btn' + (showMs ? ' on' : '')} onClick={onToggleMs} title="显示/隐藏毫秒 (M)">
        .ms
      </button>

      {/* 主题循环切换 */}
      <button className="btn theme-btn" onClick={onCycleTheme} title={`当前: ${themeLabel} (T)`}>
        {themeIcon}
      </button>

      {/* 手动同步网络时间 */}
      <button className="btn" onClick={onSync} title="同步网络时间 (R)">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M2 8a6 6 0 0 1 10.5-4" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <polyline points="13 2 12.5 4 14.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M14 8a6 6 0 0 1-10.5 4" fill="none" stroke="currentColor" strokeWidth="1.2"/>
          <polyline points="3 14 3.5 12 1.5 11.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </button>
    </div>
  );
}
