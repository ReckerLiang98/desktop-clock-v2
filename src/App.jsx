// ═══════════════════════════════════════════════════════════
//  App — 桌面时钟根组件
// ═══════════════════════════════════════════════════════════
//
// 负责统筹所有状态和数据流：
//   - 网络时间同步 (useTimeSync)
//   - 系统主题检测 (useSystemTheme)
//   - 时钟 tick (useClock)
//   - 时区管理（IP 定位 + 手动选择）
//   - IP 天气获取（支持手动刷新）
//   - 键盘快捷键 (F/T/R/W)
//   - 关闭对话框流程

import { useState, useCallback, useEffect, useRef } from 'react';
import { useClock } from './hooks/useClock';
import { useTimeSync } from './hooks/useTimeSync';
import { useSystemTheme } from './hooks/useSystemTheme';
import { TZ_LIST } from './utils/constants';
import { fetchWeather, fetchWarnings } from './services/api';
import { getSystemTZ } from './utils/constants';
import TitleBar from './components/TitleBar';
import SyncStatus from './components/SyncStatus';
import ClockFace from './components/ClockFace';
import DateDisplay from './components/DateDisplay';
import Toolbar from './components/Toolbar';
import TimezoneMenu from './components/TimezoneMenu';
import Weather from './components/Weather';
import WarningBanner from './components/WarningBanner';
import CloseDialog from './components/CloseDialog';

export default function App() {
  // ── 核心状态 ────────────────────────────────────────────
  const [is24, setIs24] = useState(true);        // 24 小时制开关
  const [showMs, setShowMs] = useState(false);   // 毫秒显示开关（默认关闭）
  const [topEnabled, setTopEnabled] = useState(false);  // 窗口置顶状态
  const [windowAnim, setWindowAnim] = useState(null);  // null | 'minimizing' | 'restoring'

  // ── 网络时间同步 ──────────────────────────────────────
  const { offset, rtt, clientIp, synced, syncFailures, syncing, syncTz, syncTime } = useTimeSync();

  // ── 主题管理 ──────────────────────────────────────────
  const { theme, mode, cycleTheme } = useSystemTheme();

  // ── 时区管理 ──────────────────────────────────────────
  // tzManual 为用户手动选择的时区，null 表示使用 IP 自动检测
  const [tzManual, setTzManual] = useState(() => {
    const s = localStorage.getItem('clock_tz_manual_v2');
    return s ? JSON.parse(s) : null;
  });
  const [tzMenuOpen, setTzMenuOpen] = useState(false);  // 时区菜单展开状态

  // 实际使用的时区：手动选择 > IP 自动检测 > 系统本地时区
  const resolvedTz = tzManual || syncTz || {
    name: getSystemTZ(),
    offset: -new Date().getTimezoneOffset() * 60,
    tz: getSystemTZ()
  };

  // ── 时钟 tick ──────────────────────────────────────────
  const { time, date } = useClock({ offset, tzOffset: resolvedTz.offset, is24, showMs });

  // ── 天气（支持手动刷新）──────────────────────────────
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const weatherRef = useRef(null);
  // 存储天气返回的经纬度，供气象预警 API 使用
  const weatherCoordsRef = useRef(null);

  const loadWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const data = await fetchWeather();
      if (data) {
        setWeather(data);
        window.electronAPI?.updateWeather(data);
        // 提取经纬度用于气象预警查询
        if (data.latitude != null && data.longitude != null) {
          weatherCoordsRef.current = { lat: data.latitude, lon: data.longitude };
        }
      }
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // ── 气象预警（每 15 分钟检查一次）───────────────────
  const [warnings, setWarnings] = useState(null);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const prevWarningsRef = useRef(null);  // 用于检测新增预警（触发系统通知）

  const loadWarnings = useCallback(async () => {
    const apiKey = localStorage.getItem('clock_qweather_key_v2');
    const coords = weatherCoordsRef.current;
    if (!apiKey || !coords) return;  // 无 Key 或坐标时静默跳过

    setWarningsLoading(true);
    try {
      const data = await fetchWarnings(coords.lat, coords.lon, apiKey);
      if (data !== null) {
        // 检测新增预警：对比 prevWarningsRef 中不存在的 id
        const prev = prevWarningsRef.current || [];
        const prevIds = new Set(prev.map(w => w.id));
        const newAlerts = data.filter(w => !prevIds.has(w.id));

        // 对每条新增预警发送系统通知
        if (newAlerts.length > 0) {
          for (const alert of newAlerts) {
            const sevLabel = { blue: '🔵', yellow: '🟡', orange: '🟠', red: '🔴' }[alert.color] || '⚠️';
            const notif = new Notification('桌面时钟 · 气象预警', {
              body: `${sevLabel} ${alert.headline}`,
              silent: false,
            });
            notif.onclick = () => { window.focus(); };
          }
        }

        prevWarningsRef.current = data;
        setWarnings(data);
        window.electronAPI?.updateWarnings(data);
      }
    } finally {
      setWarningsLoading(false);
    }
  }, []);

  // 天气加载成功后立即检查一次预警（天气更新时会自动重查）
  useEffect(() => {
    if (weather?.latitude != null && weather?.longitude != null) {
      loadWarnings();
    }
  }, [weather?.latitude, weather?.longitude, loadWarnings]);

  // 每 15 分钟自动刷新气象预警
  useEffect(() => {
    const id = setInterval(() => { loadWarnings(); }, 900000);
    return () => clearInterval(id);
  }, [loadWarnings]);

  // 应用启动后立即获取天气（不等待 IP 同步，wttr.in 自带 IP 定位）
  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // 每小时自动刷新天气
  useEffect(() => {
    const id = setInterval(() => { loadWeather(); }, 3600000);
    return () => clearInterval(id);
  }, [loadWeather]);

  // ── 托盘提示：每 30 秒推送时间 + 天气到主进程 ──────────
  const weather4TrayRef = useRef(null);
  weather4TrayRef.current = weather;
  const time4TrayRef = useRef(null);
  time4TrayRef.current = time;

  useEffect(() => {
    const updateTray = () => {
      const t = time4TrayRef.current;
      const w = weather4TrayRef.current;
      let text = t ? t.h + ':' + t.m : '';
      if (t && !is24) text = t.ampm + ' ' + text;
      if (w) text += ' · ' + w.iconEmoji + ' ' + w.weather + ' ' + w.temp;
      if (text) window.electronAPI?.updateTrayTooltip(text);
    };
    // 延迟 50ms 执行首次更新，确保 useClock 的 tick() 已用新时区偏移量更新了时间
    const initTimer = setTimeout(updateTray, 50);
    const id = setInterval(updateTray, 30000);
    return () => { clearTimeout(initTimer); clearInterval(id); };
  }, [is24, resolvedTz.tz]);

  // ── 关闭对话框 ────────────────────────────────────────
  const [showClose, setShowClose] = useState(false);

  // ── 窗口自适应调整 ────────────────────────────────────
  // 测量 .container 的实际尺寸来调整窗口，缓存上次尺寸避免重复 setSize
  const lastSize = useRef({ w: 0, h: 0 });
  const resizeWindow = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = document.querySelector('.container');
        if (container && window.electronAPI) {
          const w = container.offsetWidth + 32;
          const h = container.offsetHeight + 56;
          // 防御：容器未完成布局时尺寸可能为 0，跳过异常值
          if (w < 200 || h < 200) return;
          if (w !== lastSize.current.w || h !== lastSize.current.h) {
            lastSize.current = { w, h };
            window.electronAPI.resizeWindow(w, h);
          }
        }
      });
    });
  }, []);

  // 天气数据出现/更新后调整窗口
  const prevHasWeather = useRef(!!weather);
  useEffect(() => {
    const hasWeather = !!weather;
    if (hasWeather !== prevHasWeather.current) {
      prevHasWeather.current = hasWeather;
      resizeWindow();
    }
  }, [weather, resizeWindow]);

  // 预警数据出现/消失后调整窗口
  const prevHasWarnings = useRef(!!(warnings && warnings.length > 0));
  useEffect(() => {
    const hasWarnings = !!(warnings && warnings.length > 0);
    if (hasWarnings !== prevHasWarnings.current) {
      prevHasWarnings.current = hasWarnings;
      resizeWindow();
    }
  }, [warnings, resizeWindow]);

  // ── 事件处理（使用函数式状态更新避免闭包过期） ──────
  const toggle24 = useCallback(() => { setIs24(prev => !prev); }, []);
  const toggleMs = useCallback(() => { setShowMs(prev => !prev); }, []);

  const handleClose = useCallback(() => {
    // 检查是否有保存的关闭偏好
    const action = localStorage.getItem('clock_close_action_v2');
    if (action === 'quit') { window.electronAPI?.closeWindow(); return; }
    if (action === 'tray') { window.electronAPI?.hideWindow(); return; }
    setShowClose(true);  // 没有偏好，显示关闭对话框
  }, []);

  const toggleTop = useCallback(() => {
    window.electronAPI?.toggleAlwaysOnTop();
  }, []);

  /** 隐藏到系统托盘 */
  const hideToTray = useCallback((noPrompt) => {
    setShowClose(false);
    if (noPrompt) { localStorage.setItem('clock_close_action_v2', 'tray'); }
    window.electronAPI?.hideWindow();
  }, []);

  /** 直接退出应用 */
  const quitApp = useCallback((noPrompt) => {
    setShowClose(false);
    if (noPrompt) { localStorage.setItem('clock_close_action_v2', 'quit'); }
    window.electronAPI?.closeWindow();
  }, []);

  /** 手动选择时区 */
  const setTZManualFn = useCallback((tz) => {
    setTzManual(tz);
    localStorage.setItem('clock_tz_manual_v2', JSON.stringify(tz));
    setTzMenuOpen(false);
  }, []);

  /** 清除手动时区，恢复 IP 自动检测 */
  const clearTZManual = useCallback(() => {
    setTzManual(null);
    localStorage.removeItem('clock_tz_manual_v2');
    setTzMenuOpen(false);
    syncTime();
  }, [syncTime]);

  const handleTZClick = useCallback(() => setTzMenuOpen(prev => !prev), []);

  // ── 键盘快捷键 ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'f' || e.key === 'F') toggle24();      // F → 切换 12/24h
      if (e.key === 'm' || e.key === 'M') toggleMs();      // M → 切换毫秒
      if (e.key === 't' || e.key === 'T') cycleTheme();    // T → 切换主题
      if (e.key === 'r' || e.key === 'R') syncTime();      // R → 同步时间
      if (e.key === 'w' || e.key === 'W') loadWeather();   // W → 刷新天气
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle24, toggleMs, cycleTheme, syncTime, loadWeather]);

  // ── 监听主进程置顶状态变化（托盘菜单切换时同步） ────
  useEffect(() => {
    window.electronAPI?.onAlwaysOnTopChanged(setTopEnabled);
  }, []);

  // 窗口从任务栏恢复时播放展开动画
  useEffect(() => {
    window.electronAPI?.onWindowRestored(() => {
      setWindowAnim('restoring');
      setTimeout(() => setWindowAnim(null), 250);
    });
  }, []);

  // 最小化：播放缩小动画 → 系统最小化
  const handleMinimize = useCallback(() => {
    setWindowAnim('minimizing');
    setTimeout(() => {
      window.electronAPI?.minimizeWindow();
    }, 250);
  }, []);

  // ── 渲染 ───────────────────────────────────────────────
  return (
    <div className={`app-root ${theme}${windowAnim ? ' ' + windowAnim : ''}`}>
      <TitleBar
        topEnabled={topEnabled}
        onMinimize={handleMinimize}
        onToggleTop={toggleTop}
        onClose={handleClose}
      />

      <div className="container" ref={weatherRef}>
        {/* 网络同步状态指示器 */}
        <SyncStatus
          synced={synced} syncing={syncing} syncFailures={syncFailures}
          offset={offset} rtt={rtt} clientIp={clientIp}
        />

        {/* 主时间显示：HH:MM:SS[.ms] */}
        <ClockFace time={time} showMs={showMs} />

        {/* 日期 + 农历 + 时区（含时区下拉菜单） */}
        <DateDisplay
          date={date} tz={resolvedTz} tzManual={!!tzManual}
          onTZClick={handleTZClick}
        >
          {tzMenuOpen && (
            <TimezoneMenu
              tzList={TZ_LIST}
              currentTz={resolvedTz.tz}
              autoTz={syncTz}
              isAuto={!tzManual}
              onSelect={setTZManualFn}
              onAuto={clearTZManual}
              onClose={() => setTzMenuOpen(false)}
            />
          )}
        </DateDisplay>

        {/* 气象预警信号（中国境内四色预警） */}
        <WarningBanner warnings={warnings} loading={warningsLoading} />

        {/* IP 定位天气显示（含刷新按钮） */}
        {weather && (
          <Weather
            data={weather}
            loading={weatherLoading}
            onRefresh={loadWeather}
          />
        )}

        <div className="divider" />

        {/* 底部工具栏 */}
        <Toolbar
          is24={is24} showMs={showMs} themeMode={mode}
          onToggle24={toggle24} onToggleMs={toggleMs}
          onCycleTheme={cycleTheme} onSync={syncTime}
        />

        <div className="hint">拖动窗口 · F=格式 · M=毫秒 · T=主题 · R=同步 · W=天气</div>
      </div>

      {/* 关闭对话框（模态弹窗） */}
      {showClose && (
        <CloseDialog
          onHideToTray={hideToTray} onQuit={quitApp}
          onCancel={() => setShowClose(false)}
        />
      )}
    </div>
  );
}
