// ═══════════════════════════════════════════════════════════
//  Electron 预加载脚本 — 通过 contextBridge 安全暴露 IPC API
// ═══════════════════════════════════════════════════════════
//
// 渲染进程无法直接访问 Node.js API（nodeIntegration: false），
// 通过 contextBridge 将有限的 IPC 方法注入到 window.electronAPI，
// 确保渲染进程只能调用我们明确允许的方法。

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** 最小化窗口 */
  minimizeWindow: () => ipcRenderer.send('minimize-window'),

  /** 退出应用 */
  closeWindow: () => ipcRenderer.send('close-window'),

  /** 隐藏到系统托盘 */
  hideWindow: () => ipcRenderer.send('hide-window'),

  /** 切换窗口置顶状态 */
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),

  /** 根据内容尺寸调整窗口大小（用于 12/24h 切换后自适应） */
  resizeWindow: (w, h) => ipcRenderer.send('resize-window', w, h),

  /** 向主进程发送最新天气数据（用于整点报时附送天气） */
  updateWeather: (data) => ipcRenderer.send('update-weather', data),

		/** 推送托盘提示文本（时间 + 天气） */
		updateTrayTooltip: (text) => ipcRenderer.send('update-tray-tooltip', text),

  /** 监听系统主题变化（深色/浅色模式切换） */
  onNativeThemeChanged: (cb) => {
    ipcRenderer.on('native-theme-changed', (_e, theme) => cb(theme));
  },
});
