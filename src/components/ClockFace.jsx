// ═══════════════════════════════════════════════════════════
//  ClockFace — 数字时钟主显示区域
// ═══════════════════════════════════════════════════════════
//
// 显示格式：
//   - 24h 模式：HH:MM:SS[.ms]
//   - 12h 模式：[上午/下午] HH:MM:SS[.ms]
// 使用等宽字体确保数字不发生宽度抖动，冒号有闪烁动画
// ampm 和 ms 区域始终保留布局空间（visibility 切换），防止窗口大小跳动
//
// props: time — 时间对象 { h, m, s, ms, ampm }
//         showMs — 是否显示毫秒

import { memo } from 'react';

function ClockFace({ time, showMs }) {
  return (
    <div className="time-row">
      {/* 12/24h 制式标识 — 始终渲染以保持布局宽度不变 */}
      <span className="ampm" style={{ visibility: time.ampm ? 'visible' : 'hidden' }}>
        {time.ampm || '上午'}
      </span>
      <span className="clock-time">
        {time.h}<span className="colon">:</span>{time.m}<span className="colon">:</span>{time.s}
      </span>
      {/* 毫秒显示 — 始终渲染以保持布局宽度不变 */}
      <span className="clock-ms" style={{ visibility: showMs ? 'visible' : 'hidden' }}>
        {time.ms}
      </span>
    </div>
  );
}

export default memo(ClockFace);
