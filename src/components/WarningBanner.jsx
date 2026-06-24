// ═══════════════════════════════════════════════════════════
//  WarningBanner — 中国气象预警信号展示
// ═══════════════════════════════════════════════════════════
//
// 显示当前生效中的气象预警信息，按照中国四色预警等级（蓝/黄/橙/红）
// 进行颜色编码。多条预警时垂直堆叠显示。
//
// 数据来源：和风天气 Weather Alert v1 API（devapi.qweather.com）

import { memo } from 'react';
import { WARNING_SEVERITY } from '../services/api';

/**
 * 格式化时间范围显示
 * 输入 ISO 时间字符串，输出 "MM-DD HH:mm" 格式的短时间
 */
function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${M}-${D} ${h}:${m}`;
  } catch (_) { return ''; }
}

function WarningBanner({ warnings, loading }) {
  // 无预警数据时不渲染任何内容，不占用布局空间
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="warning-banner">
      {warnings.map((w) => {
        const sev = WARNING_SEVERITY[w.color] || WARNING_SEVERITY.blue;
        const effective = formatTime(w.effectiveTime);
        const expire = formatTime(w.expireTime);
        const timeStr = effective && expire ? `${effective} ~ ${expire}` : '';

        return (
          <div
            key={w.id}
            className="warning-item"
            style={{ borderLeftColor: sev.color }}
            title={w.description || w.headline}
          >
            {/* 等级颜色圆点 */}
            <span
              className="warning-dot"
              style={{ backgroundColor: sev.color }}
            />
            {/* 预警类型 + 标题 */}
            <span className="warning-headline">
              {w.typeName && <span className="warning-type">{w.typeName}</span>}
              {w.headline}
            </span>
            {/* 有效时间范围 */}
            {timeStr && <span className="warning-time">{timeStr}</span>}
          </div>
        );
      })}
      {/* 加载指示器（刷新中显示） */}
      {loading && <span className="warning-loading">⏳</span>}
    </div>
  );
}

export default memo(WarningBanner);
