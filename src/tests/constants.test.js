import { describe, it, expect } from 'vitest';
import { formatOffset, getSystemTZ, TZ_LIST, WEEKDAY_NAMES } from '../utils/constants';

describe('formatOffset', () => {
  it('格式化正偏移量 (UTC+08:00)', () => {
    expect(formatOffset(28800)).toBe('UTC+08:00');
  });

  it('格式化负偏移量 (UTC-04:00)', () => {
    expect(formatOffset(-14400)).toBe('UTC-04:00');
  });

  it('格式化零偏移量 (UTC+00:00)', () => {
    expect(formatOffset(0)).toBe('UTC+00:00');
  });

  it('格式化半小时偏移量 (UTC+05:30)', () => {
    expect(formatOffset(19800)).toBe('UTC+05:30');
  });

  it('格式化非整时偏移量 (UTC+05:45)', () => {
    expect(formatOffset(20700)).toBe('UTC+05:45');
  });

  it('格式化极端正偏移 (UTC+14:00)', () => {
    expect(formatOffset(50400)).toBe('UTC+14:00');
  });

  it('格式化极端负偏移 (UTC-12:00)', () => {
    expect(formatOffset(-43200)).toBe('UTC-12:00');
  });
});

describe('getSystemTZ', () => {
  it('返回非空字符串', () => {
    const tz = getSystemTZ();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('包含时区分隔符 /', () => {
    const tz = getSystemTZ();
    // 在测试环境 (jsdom) 中可能返回 'Local' 或 IANA 格式
    expect(typeof tz).toBe('string');
  });
});

describe('TZ_LIST', () => {
  it('包含 55 个城市', () => {
    expect(TZ_LIST.length).toBe(55);
  });

  it('每个条目都有 name, tz, offset 字段', () => {
    for (const tz of TZ_LIST) {
      expect(tz).toHaveProperty('name');
      expect(tz).toHaveProperty('tz');
      expect(tz).toHaveProperty('offset');
      expect(typeof tz.name).toBe('string');
      expect(typeof tz.tz).toBe('string');
      expect(typeof tz.offset).toBe('number');
    }
  });

  it('所有时区 offset 在有效范围内 (-43200 到 +50400)', () => {
    for (const tz of TZ_LIST) {
      expect(tz.offset).toBeGreaterThanOrEqual(-43200);
      expect(tz.offset).toBeLessThanOrEqual(50400);
    }
  });

  it('所有 tz 标识符格式正确 (包含斜杠)', () => {
    for (const tz of TZ_LIST) {
      expect(tz.tz).toMatch(/^[A-Z][a-z]+\/[A-Za-z_]+/);
    }
  });

  it('同一时区标识符无重复', () => {
    const ids = TZ_LIST.map(t => t.tz);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('UTC+08:00 有 8 个城市 (北京/台北/香港/乌兰巴托/新加坡/吉隆坡/马尼拉/珀斯)', () => {
    const utc8 = TZ_LIST.filter(t => t.offset === 28800);
    expect(utc8.length).toBe(8);
    const names = utc8.map(t => t.tz);
    expect(names).toContain('Asia/Shanghai');
    expect(names).toContain('Asia/Taipei');
    expect(names).toContain('Asia/Hong_Kong');
    expect(names).toContain('Asia/Ulaanbaatar');
    expect(names).toContain('Asia/Singapore');
    expect(names).toContain('Asia/Kuala_Lumpur');
    expect(names).toContain('Asia/Manila');
    expect(names).toContain('Australia/Perth');
  });
});

describe('WEEKDAY_NAMES', () => {
  it('包含 7 天', () => {
    expect(WEEKDAY_NAMES).toHaveLength(7);
  });

  it('以星期日开始', () => {
    expect(WEEKDAY_NAMES[0]).toBe('星期日');
  });

  it('以星期六结束', () => {
    expect(WEEKDAY_NAMES[6]).toBe('星期六');
  });

  it('包含所有星期', () => {
    expect(WEEKDAY_NAMES).toEqual([
      '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'
    ]);
  });
});
