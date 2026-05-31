// ═══════════════════════════════════════════════════════════
//  农历算法 — 公历转农历（1900–2100）
// ═══════════════════════════════════════════════════════════
//
// 数据编码格式（LUNAR_DATA 数组，每年一个整数）：
//   bit 0-3:  闰月月份（0 = 无闰月）
//   bit 4-15: 12个月的月大小（每 bit 对应一个月：1=大月30天, 0=小月29天）
//   bit 16:   闰月大小（1=大月30天, 0=小月29天）
//
// 每月天数计算：从 bit 16 开始右移，对应 1 月到 12 月

const LUNAR_DATA = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x16a95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
  0x0d520
];

// 农历月份名称
const LUNAR_MONTH_NAMES = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];

// 农历日期名称（初一到三十，索引 0 为空占位方便直接取用）
const LUNAR_DAY_NAMES = [
  '','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
];

// 天干地支
const TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DIZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const SHENGXIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
export const SHENGXIAO_EMOJI = { '鼠':'🐭','牛':'🐮','虎':'🐯','兔':'🐰','龙':'🐲','蛇':'🐍','马':'🐴','羊':'🐏','猴':'🐵','鸡':'🐔','狗':'🐶','猪':'🐷' };

/** 获取指定年份的闰月月份（0 表示无闰月） */
function leapMonthOf(y) { return LUNAR_DATA[y - 1900] & 0xf; }

/** 获取闰月的天数（30 或 29） */
function leapDaysOf(y) { return leapMonthOf(y) ? ((LUNAR_DATA[y - 1900] & 0x10000) ? 30 : 29) : 0; }

/** 计算农历年的总天数（12 或 13 个月相加） */
function daysInLunarYear(y) {
  let t = 0, d = LUNAR_DATA[y - 1900];
  for (let m = 0; m < 12; m++) t += (d & (0x8000 >> m)) ? 30 : 29;
  return t + leapDaysOf(y);
}

/**
 * 将公历日期转换为农历日期
 *
 * 算法原理：
 * 1. 计算输入日期距离基准日（1900-01-31）的天数
 * 2. 逐年减去农历年天数，定位到目标农历年
 * 3. 逐月减去月份天数，遇到闰月也检查，定位到农历月日
 *
 * @param {number} sy - 公历年
 * @param {number} sm - 公历月 (1-12)
 * @param {number} sd - 公历日
 * @returns {{ year, month, day, isLeap, yearName, monthName, dayName, shengxiao } | null}
 */
// ═══════════════════════════════════════════════════════════
//  二十四节气
// ═══════════════════════════════════════════════════════════
//
// 使用经典公式: 日期 = floor(Y * 0.2422 + C) - floor(Y / 4)
// Y = 年份后两位，C = 节气常数

const SOLAR_TERMS = [
  { name: '小寒', m: 1,  c: 5.4055 },
  { name: '大寒', m: 1,  c: 20.12 },
  { name: '立春', m: 2,  c: 3.87 },
  { name: '雨水', m: 2,  c: 18.73 },
  { name: '惊蛰', m: 3,  c: 5.63 },
  { name: '春分', m: 3,  c: 20.646 },
  { name: '清明', m: 4,  c: 4.81 },
  { name: '谷雨', m: 4,  c: 20.1 },
  { name: '立夏', m: 5,  c: 5.52 },
  { name: '小满', m: 5,  c: 21.04 },
  { name: '芒种', m: 6,  c: 5.678 },
  { name: '夏至', m: 6,  c: 21.38 },
  { name: '小暑', m: 7,  c: 7.108 },
  { name: '大暑', m: 7,  c: 22.83 },
  { name: '立秋', m: 8,  c: 7.5 },
  { name: '处暑', m: 8,  c: 23.18 },
  { name: '白露', m: 9,  c: 7.646 },
  { name: '秋分', m: 9,  c: 23.042 },
  { name: '寒露', m: 10, c: 8.318 },
  { name: '霜降', m: 10, c: 23.438 },
  { name: '立冬', m: 11, c: 7.438 },
  { name: '小雪', m: 11, c: 22.36 },
  { name: '大雪', m: 12, c: 7.18 },
  { name: '冬至', m: 12, c: 21.94 },
];

/** 计算指定公历日期所属的节气（最近过去的那一个） */
export function getCurrentSolarTerm(sy, sm, sd) {
  const y = sy % 100;
  const dates = SOLAR_TERMS.map(t => {
    const d = Math.floor(y * 0.2422 + t.c) - Math.floor(y / 4);
    return { name: t.name, m: t.m, d };
  });

  // 从当前日期往回找最近的节气
  let cur = -1;
  for (let i = 0; i < 24; i++) {
    const t = dates[i];
    if (t.m < sm || (t.m === sm && t.d <= sd)) cur = i;
    else break;
  }
  // 如果今年还没到第一个节气，返回去年的最后一个（小寒通常在 1 月初）
  if (cur === -1) cur = 23;
  return dates[cur].name;
}

/** 检查指定公历日期是否为节气日 */
export function isSolarTermDay(sy, sm, sd) {
  const y = sy % 100;
  for (const t of SOLAR_TERMS) {
    const d = Math.floor(y * 0.2422 + t.c) - Math.floor(y / 4);
    if (t.m === sm && d === sd) return t.name;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
//  中国节假日
// ═══════════════════════════════════════════════════════════

// 公历节日
const GREGORIAN_HOLIDAYS = [
  { m: 1,  d: 1,  name: '元旦' },
  { m: 2,  d: 14, name: '情人节' },
  { m: 3,  d: 8,  name: '妇女节' },
  { m: 4,  d: 1,  name: '愚人节' },
  { m: 5,  d: 1,  name: '劳动节' },
  { m: 5,  d: 4,  name: '青年节' },
  { m: 6,  d: 1,  name: '儿童节' },
  { m: 7,  d: 1,  name: '建党节' },
  { m: 8,  d: 1,  name: '建军节' },
  { m: 9,  d: 10, name: '教师节' },
  { m: 10, d: 1,  name: '国庆节' },
  { m: 12, d: 25, name: '圣诞节' },
];

// 农历节日（{ month, day, name }，month/day 为农历月日）
const LUNAR_HOLIDAYS = [
  { m: 1,  d: 1,  name: '春节' },
  { m: 1,  d: 15, name: '元宵节' },
  { m: 5,  d: 5,  name: '端午节' },
  { m: 7,  d: 7,  name: '七夕' },
  { m: 8,  d: 15, name: '中秋节' },
  { m: 9,  d: 9,  name: '重阳节' },
];

/** 获取指定日期的节假日名称，返回 null 表示非节日 */
export function getHoliday(sy, sm, sd, lunar) {
  // 先查公历节日
  for (const h of GREGORIAN_HOLIDAYS) {
    if (h.m === sm && h.d === sd) return h.name;
  }

  if (!lunar) return null;

  // 再查农历节日
  for (const h of LUNAR_HOLIDAYS) {
    if (h.m === lunar.month && h.d === lunar.day && !lunar.isLeap) return h.name;
  }

  // 除夕：农历腊月最后一天（腊月29或30）
  const info = LUNAR_DATA[lunar.year - 1900];
  // 腊月（12月）天数
  const laYueDays = (info & 0x10) ? 30 : 29;
  if (lunar.month === 12 && lunar.day === laYueDays && !lunar.isLeap) return '除夕';

  return null;
}

export function solarToLunar(sy, sm, sd) {
  // 基准日：1900年1月31日（农历庚子年正月初一）
  const base = new Date(1900, 0, 31);
  let off = Math.round((new Date(sy, sm - 1, sd) - base) / 86400000);
  let ly = 1900, di;

  // 定位农历年份
  while (ly < 2101) { di = daysInLunarYear(ly); if (off < di) break; off -= di; ly++; }
  if (ly > 2100) return null;  // 超出范围

  const leap = leapMonthOf(ly), info = LUNAR_DATA[ly - 1900];
  let lm = 1, ld, isLeap = false;

  // 定位农历月日
  for (let m = 1; m <= 12; m++) {
    const md = (info & (0x8000 >> (m - 1))) ? 30 : 29;  // 当月天数
    if (off < md) { ld = off + 1; lm = m; break; }
    off -= md;

    // 检查闰月（闰月紧跟同名月份之后）
    if (leap && m === leap) {
      const lpd = leapDaysOf(ly);
      if (off < lpd) { ld = off + 1; lm = m; isLeap = true; break; }
      off -= lpd;
    }
  }
  if (!ld) ld = off + 1;

  return {
    year: ly,
    month: lm,
    day: ld,
    isLeap,
    yearName: TIANGAN[(ly - 4) % 10] + DIZHI[(ly - 4) % 12],  // 干支纪年
    monthName: (isLeap ? '闰' : '') + LUNAR_MONTH_NAMES[lm - 1] + '月',
    dayName: LUNAR_DAY_NAMES[ld],
    shengxiao: SHENGXIAO[(ly - 4) % 12]  // 生肖
  };
}
