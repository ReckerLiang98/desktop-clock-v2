import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { useClock } from '../hooks/useClock';
import { useSystemTheme } from '../hooks/useSystemTheme';

/* ═══════════════════════════════════════════════════════════
   useClock Hook 测试
   ═══════════════════════════════════════════════════════════ */
function ClockTester({ offset, tzOffset, is24, showMs }) {
  const { time, date } = useClock({ offset, tzOffset, is24, showMs });
  return (
    <div>
      <span data-testid="h">{time.h}</span>
      <span data-testid="m">{time.m}</span>
      <span data-testid="s">{time.s}</span>
      <span data-testid="ms">{time.ms}</span>
      <span data-testid="ampm">{time.ampm}</span>
      <span data-testid="dateStr">{date.dateStr}</span>
      <span data-testid="weekday">{date.weekday}</span>
      <span data-testid="lunar">{date.lunar}</span>
    </div>
  );
}

describe('useClock', () => {
  it('返回 time 的各字段：h, m, s, ms, ampm', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={false} />);
    expect(screen.getByTestId('h').textContent).toMatch(/^\d{2}$/);
    expect(screen.getByTestId('m').textContent).toMatch(/^\d{2}$/);
    expect(screen.getByTestId('s').textContent).toMatch(/^\d{2}$/);
    expect(screen.getByTestId('ms')).toBeTruthy();
  });

  it('24h 模式下 ampm 为空字符串', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={false} />);
    expect(screen.getByTestId('ampm').textContent).toBe('');
  });

  it('12h 模式下 ampm 非空', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={false} showMs={false} />);
    const ampm = screen.getByTestId('ampm').textContent;
    expect(['凌晨', '早上', '上午', '中午', '下午', '傍晚', '晚上']).toContain(ampm);
  });

  it('showMs=false 时 ms 字段为 "000"', async () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={false} />);
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByTestId('ms').textContent).toBe('000');
  });

  it('showMs=true 时 ms 字段以 . 开头', async () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={true} />);
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByTestId('ms').textContent).toMatch(/^\.\d{3}$/);
  });

  it('时间格式 h/m/s 始终是两位数', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={false} />);
    expect(screen.getByTestId('h').textContent).toMatch(/^\d{2}$/);
    expect(screen.getByTestId('m').textContent).toMatch(/^\d{2}$/);
    expect(screen.getByTestId('s').textContent).toMatch(/^\d{2}$/);
  });

  it('12h 模式下小时范围在 1-12', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={false} showMs={false} />);
    const h = parseInt(screen.getByTestId('h').textContent);
    expect(h).toBeGreaterThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(12);
  });

  it('date 对象包含日期/星期/农历', () => {
    render(<ClockTester offset={0} tzOffset={28800} is24={true} showMs={false} />);
    expect(screen.getByTestId('dateStr').textContent).toMatch(/^\d{4}年\d{1,2}月\d{1,2}日$/);
    expect(screen.getByTestId('weekday').textContent).toBeTruthy();
    expect(screen.getByTestId('lunar').textContent).toBeTruthy();
  });
});

/* ═══════════════════════════════════════════════════════════
   useSystemTheme Hook 测试
   ═══════════════════════════════════════════════════════════ */
function ThemeTester({ onMount }) {
  const result = useSystemTheme();
  const [callbackRun, setCallbackRun] = useState(false);

  // 首次渲染后将回调函数传给父级
  if (!callbackRun && onMount) {
    onMount(result);
    setCallbackRun(true);
  }

  return (
    <div>
      <span data-testid="theme">{result.theme}</span>
      <span data-testid="mode">{result.mode}</span>
      <button data-testid="cycle" onClick={result.cycleTheme}>切换</button>
      <button data-testid="set-dark" onClick={() => result.setTheme('dark')}>深色</button>
      <button data-testid="set-light" onClick={() => result.setTheme('light')}>浅色</button>
      <button data-testid="set-auto" onClick={() => result.setTheme('auto')}>自动</button>
    </div>
  );
}

describe('useSystemTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('默认 mode 为 auto', () => {
    render(<ThemeTester />);
    expect(screen.getByTestId('mode').textContent).toBe('auto');
  });

  it('theme 值为 dark 或 light', () => {
    render(<ThemeTester />);
    expect(['dark', 'light']).toContain(screen.getByTestId('theme').textContent);
  });

  it('从 localStorage 恢复上次的 mode', () => {
    localStorage.setItem('clock_theme_mode', 'dark');
    render(<ThemeTester />);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('cycleTheme 在 auto→dark→light→auto 间循环', () => {
    render(<ThemeTester />);

    // 初始: auto
    expect(screen.getByTestId('mode').textContent).toBe('auto');

    // auto → dark
    act(() => { screen.getByTestId('cycle').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('dark');

    // dark → light
    act(() => { screen.getByTestId('cycle').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('light');

    // light → auto
    act(() => { screen.getByTestId('cycle').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('auto');
  });

  it('setTheme 直接设置 mode', () => {
    render(<ThemeTester />);
    // 初始 auto
    expect(screen.getByTestId('mode').textContent).toBe('auto');

    // 切换到 dark
    act(() => { screen.getByTestId('set-dark').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('dark');

    // 切换到 light
    act(() => { screen.getByTestId('set-light').click(); });
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('setTheme 持久化到 localStorage', () => {
    render(<ThemeTester />);
    act(() => { screen.getByTestId('set-dark').click(); });
    expect(localStorage.getItem('clock_theme_mode')).toBe('dark');
  });
});
