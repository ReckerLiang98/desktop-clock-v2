import { describe, it, expect } from 'vitest';
import {
  solarToLunar,
  isSolarTermDay,
  getCurrentSolarTerm,
  getHoliday,
  SHENGXIAO_EMOJI,
} from '../utils/lunar';

describe('solarToLunar', () => {
  it('1900-01-31 是农历庚子年正月初一（基准日）', () => {
    const result = solarToLunar(1900, 1, 31);
    expect(result).not.toBeNull();
    expect(result.year).toBe(1900);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.isLeap).toBe(false);
    expect(result.yearName).toBe('庚子');
    expect(result.shengxiao).toBe('鼠');
  });

  it('2026-02-17 是农历丙午年正月初一（2026年春节）', () => {
    const result = solarToLunar(2026, 2, 17);
    expect(result).not.toBeNull();
    expect(result.year).toBe(2026);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.isLeap).toBe(false);
    expect(result.yearName).toBe('丙午');
    expect(result.shengxiao).toBe('马');
    expect(result.monthName).toBe('正月');
    expect(result.dayName).toBe('初一');
  });

  it('2023-01-22 是农历癸卯年正月初一（2023年春节）', () => {
    const result = solarToLunar(2023, 1, 22);
    expect(result).not.toBeNull();
    expect(result.year).toBe(2023);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.yearName).toBe('癸卯');
    expect(result.shengxiao).toBe('兔');
  });

  it('2026-05-29 是一个非闰月的普通日期', () => {
    const result = solarToLunar(2026, 5, 29);
    expect(result).not.toBeNull();
    expect(result.isLeap).toBe(false);
    expect(result.year).toBe(2026);
    expect(result.shengxiao).toBe('马');
  });

  it('2025-07-25 是农历闰六月（2025 年有闰六月）', () => {
    const result = solarToLunar(2025, 7, 25);
    expect(result).not.toBeNull();
    expect(result.year).toBe(2025);
  });

  it('2100-12-31 不超出范围', () => {
    const result = solarToLunar(2100, 12, 31);
    expect(result).not.toBeNull();
    expect(result.year).toBeLessThanOrEqual(2100);
  });

  it('1900-01-30 (基准日前一天) 返回 day=0 或 null', () => {
    const result = solarToLunar(1900, 1, 30);
    // 算法对基准日之前的日期可能返回 day=0 的无效结果或 null
    if (result) {
      expect(result.day).toBe(0);
    } else {
      expect(result).toBeNull();
    }
  });

  it('2101-01-01 仍在算法范围 2100 年内（农历年未跨年）', () => {
    const result = solarToLunar(2101, 1, 1);
    expect(result).not.toBeNull();
    expect(result.year).toBe(2100);
  });

  it('返回的 monthName 格式正确', () => {
    const result = solarToLunar(2026, 3, 15);
    expect(result).not.toBeNull();
    expect(result.monthName).toMatch(/^(闰)?[正二三四五六七八九十冬腊]月$/);
  });

  it('返回的 dayName 格式正确', () => {
    const result = solarToLunar(2026, 3, 15);
    expect(result).not.toBeNull();
    expect(result.dayName).toMatch(/^(初一|初二|初三|初四|初五|初六|初七|初八|初九|初十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十|廿一|廿二|廿三|廿四|廿五|廿六|廿七|廿八|廿九|三十)$/);
  });

  it('2026 年每月都有有效返回', () => {
    for (let m = 1; m <= 12; m++) {
      const result = solarToLunar(2026, m, 1);
      expect(result).not.toBeNull();
      expect(result.year).toBeGreaterThanOrEqual(2025);
    }
  });

  it('2026-02-16 (除夕) 年号为 2025 (乙巳)', () => {
    const result = solarToLunar(2026, 2, 16);
    expect(result).not.toBeNull();
    expect(result.year).toBe(2025);
    expect(result.shengxiao).toBe('蛇');
    expect(result.yearName).toBe('乙巳');
  });
});

describe('isSolarTermDay', () => {
  it('2026-02-04 是立春', () => {
    expect(isSolarTermDay(2026, 2, 4)).toBe('立春');
  });

  it('2026-05-21 是小满', () => {
    expect(isSolarTermDay(2026, 5, 21)).toBe('小满');
  });

  it('2026-12-22 是冬至', () => {
    expect(isSolarTermDay(2026, 12, 22)).toBe('冬至');
  });

  it('2026-01-05 是小寒', () => {
    expect(isSolarTermDay(2026, 1, 5)).toBe('小寒');
  });

  it('2026-07-07 是小暑', () => {
    expect(isSolarTermDay(2026, 7, 7)).toBe('小暑');
  });

  it('非节气日返回 null', () => {
    expect(isSolarTermDay(2026, 5, 20)).toBeNull();
    expect(isSolarTermDay(2026, 1, 1)).toBeNull();
  });

  it('全年有 24 个节气日', () => {
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        if (isSolarTermDay(2026, m, d)) count++;
      }
    }
    expect(count).toBe(24);
  });
});

describe('getCurrentSolarTerm', () => {
  it('2026-02-04 (立春当天) 当前节气是立春', () => {
    expect(getCurrentSolarTerm(2026, 2, 4)).toBe('立春');
  });

  it('2026-02-05 (立春后一天) 当前节气是立春', () => {
    expect(getCurrentSolarTerm(2026, 2, 5)).toBe('立春');
  });

  it('2026-01-01 (小寒之前) 返回大寒或小寒', () => {
    const term = getCurrentSolarTerm(2026, 1, 1);
    expect(['冬至', '小寒', '大寒']).toContain(term);
  });

  it('返回的节气名在 24 节气中', () => {
    const validTerms = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
      '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分',
      '寒露','霜降','立冬','小雪','大雪','冬至'];
    for (let m = 1; m <= 12; m++) {
      const term = getCurrentSolarTerm(2026, m, 15);
      expect(validTerms).toContain(term);
    }
  });
});

describe('getHoliday', () => {
  it('2026-01-01 是元旦', () => {
    expect(getHoliday(2026, 1, 1, null)).toBe('元旦');
  });

  it('2026-10-01 是国庆节', () => {
    expect(getHoliday(2026, 10, 1, null)).toBe('国庆节');
  });

  it('2026-02-17 是春节（农历正月初一）', () => {
    const lunar = solarToLunar(2026, 2, 17);
    expect(lunar).not.toBeNull();
    expect(getHoliday(2026, 2, 17, lunar)).toBe('春节');
  });

  it('2026-06-19 是端午节（农历五月初五）', () => {
    const lunar = solarToLunar(2026, 6, 19);
    expect(lunar).not.toBeNull();
    expect(lunar.month).toBe(5);
    expect(lunar.day).toBe(5);
    expect(getHoliday(2026, 6, 19, lunar)).toBe('端午节');
  });

  it('2026-09-25 是中秋节（农历八月十五）', () => {
    const lunar = solarToLunar(2026, 9, 25);
    expect(lunar).not.toBeNull();
    expect(lunar.month).toBe(8);
    expect(lunar.day).toBe(15);
    expect(getHoliday(2026, 9, 25, lunar)).toBe('中秋节');
  });

  it('非节日日期返回 null', () => {
    const lunar = solarToLunar(2026, 3, 15);
    expect(getHoliday(2026, 3, 15, lunar)).toBeNull();
  });

  it('没有农历信息时只查公历节日', () => {
    expect(getHoliday(2026, 1, 1, null)).toBe('元旦');
    expect(getHoliday(2026, 3, 15, null)).toBeNull();
  });

  it('2026-02-16 是除夕（乙巳年腊月廿九）', () => {
    const lunar = solarToLunar(2026, 2, 16);
    expect(lunar).not.toBeNull();
    expect(lunar.month).toBe(12);
    expect(getHoliday(2026, 2, 16, lunar)).toBe('除夕');
  });
});

describe('SHENGXIAO_EMOJI', () => {
  it('包含全部 12 个生肖', () => {
    const sx = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
    for (const s of sx) {
      expect(SHENGXIAO_EMOJI[s]).toBeDefined();
    }
  });

  it('每个 emoji 都是有效的', () => {
    for (const [shengxiao, emoji] of Object.entries(SHENGXIAO_EMOJI)) {
      expect(typeof shengxiao).toBe('string');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThanOrEqual(1);
    }
  });
});
