// ═══════════════════════════════════════════════════════════
//  SettingsDialog — 设置对话框
// ═══════════════════════════════════════════════════════════
//
// 提供可视化界面配置应用设置：
//   - 和风天气 API Key + API Host（气象预警功能所需）
//
// 点击遮罩区域可关闭对话框

import { useState } from 'react';

const KEY_STORAGE = 'clock_qweather_key_v2';
const HOST_STORAGE = 'clock_qweather_host_v2';
const DEFAULT_HOST = 'nr6pg9pdqr.re.qweatherapi.com';

export default function SettingsDialog({ onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '');
  const [apiHost, setApiHost] = useState(() => localStorage.getItem(HOST_STORAGE) || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey) {
      localStorage.setItem(KEY_STORAGE, trimmedKey);
    } else {
      localStorage.removeItem(KEY_STORAGE);
    }

    const trimmedHost = apiHost.trim();
    if (trimmedHost) {
      localStorage.setItem(HOST_STORAGE, trimmedHost);
    } else {
      localStorage.removeItem(HOST_STORAGE);
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

        {/* API Key */}
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
        </div>

        {/* API Host */}
        <div className="settings-field">
          <label className="settings-label" htmlFor="qweather-host">
            API Host
          </label>
          <input
            id="qweather-host"
            className="settings-input"
            type="text"
            value={apiHost}
            onChange={e => setApiHost(e.target.value)}
            placeholder={DEFAULT_HOST}
            spellCheck={false}
            autoComplete="off"
          />
          <p className="settings-hint">
            在控制台 → 设置 → API Host 获取，留空使用默认
          </p>
        </div>

        <p className="settings-hint" style={{ textAlign: 'center' }}>
          免费注册：
          <span
            className="settings-link"
            onClick={() => window.open('https://console.qweather.com', '_blank')}
          >
            console.qweather.com
          </span>
          &nbsp;· 每日 1000 次免费调用
        </p>

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
