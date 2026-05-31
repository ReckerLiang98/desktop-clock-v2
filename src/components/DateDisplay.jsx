// ═══════════════════════════════════════════════════════════
//  DateDisplay — 日期信息展示区
// ═══════════════════════════════════════════════════════════
//
// 展示六行信息：
//   1. 公历日期 — "2026年5月20日"
//   2. 星期 — "星期三"
//   3. 农历 — "农历 丙午年(马) 四月廿四"（金色）
//   4. 节气 — "小满"（当前节气，绿色）
//   5. 节日 — "端午节"（仅节日当天显示）
//   6. 时区 — "时区: 上海 (UTC+08:00) [IP]"（可点击展开时区菜单）
//
// 通过 children 插槽接收 TimezoneMenu，使其相对于 date-block 定位

import { memo } from 'react';
import { formatOffset } from '../utils/constants';

function DateDisplay({ date, tz, tzManual, onTZClick, children }) {
  return (
    <div className="date-block" style={{ position: 'relative' }}>
      <div className="date-text">{date.dateStr}</div>
      <div className="weekday">{date.weekday}</div>
      <div className="lunar">{date.lunar}</div>
      {date.holiday ? (
        <div className="holiday">🎉 {date.holiday}</div>
      ) : date.solarTerm ? (
        <div className="solar-term">{date.solarTerm}</div>
      ) : null}
      <div className="tz" onClick={onTZClick} title="点击切换时区">
        时区: {tz.name} ({formatOffset(tz.offset)}){tzManual ? ' [手动]' : ' [IP]'}
      </div>
      {/* 时区选择菜单插槽，由父组件控制显隐 */}
      {children}
    </div>
  );
}

export default memo(DateDisplay);
