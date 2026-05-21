// ═══════════════════════════════════════════════════════════
//  Electron 主进程 — 窗口管理、系统托盘、IPC 通信、整点报时
// ═══════════════════════════════════════════════════════════

const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain, Notification, nativeTheme } = require('electron');
const path = require('path');

// 开发模式下从 Vite 开发服务器加载页面，生产模式下加载构建后的 dist 文件
const isDev = process.env.DEV === 'true';
let win = null;           // 主窗口实例
let tray = null;          // 系统托盘实例
let alwaysOnTop = false;  // 窗口置顶状态
let lastChimeHour = -1;   // 上一次整点报时的小时数，防止重复报时
let latestWeather = null; // 最新天气数据，由渲染进程通过 IPC 发送

// ── 创建主窗口 ─────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 440,
    minWidth: 440,
    minHeight: 340,
    resizable: true,
    frame: false,              // 无边框窗口
    transparent: true,         // 透明背景，由 CSS 提供圆角视觉效果
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    skipTaskbar: false,
    icon: path.join(__dirname, '..', 'assets', 'icon-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // 预加载脚本路径
      contextIsolation: true,   // 启用上下文隔离（安全）
      nodeIntegration: false,   // 禁止渲染进程直接使用 Node API
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.setAlwaysOnTop(false, 'floating');
  win.center();

  // 页面加载完成后，向渲染进程发送当前系统主题
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('native-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  });

  win.on('closed', () => { win = null; });

}

// ── 创建系统托盘 ────────────────────────────────────────────
function createTray() {
  // 猫猫时钟图标 (32x32 PNG base64)
  const icon = nativeImage.createFromBuffer(Buffer.from(
    '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',
    'base64'), { width: 32, height: 32 });
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  updateTrayMenu();
  tray.setToolTip('桌面时钟');
  tray.on('double-click', () => {
    if (win) win.isVisible() ? win.hide() : win.show();
  });
}

// 更新托盘右键菜单（置顶选项需要同步状态）
function updateTrayMenu() {
  const ctx = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { if (win) { win.show(); win.focus(); } } },
    { label: '隐藏窗口', click: () => { if (win) win.hide(); } },
    { label: '窗口置顶', type: 'checkbox', checked: alwaysOnTop, click: (mi) => {
      alwaysOnTop = mi.checked;
      if (win) win.setAlwaysOnTop(alwaysOnTop, 'floating');
    }},
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } },
  ]);
  tray.setContextMenu(ctx);
}

// ── IPC 通信处理 ────────────────────────────────────────────
// 渲染进程通过 preload.js 暴露的 API 发送 IPC 消息，主进程在此处理
ipcMain.on('minimize-window', () => { if (win) win.minimize(); });

ipcMain.on('resize-window', (_e, w, h) => {
  if (win) win.setSize(Math.ceil(w), Math.ceil(h), true);
});

ipcMain.on('toggle-always-on-top', () => {
  alwaysOnTop = !alwaysOnTop;
  if (win) win.setAlwaysOnTop(alwaysOnTop, 'floating');
  updateTrayMenu();  // 同步托盘菜单中的置顶勾选状态
});

// 隐藏到托盘时，首次显示一条提示通知
let trayNotified = false;
ipcMain.on('hide-window', () => {
  if (win) {
    win.hide();
    if (!trayNotified) {
      trayNotified = true;
      new Notification({ title: '桌面时钟', body: '桌面时钟正在后台运行，双击托盘图标可恢复窗口', silent: true, urgency: 'low' }).show();
    }
  }
});

ipcMain.on('close-window', () => { app.quit(); });

	// 接收渲染进程发送的最新天气数据，用于整点报时附送天气信息
	ipcMain.on('update-weather', (_e, data) => { latestWeather = data; });

	// 渲染进程推送托盘提示文本（时间 + 天气）
	ipcMain.on('update-tray-tooltip', (_e, text) => {
		if (tray) tray.setToolTip(text);
	});
// ── 系统主题变化监听 ──────────────────────────────────────
// Windows 切换深色/浅色模式时，通知渲染进程更新 UI 主题
nativeTheme.on('updated', () => {
  if (win) win.webContents.send('native-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
});

// ── 整点报时 ───────────────────────────────────────────────
// 根据当前小时生成对应的中文时段描述
function getChimeText() {
  const now = new Date();
  const h = now.getHours();
  let label;
  if (h === 0) label = '午夜12点';
  else if (h < 6) label = '凌晨' + h + '点';
  else if (h < 9) label = '早上' + h + '点';
  else if (h < 12) label = '上午' + h + '点';
  else if (h === 12) label = '中午12点';
  else if (h < 18) label = '下午' + (h - 12) + '点';
  else if (h < 19) label = '傍晚' + (h - 12) + '点';
  else label = '晚上' + (h - 12) + '点';
  let text = `🕐 现在是${label}整`;
  if (latestWeather) {
    text += ` | ${latestWeather.iconEmoji} ${latestWeather.weather} ${latestWeather.temp}`;
  }
  return text;
}

// 每秒检查一次，在 xx:00:00 时触发整点报时通知
function startChime() {
  setInterval(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    if (m === 0 && s === 0 && h !== lastChimeHour) {
      lastChimeHour = h;
      new Notification({ title: '桌面时钟 · 整点报时', body: getChimeText(), silent: false, urgency: 'normal' }).show();
    }
  }, 1000);
}

// ── 应用生命周期 ────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  createTray();
  startChime();
  // 全局快捷键 Ctrl+Shift+T：切换窗口显示/隐藏
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (win) win.isVisible() ? win.hide() : win.show();
  });
});

app.on('window-all-closed', () => { app.quit(); });
app.on('will-quit', () => { globalShortcut.unregisterAll(); });
