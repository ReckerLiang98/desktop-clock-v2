// ═══════════════════════════════════════════════════════════
//  常量与工具函数 — 时区列表、日期格式化
// ═══════════════════════════════════════════════════════════

/** 预设时区列表 — 17 个主要城市，offset 为相对 UTC 的秒数 */
export const TZ_LIST = [
  { name: '中国 (北京)', tz: 'Asia/Shanghai',       offset: 28800 },
  { name: '日本 (东京)', tz: 'Asia/Tokyo',           offset: 32400 },
  { name: '韩国 (首尔)', tz: 'Asia/Seoul',           offset: 32400 },
  { name: '新加坡',      tz: 'Asia/Singapore',       offset: 28800 },
  { name: '香港',        tz: 'Asia/Hong_Kong',       offset: 28800 },
  { name: '台北',        tz: 'Asia/Taipei',          offset: 28800 },
  { name: '曼谷',        tz: 'Asia/Bangkok',         offset: 25200 },
  { name: '印度 (孟买)',  tz: 'Asia/Kolkata',         offset: 19800 },
  { name: '迪拜',        tz: 'Asia/Dubai',            offset: 14400 },
  { name: '莫斯科',      tz: 'Europe/Moscow',         offset: 10800 },
  { name: '伦敦',        tz: 'Europe/London',         offset: 3600  },
  { name: '巴黎',        tz: 'Europe/Paris',          offset: 7200  },
  { name: '纽约',        tz: 'America/New_York',      offset: -14400 },
  { name: '芝加哥',      tz: 'America/Chicago',       offset: -18000 },
  { name: '洛杉矶',      tz: 'America/Los_Angeles',   offset: -25200 },
  { name: '悉尼',        tz: 'Australia/Sydney',      offset: 36000 },
  { name: '奥克兰',      tz: 'Pacific/Auckland',      offset: 43200 },
];

/** 星期名称（中文） */
export const WEEKDAY_NAMES = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

/**
 * 将 UTC 偏移秒数格式化为 UTC±HH:MM 字符串
 * 例如: 28800 → "UTC+08:00", -14400 → "UTC-04:00"
 */
export function formatOffset(sec) {
  const sign = sec >= 0 ? '+' : '-';
  const h = String(Math.floor(Math.abs(sec) / 3600)).padStart(2, '0');
  const m = String((Math.abs(sec) % 3600) / 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

/** 获取操作系统当前时区标识符（如 "Asia/Shanghai"） */
export function getSystemTZ() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch (_) { return 'Local'; }
}
