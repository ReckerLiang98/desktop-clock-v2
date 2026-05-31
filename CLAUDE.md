# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**语言偏好：请永远使用中文和我对话。**

**工作流程：添加新功能或修复 Bug 后，先用 `npm run dev` 启动应用让用户验收效果。验收通过后，再进行 `git commit`、`git push`、打包（`npm run pack` + `npm run dist`）和 GitHub Release 上传。**

## Project Overview

桌面时钟 (Desktop Clock v2) — Electron + React + Vite. Frameless transparent window with millisecond-precision time display, network time sync (RTT-compensated), IP-based timezone & weather, 24 solar terms (二十四节气), Chinese holidays (节假日), Chinese lunar calendar (1900–2100), Fluent Design dark/light themes (auto-follow system or manual), system tray, and hourly chime notifications.

## Commands

```bash
npm run dev         # Dev: starts Vite + launches Electron (loads from http://localhost:5173)
npm run pack        # Production step 1: vite build + electron-packager → release/桌面时钟-win32-x64/
npm run dist        # Production step 2: electron-builder NSIS installer from pre-packaged app
npm test            # Run all 121 unit tests (vitest)
npm run test:watch  # Run tests in watch mode
```

`npm run dev` uses `concurrently` to run Vite and Electron in parallel, with `wait-on` ensuring Electron launches only after the Vite dev server is ready. `cross-env DEV=true` tells `electron/main.js` to load from the dev server instead of `dist/index.html`.

Packaging is two-step because electron-builder alone triggers Windows Defender false positives. Step 1 (`pack`) uses electron-packager to create the unpacked app; step 2 (`dist`) runs electron-builder with `--prepackaged` pointing to the output of step 1.

## Architecture

### Process model

```
electron/main.js  ──(IPC)──  electron/preload.js  ──(contextBridge)──  src/ (React renderer)
```

The main process manages the `BrowserWindow` (frameless, transparent, default 600×440, min 440×340), `Tray`, `Notification` (hourly chime with weather info), and `nativeTheme` monitoring. Weather data is sent from the renderer via IPC (`update-weather`) and stored in `latestWeather` for inclusion in chime notifications (`"🕐 现在是…整 | ☀️ 晴天 22°C"`). It exposes no Node.js APIs directly — the preload script uses `contextBridge.exposeInMainWorld('electronAPI', ...)` to inject a limited set of IPC methods. The renderer calls `window.electronAPI.*` for window control (minimize, close, hide-to-tray, resize, toggle-always-on-top) and listens to `onNativeThemeChanged` for system theme updates.

### Data flow (renderer)

`App.jsx` is the single state owner. Data flows down through props; there is no global store or context.

```
useTimeSync (network offset + IP timezone)
     │
     ▼
useClock (corrected time tick @ 33ms)  ──►  ClockFace, DateDisplay
     │
useSystemTheme (auto/dark/light)       ──►  CSS class on .app-root
     │
fetchWeather (wttr.in → Open-Meteo fallback)  ──►  Weather
```

- **Time computation chain**: `Date.now() + offset (network correction) + tzOffset (seconds) = local time at target timezone`. All time math happens in `useClock.js:tick()`.
- **Timezone resolution priority**: manual selection (`tzManual` in localStorage) → IP auto-detect (`syncTz` from worldtimeapi) → system timezone fallback.
- **Theme resolution**: user choice (`localStorage`) → system `nativeTheme` → CSS `.dark` / `.light` class on `.app-root`.

### Key implementation details

- **Network time sync** (`src/services/api.js`): Tries `worldtimeapi.org/api/ip` first, falls back to `timeapi.io`. RTT compensation: `offset = serverEpoch + RTT/2 - Date.now()`. The `timeapi.io` endpoint returns local time + `utc_offset` string, so the offset is stripped to reconstruct UTC. Sync runs on startup and every 10 minutes (`useTimeSync.js`).

- **Lunar calendar** (`src/utils/lunar.js`): 201 years (1900–2100) encoded as hex integers. Bit layout: bits 0-3 = leap month index (0 = none), bits 4-15 = 12 month sizes (1=30d, 0=29d), bit 16 = leap month size. Also exports `getCurrentSolarTerm()` (returns current period by finding most recent term on/before date), `isSolarTermDay()` (returns term name only if today is exactly a term day — **this is what the UI uses**), and `getHoliday()` (lunar holidays: 春节/元宵/端午/七夕/中秋/重阳/除夕; Gregorian: 元旦/劳动节/国庆节 etc.).

- **Rendering optimization** (`src/hooks/useClock.js`): Ticks at ~30fps (33ms interval) but only triggers React re-renders on second changes. Between seconds, it uses functional state update to change only the millisecond field, avoiding full re-render of date/lunar components. All dynamic values (`is24`, `offset`, `tzOffset`) are read from refs inside `tick()`, so the `setInterval` is created once with an empty dependency array — no timer restarts on toggle. In 12h mode, the period label uses 7 granular Chinese time periods: 凌晨(0-5), 早上(6-8), 上午(9-11), 中午(12), 下午(13-17), 傍晚(18), 晚上(19-23).

- **Layout stability strategy**: The ampm indicator and millisecond display are always rendered in the DOM with `visibility: hidden/visible` (never `display: none`). This reserves their layout space permanently, so toggling 12/24h format or ms display never changes the container width — no window resize is triggered. The `prevIs24` resize effect was deliberately removed; only weather appearance/disappearance triggers `resizeWindow`.

- **Window resize** (`App.jsx:resizeWindow`): Measures `.container.offsetWidth/Height` (not `#root`'s viewport-dependent dimensions), adds +32/+56 padding for window chrome. Uses double `requestAnimationFrame` to wait for layout. Has a 200px minimum-size guard to prevent setting a near-zero window (container hasn't laid out yet when called too early). Caches `lastSize` ref to skip redundant `setSize` calls. **Important**: Never call `resizeWindow` in a mount effect — the container will not have its final layout yet.

- **Weather** (`src/services/api.js`): Primary source is wttr.in with `lang=zh-cn` (single request, IP location + weather in one call, fastest). Fallback is Open-Meteo + ipapi.co (two sequential requests, WMO codes mapped to Chinese). Weather fetch fires immediately on mount — it does NOT wait for `clientIp` from time sync. Auto-refreshes every hour (`setInterval` in App.jsx). Refresh via W key, toolbar refresh button, or the Weather component's refresh button. After each successful fetch, weather data is sent to the main process via IPC (`update-weather`) for inclusion in hourly chime notifications.

- **Milliseconds toggle**: `showMs` state (default `false`). Controlled via `.ms` toolbar button or M key. The ms span always occupies layout space (`visibility` toggle) so window doesn't resize.

- **Tray tooltip** (`App.jsx`): Every 30 seconds, the renderer pushes a formatted string `"HH:MM · ☀️ 晴天 22°C"` to the main process via `update-tray-tooltip` IPC. The main process calls `tray.setToolTip(text)` to update the hover tooltip. Uses refs (`time4TrayRef`, `weather4TrayRef`) to avoid re-creating the interval when data changes; only re-creates on `is24` toggle.

- **Close flow**: Clicking X checks `localStorage('clock_close_action_v2')`. If `'quit'` → quit immediately; if `'tray'` → hide to tray; otherwise show `CloseDialog` with "remember my choice" checkbox.

- **App icon** (`assets/icon.svg`): Cat clock design (orange ears, cat face on clock). Generated to PNG/ICO via `scripts/make-icons.js` (uses `sharp`). `icon-256.ico` for exe embedding, `icon-256.png` for window icon, `icon-32.png` for system tray.

- **System theme**: Electron `nativeTheme.on('updated')` sends the new theme to the renderer via IPC. The renderer also listens to `matchMedia('prefers-color-scheme: dark')` as a browser-environment fallback. Three modes: `auto` (follow system), `dark`, `light` — cycled on T key or toolbar button.

- **Timezone menu** (`TimezoneMenu.jsx`): 55 cities across 9 regions. Uses `useLayoutEffect` to dynamically set `max-height` based on available viewport space (`window.innerHeight - menuTop - 12`), clamped to [100, 600]. Custom scrollbar (12px wide, visible track background). Has `-webkit-app-region: no-drag`. **Active city matching uses `tz` identifier** (e.g. `Asia/Shanghai`), NOT `offset` — many cities share the same UTC offset and matching by offset would highlight them all falsely. When auto mode is active, no preset city is highlighted — only the "IP自动检测" option shows as active.

## Gotchas

- **`setAlwaysOnTop` level must be `'floating'`, not `'screen-saver'`**: On Windows 10/11, the `'screen-saver'` Z-order level is reserved for system screen savers. When ordinary application windows call `setAlwaysOnTop(true, 'screen-saver')`, Windows **silently ignores** it — no error is thrown, but the window never becomes topmost. Always use `'floating'` (maps to `WS_EX_TOPMOST`).
- **TimezoneMenu active matching must use `tz` identifier, not `offset`**: In the expanded 55-city list, many cities share the same UTC offset (8 cities at UTC+8: 北京/台北/香港/乌兰巴托/新加坡/吉隆坡/马尼拉/珀斯). Matching by `offset` causes ALL same-offset cities to highlight simultaneously. Match by the IANA timezone string (`t.tz`) instead.
- **Dev mode won't work without Vite running**: `npm run dev` handles this with `wait-on`. If running `electron .` manually with `DEV=true`, start `vite` separately first.
- **Never call resizeWindow on mount**: The `.container` element hasn't completed layout yet — `offsetHeight` reads ~0, which would set the window to ~32×56 pixels (invisible). The 200px guard in `resizeWindow` is a secondary defense.
- **12/24h and ms toggles intentionally don't resize**: Both use `visibility: hidden` (not `display: none` or conditional rendering) so layout space is always reserved. Do not add resize triggers for these toggles.
- **Windows Defender locks build output**: The `release/桌面时钟-win32-x64/` directory may be locked after packaging. Kill any running electron/clock processes first, then use PowerShell `Remove-Item -Path 'release' -Recurse -Force`.
- **Two-step packaging**: Always use `npm run pack` then `npm run dist`. Running electron-builder directly triggers Defender and fails with ENOENT on electron.exe.
- **Window resize timing**: `resizeWindow` uses double `requestAnimationFrame` to wait for the DOM to settle after React state changes.
- **Stale closures in effects**: All handlers used in `useEffect` dependencies (`toggle24`, `toggleMs`, `cycleTheme`, `syncTime`, `loadWeather`) are wrapped in `useCallback`.
- **useClock ref pattern**: `is24`, `offset`, and `tzOffset` are passed through refs inside the `tick()` closure, not through the effect dependency array. The `setInterval` effect has `[]` deps — changing these values does NOT recreate the timer.
- **Weather Open-Meteo fallback has no humidity**: The Open-Meteo path sets `humidity: ''`. Always conditionally render humidity: `{data.humidity && <span>💧{data.humidity}</span>}`.
- **Solar term only shows on exact day**: `isSolarTermDay()` returns `null` on non-term days. The DateDisplay renders nothing (`null`) when both `holiday` and `solarTerm` are falsy — avoid empty `<div>` elements that consume vertical space from `margin-top` + `line-height`.
- **GitHub Release upload via Node.js https module**: No `gh` CLI available. Use `https.request` to call GitHub API (Create Release → DELETE old assets → Upload asset). Need classic PAT with `repo` scope.
- **Lunar calendar bit offset MUST use `0x8000` as starting mask**: The 12 month sizes are stored in bits 4-15, with month 1 (正月) at bit 15. The bit-reading loops must start at `0x8000` (bit 15) and shift right, NOT `0x10000` (bit 16) — using the wrong mask shifts all month sizes by one position, causing all lunar dates to be systematically wrong. This bug was present in three places (`daysInLunarYear`, `solarToLunar` month loop, `getHoliday` 腊月 calculation) and was discovered by test cases comparing against known Chinese New Year dates.
- **Test infrastructure uses vitest + jsdom**: Test files in `src/tests/` with setup in `src/tests/setup.js`. The setup mocks `window.matchMedia` (not implemented by jsdom) and `window.electronAPI` (contextBridge). Vitest config in `vitest.config.js` uses `@vitejs/plugin-react` and `jsdom` environment. Do NOT use JSON.stringify to serialize hook return values in tests — functions (useCallback, setState) are lost. Use test helper components with data-testid attributes instead.
