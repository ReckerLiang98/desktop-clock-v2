// ═══════════════════════════════════════════════════════════
//  TimezoneMenu — 时区选择下拉菜单
// ═══════════════════════════════════════════════════════════
//
// 列出 17 个预设城市时区 + IP自动检测选项
//   - 当前选中的时区以强调色高亮（预设列表中高亮，自动检测区域也标注）
//   - 显示当前 IP 自动检测到的具体时区名称
//   - 点击菜单外部自动关闭
//   - 选择时区后立即生效并保存到 localStorage

import { useEffect, useLayoutEffect, useRef } from 'react';
import { formatOffset } from '../utils/constants';

export default function TimezoneMenu({ tzList, currentOffset, autoTz, isAuto, onSelect, onAuto, onClose }) {
  const ref = useRef(null);

  // 动态调整 max-height，确保菜单不超出视口边界
  // useLayoutEffect 在 DOM 更新后、浏览器绘制前同步执行，无闪烁
  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const menuTop = menu.getBoundingClientRect().top;
    const available = window.innerHeight - menuTop - 12;
    menu.style.maxHeight = Math.max(100, Math.min(600, available)) + 'px';
  }, []);

  // 点击菜单外部区域自动关闭
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="tz-menu">
      <div className="tz-menu-header">选择时区</div>
      {/* 17 个预设城市时区 */}
      {tzList.map(t => (
        <div
          key={t.tz}
          className={'tz-opt' + (!isAuto && t.offset === currentOffset ? ' active' : '')}
          onClick={() => onSelect({ name: t.name, offset: t.offset, tz: t.tz })}
        >
          {t.name} · {formatOffset(t.offset)}
        </div>
      ))}
      <div className="tz-menu-divider" />
      {/* IP 自动检测选项 — 显示当前检测到的时区信息 */}
      <div
        className={'tz-opt' + (isAuto ? ' active' : '')}
        onClick={onAuto}
      >
        🔄 IP自动检测
        {autoTz && (
          <span className="tz-auto-info"> · {autoTz.name} ({formatOffset(autoTz.offset)})</span>
        )}
      </div>
    </div>
  );
}
