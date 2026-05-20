// ═══════════════════════════════════════════════════════════
//  useClock — 时钟刷新 Hook
// ═══════════════════════════════════════════════════════════
//
// 核心时钟引擎：
//   - 以 ~30fps (33ms) 刷新毫秒显示
//   - 仅在秒变化时更新 React 状态（减少不必要的重渲染）
//   - 支持网络时间偏移、时区偏移、12/24 小时制切换
//   - is24 通过 ref 读取，切换制式时无需重启定时器，无延迟

import { useState, useEffect, useRef } from 'react';
import { solarToLunar, SHENGXIAO_EMOJI, getCurrentSolarTerm, isSolarTermDay, getHoliday } from '../utils/lunar';
import { WEEKDAY_NAMES } from '../utils/constants';

/** 将小时数映射到中文时段：凌晨/早上/上午/中午/下午/傍晚/晚上 */
function getPeriod(h) {
  if (h < 6) return '凌晨';
  if (h < 9) return '早上';
  if (h < 12) return '上午';
  if (h < 13) return '中午';
  if (h < 18) return '下午';
  if (h < 19) return '傍晚';
  return '晚上';
}

export function useClock({ offset, tzOffset, is24 }) {
  // 时间显示状态（时、分、秒、毫秒、上/下午标识）
  const [time, setTime] = useState({ h: '00', m: '00', s: '00', ms: '000', ampm: '' });

  // 日期显示状态（公历、星期、农历、节气、节日）
  const [date, setDate] = useState({ dateStr: '', weekday: '', lunar: '', solarTerm: '', holiday: '' });

  // 上次更新的秒标识，用于判断是否需要刷新日期等内容
  const lastSecondRef = useRef(-1);

  // 通过 ref 保持 is24 的最新值，避免切换制式时重建定时器
  const is24Ref = useRef(is24);
  is24Ref.current = is24;

  // offset 和 tzOffset 也用 ref 保持，避免网络同步时重建定时器
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const tzOffsetRef = useRef(tzOffset);
  tzOffsetRef.current = tzOffset;

  useEffect(() => {
    /**
     * 每一帧（~33ms）执行的核心时钟 tick
     *
     * 计算流程：
     *   本地时间 + 网络偏移 = 精确UTC → + 时区偏移 = 目标时区时间 → 显示
     */
    function tick() {
      const corrUTC = Date.now() + offsetRef.current;   // 网络修正后的 UTC 时间
      const localMs = corrUTC + tzOffsetRef.current * 1000;  // 加上时区偏移
      const d = new Date(localMs);

      let h = d.getUTCHours(), m = d.getUTCMinutes(), s = d.getUTCSeconds(), ms = d.getUTCMilliseconds();

      // 通过秒级标识判断是否需要更新日期和农历（避免每 33ms 都计算农历）
      const secKey = h * 3600 + m * 60 + s;
      if (secKey !== lastSecondRef.current) {
        lastSecondRef.current = secKey;

        // 12 小时制转换（从 ref 读取最新值，无延迟）
        let ampm = '';
        let displayH = h;
        if (!is24Ref.current) {
          ampm = getPeriod(h);
          displayH = h % 12 || 12;  // 0 点显示为 12
        }

        setTime({
          h: String(displayH).padStart(2, '0'),
          m: String(m).padStart(2, '0'),
          s: String(s).padStart(2, '0'),
          ms: '.' + String(ms).padStart(3, '0'),
          ampm,
        });

        // 更新公历日期和农历
        const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, day = d.getUTCDate();
        const dateStr = `${y}年${mo}月${day}日`;
        const weekday = WEEKDAY_NAMES[d.getUTCDay()];
        const lu = solarToLunar(y, mo, day);
        const lunar = lu ? `农历 ${lu.yearName}年(${lu.shengxiao}${SHENGXIAO_EMOJI[lu.shengxiao] || ''}) ${lu.monthName}${lu.dayName}` : '';
        const solarTerm = getCurrentSolarTerm(y, mo, day);
        const holiday = getHoliday(y, mo, day, lu);

        setDate({ dateStr, weekday, lunar, solarTerm, holiday });
      } else {
        // 秒未变化时，仅更新毫秒部分（避免不必要的 re-render）
        setTime(prev => ({
          ...prev,
          ms: '.' + String(ms).padStart(3, '0'),
        }));
      }
    }

    tick();  // 立即执行第一次
    const id = setInterval(tick, 33);  // 约 30fps
    return () => clearInterval(id);
  }, []);  // 空依赖数组：定时器只创建一次，所有动态值通过 ref 读取

  return { time, date };
}
