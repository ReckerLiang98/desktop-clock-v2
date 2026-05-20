// ═══════════════════════════════════════════════════════════
//  CloseDialog — 关闭确认对话框
// ═══════════════════════════════════════════════════════════
//
// 点击关闭按钮时弹出，提供两个选项：
//   - "后台运行" — 隐藏到系统托盘，双击托盘图标恢复
//   - "退出应用" — 直接退出程序
//   - "不再弹窗" — 记住本次选择，下次关闭直接执行
//
// 点击遮罩区域可取消对话框

import { useState } from 'react';

export default function CloseDialog({ onHideToTray, onQuit, onCancel }) {
  const [noPrompt, setNoPrompt] = useState(false);

  return (
    <div className="overlay" onClick={onCancel}>
      {/* 阻止事件冒泡，防止点击对话框内部也触发取消 */}
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-title">关闭桌面时钟</div>
        <div className="dialog-btns">
          <button className="dialog-btn" onClick={() => onHideToTray(noPrompt)}>
            后台运行
          </button>
          <button className="dialog-btn primary" onClick={() => onQuit(noPrompt)}>
            退出应用
          </button>
        </div>
        <label className="dialog-check">
          <input type="checkbox" checked={noPrompt} onChange={e => setNoPrompt(e.target.checked)} />
          不再提醒
        </label>
      </div>
    </div>
  );
}
