// ═══════════════════════════════════════════════════════════
//  SettingsDialog — 设置对话框
// ═══════════════════════════════════════════════════════════
//
// 提供可视化界面配置应用设置：
//   - 和风天气 API Key（气象预警功能所需）
//
// 点击遮罩区域可关闭对话框

import { useState } from 'react';

const STORAGE_KEY = 'clock_qweather_key_v2';

export default function SettingsDialog({ onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSaved(true);
    // 短暂显示"已保存"后自动关闭
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="overlay" onClick={onClose}>
      {/* 阻止事件冒泡，防止点击对话框内部也触发关闭 */}
      <div className="dialog settings-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">设置</div>

        {/* API Key 输入区 */}
        <div className="settings-field">
          <label className="settings-label" htmlFor="qweather-key">
            和风天气 API Key
          </label>
          <div className="settings-input-row">
            <input
              id="qweather-key"
              className="settings-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="填入 Key 以启用气象预警"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              className="settings-toggle-btn"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? '隐藏' : '显示'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="settings-hint">
            免费注册：
            <span
              className="settings-link"
              onClick={() => window.open('https://console.qweather.com', '_blank')}
            >
              console.qweather.com
            </span>
            &nbsp;· 每日 1000 次免费调用
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="dialog-btns">
          <button className="dialog-btn" onClick={onClose}>取消</button>
          <button className="dialog-btn primary" onClick={handleSave}>
            {saved ? '✅ 已保存' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
