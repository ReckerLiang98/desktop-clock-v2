import '@testing-library/jest-dom';

// Mock window.matchMedia for jsdom (not implemented by default)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.electronAPI
window.electronAPI = {
  minimizeWindow: () => {},
  closeWindow: () => {},
  hideWindow: () => {},
  toggleAlwaysOnTop: () => {},
  resizeWindow: () => {},
  updateWeather: () => {},
  updateTrayTooltip: () => {},
  onWindowRestored: () => {},
  onAlwaysOnTopChanged: () => {},
  onNativeThemeChanged: () => {},
};
