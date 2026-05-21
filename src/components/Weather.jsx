// ═══════════════════════════════════════════════════════════
//  Weather — IP 定位天气显示
// ═══════════════════════════════════════════════════════════
//
// 以一行紧凑格式展示当前天气信息：
//   [天气图标] [位置] [温度] [天气描述] [💧湿度] [🔄刷新]
//
// 天气数据来自 wttr.in 免费 API（无需 API Key），
// 点击刷新按钮或按 W 键可手动刷新

export default function Weather({ data, loading, onRefresh }) {
  if (!data) return null;

  return (
    <div className="weather-bar">
      {/* 天气图标（从 API 响应的 iconEmoji 字段获取） */}
      <span className="weather-icon">{data.iconEmoji}</span>
      <span>{data.location || data.country}</span>
      <span>{data.temp}</span>
      <span>{data.weather}</span>
      {data.humidity && <span>💧{data.humidity}</span>}
      {/* 手动刷新按钮 */}
      <button
        className="weather-refresh-btn"
        onClick={onRefresh}
        disabled={loading}
        title="刷新天气 (W)"
      >
        {loading ? '⏳' : '🔄'}
      </button>
    </div>
  );
}
