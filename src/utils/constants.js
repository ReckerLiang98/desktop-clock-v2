// ═══════════════════════════════════════════════════════════
//  常量与工具函数 — 时区列表、日期格式化
// ═══════════════════════════════════════════════════════════

/** 预设时区列表 — 覆盖全球主要城市，offset 为相对 UTC 的秒数 */
export const TZ_LIST = [
  // 东亚
  { name: '中国 (北京)',    tz: 'Asia/Shanghai',       offset: 28800 },
  { name: '日本 (东京)',    tz: 'Asia/Tokyo',           offset: 32400 },
  { name: '韩国 (首尔)',    tz: 'Asia/Seoul',           offset: 32400 },
  { name: '台北',           tz: 'Asia/Taipei',          offset: 28800 },
  { name: '香港',           tz: 'Asia/Hong_Kong',       offset: 28800 },
  { name: '乌兰巴托',       tz: 'Asia/Ulaanbaatar',    offset: 28800 },
  // 东南亚
  { name: '新加坡',         tz: 'Asia/Singapore',       offset: 28800 },
  { name: '吉隆坡',         tz: 'Asia/Kuala_Lumpur',   offset: 28800 },
  { name: '马尼拉',         tz: 'Asia/Manila',          offset: 28800 },
  { name: '雅加达',         tz: 'Asia/Jakarta',         offset: 25200 },
  { name: '曼谷',           tz: 'Asia/Bangkok',         offset: 25200 },
  { name: '河内',           tz: 'Asia/Ho_Chi_Minh',    offset: 25200 },
  // 南亚 / 中亚
  { name: '印度 (孟买)',    tz: 'Asia/Kolkata',         offset: 19800 },
  { name: '巴基斯坦 (卡拉奇)', tz: 'Asia/Karachi',      offset: 18000 },
  { name: '达卡',           tz: 'Asia/Dhaka',           offset: 21600 },
  { name: '加德满都',       tz: 'Asia/Kathmandu',       offset: 20700 },
  { name: '仰光',           tz: 'Asia/Yangon',          offset: 23400 },
  { name: '塔什干',         tz: 'Asia/Tashkent',        offset: 18000 },
  // 中东
  { name: '迪拜',           tz: 'Asia/Dubai',            offset: 14400 },
  { name: '德黑兰',         tz: 'Asia/Tehran',          offset: 12600 },
  { name: '巴格达',         tz: 'Asia/Baghdad',          offset: 10800 },
  { name: '利雅得',         tz: 'Asia/Riyadh',           offset: 10800 },
  { name: '伊斯坦布尔',     tz: 'Europe/Istanbul',      offset: 10800 },
  // 欧洲
  { name: '伦敦',           tz: 'Europe/London',         offset: 0     },
  { name: '巴黎',           tz: 'Europe/Paris',          offset: 3600  },
  { name: '柏林',           tz: 'Europe/Berlin',         offset: 3600  },
  { name: '罗马',           tz: 'Europe/Rome',           offset: 3600  },
  { name: '马德里',         tz: 'Europe/Madrid',         offset: 3600  },
  { name: '阿姆斯特丹',     tz: 'Europe/Amsterdam',      offset: 3600  },
  { name: '雅典',           tz: 'Europe/Athens',         offset: 7200  },
  { name: '赫尔辛基',       tz: 'Europe/Helsinki',       offset: 7200  },
  { name: '莫斯科',         tz: 'Europe/Moscow',         offset: 10800 },
  // 非洲
  { name: '开罗',           tz: 'Africa/Cairo',          offset: 7200  },
  { name: '拉各斯',         tz: 'Africa/Lagos',          offset: 3600  },
  { name: '约翰内斯堡',     tz: 'Africa/Johannesburg',   offset: 7200  },
  { name: '内罗毕',         tz: 'Africa/Nairobi',        offset: 10800 },
  // 北美
  { name: '纽约',           tz: 'America/New_York',      offset: -18000 },
  { name: '多伦多',         tz: 'America/Toronto',       offset: -18000 },
  { name: '芝加哥',         tz: 'America/Chicago',       offset: -21600 },
  { name: '丹佛',           tz: 'America/Denver',         offset: -25200 },
  { name: '凤凰城',         tz: 'America/Phoenix',       offset: -25200 },
  { name: '洛杉矶',         tz: 'America/Los_Angeles',   offset: -28800 },
  { name: '墨西哥城',       tz: 'America/Mexico_City',   offset: -21600 },
  { name: '安克雷奇',       tz: 'America/Anchorage',     offset: -32400 },
  { name: '檀香山',         tz: 'Pacific/Honolulu',      offset: -36000 },
  // 南美
  { name: '圣保罗',         tz: 'America/Sao_Paulo',     offset: -10800 },
  { name: '布宜诺斯艾利斯', tz: 'America/Argentina/Buenos_Aires', offset: -10800 },
  { name: '利马',           tz: 'America/Lima',          offset: -18000 },
  { name: '圣地亚哥',       tz: 'America/Santiago',      offset: -14400 },
  // 大洋洲
  { name: '珀斯',           tz: 'Australia/Perth',       offset: 28800 },
  { name: '阿德莱德',       tz: 'Australia/Adelaide',    offset: 34200 },
  { name: '布里斯班',       tz: 'Australia/Brisbane',    offset: 36000 },
  { name: '悉尼',           tz: 'Australia/Sydney',      offset: 39600 },
  { name: '奥克兰',         tz: 'Pacific/Auckland',      offset: 43200 },
  { name: '苏瓦',           tz: 'Pacific/Fiji',          offset: 43200 },
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
