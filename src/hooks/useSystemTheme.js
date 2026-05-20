// ═══════════════════════════════════════════════════════════
//  useSystemTheme — 系统主题跟随 Hook
// ═══════════════════════════════════════════════════════════
//
// 三种模式：
//   'auto'  — 跟随 Windows 系统主题自动切换（默认）
//   'dark'  — 强制深色模式
//   'light' — 强制浅色模式
//
// 通过 Electron 的 nativeTheme API 监听系统主题变化，
// 同时用 matchMedia 作为浏览器环境的降级方案

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'clock_theme_mode'; // 持久化到 localStorage 的 key

export function useSystemTheme() {
  // 从 localStorage 恢复上次的主题模式，默认为 'auto'（跟随系统）
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'auto');
  const [systemTheme, setSystemTheme] = useState('dark');

  // 监听 Electron 主进程发来的系统主题变化通知
  useEffect(() => {
    if (window.electronAPI?.onNativeThemeChanged) {
      window.electronAPI.onNativeThemeChanged((theme) => {
        setSystemTheme(theme);
      });
    }
  }, []);

  // 降级方案：通过浏览器 matchMedia API 监听系统主题
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    // 仅在无 Electron API 时使用 matchMedia 初始值
    if (!window.electronAPI) setSystemTheme(mq.matches ? 'dark' : 'light');
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 解析后的实际主题：auto 时跟随系统，否则使用手动设置的主题
  const resolvedTheme = mode === 'auto' ? systemTheme : mode;

  /** 设置主题模式并持久化 */
  const setTheme = useCallback((newMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  /** 循环切换主题模式：auto → dark → light → auto */
  const cycleTheme = useCallback(() => {
    const order = mode === 'auto' ? ['dark', 'light', 'auto']
      : mode === 'dark' ? ['light', 'auto', 'dark']
      : ['auto', 'dark', 'light'];
    const [next] = order;
    setTheme(next);
  }, [mode, setTheme]);

  return { theme: resolvedTheme, mode, systemTheme, setTheme, cycleTheme };
}
