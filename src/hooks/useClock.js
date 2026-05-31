import { useState, useEffect, useRef } from 'react';
import { solarToLunar, SHENGXIAO_EMOJI, isSolarTermDay, getHoliday } from '../utils/lunar';
import { WEEKDAY_NAMES } from '../utils/constants';

function getPeriod(h) {
  if (h < 6) return '凌晨';
  if (h < 9) return '早上';
  if (h < 12) return '上午';
  if (h < 13) return '中午';
  if (h < 18) return '下午';
  if (h < 19) return '傍晚';
  return '晚上';
}

export function useClock({ offset, tzOffset, is24, showMs }) {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00', ms: '000', ampm: '' });
  const [date, setDate] = useState({ dateStr: '', weekday: '', lunar: '', solarTerm: '', holiday: '' });

  const lastSecondRef = useRef(-1);

  const is24Ref = useRef(is24);
  is24Ref.current = is24;
  const showMsRef = useRef(showMs);
  showMsRef.current = showMs;

  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const tzOffsetRef = useRef(tzOffset);
  tzOffsetRef.current = tzOffset;

  useEffect(() => {
    function tick() {
      const corrUTC = Date.now() + offsetRef.current;
      const localMs = corrUTC + tzOffsetRef.current * 1000;
      const d = new Date(localMs);

      let h = d.getUTCHours(), m = d.getUTCMinutes(), s = d.getUTCSeconds(), ms = d.getUTCMilliseconds();

      const secKey = h * 3600 + m * 60 + s;
      if (secKey !== lastSecondRef.current) {
        lastSecondRef.current = secKey;

        let ampm = '';
        let displayH = h;
        if (!is24Ref.current) {
          ampm = getPeriod(h);
          displayH = h % 12 || 12;
        }

        setTime({
          h: String(displayH).padStart(2, '0'),
          m: String(m).padStart(2, '0'),
          s: String(s).padStart(2, '0'),
          ms: '.' + String(ms).padStart(3, '0'),
          ampm,
        });

        const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1, day = d.getUTCDate();
        const dateStr = `${y}年${mo}月${day}日`;
        const weekday = WEEKDAY_NAMES[d.getUTCDay()];
        const lu = solarToLunar(y, mo, day);
        const lunar = lu ? `农历 ${lu.yearName}年(${lu.shengxiao}${SHENGXIAO_EMOJI[lu.shengxiao] || ''}) ${lu.monthName}${lu.dayName}` : '';
        const solarTerm = isSolarTermDay(y, mo, day) || '';
        const holiday = getHoliday(y, mo, day, lu);

        setDate({ dateStr, weekday, lunar, solarTerm, holiday });
      } else if (showMsRef.current) {
        setTime(prev => ({
          ...prev,
          ms: '.' + String(ms).padStart(3, '0'),
        }));
      }
    }

    tick();
    const id = setInterval(tick, 33);
    return () => clearInterval(id);
  }, []);

  return { time, date };
}
