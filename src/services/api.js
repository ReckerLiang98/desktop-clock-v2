// ═══════════════════════════════════════════════════════════
//  API 服务层 — 网络时间同步 & IP 定位天气 & 气象预警
// ═══════════════════════════════════════════════════════════

// 网络时间服务端点（按优先级排列）
// worldtimeapi: 返回 unixtime、时区偏移、客户端 IP
// timeapi.io:   备用端点，格式不同需要额外解析
const TIME_ENDPOINTS = [
  'https://worldtimeapi.org/api/ip',
  'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai',
];

/**
 * 通过网络时间服务器获取精确时间，并进行 RTT 往返延迟补偿
 *
 * 补偿原理：
 *   RTT（往返时间）= t1 - t0（请求发出到收到响应的时间差）
 *   假设网络对称，单向延迟 ≈ RTT / 2
 *   时间偏移 = 服务器时间 + RTT/2 - 本地时间
 *
 * @returns {{ offset, rtt, clientIp, timezone, rawOffset } | null}
 */
export async function syncNetworkTime() {
  for (const url of TIME_ENDPOINTS) {
    try {
      const t0 = performance.now();  // 记录请求发出时间
      const res = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const t1 = performance.now();  // 记录响应到达时间

      // 解析服务器返回的时间戳（不同 API 的字段名不同）
      let serverEpoch;
      if (data.unixtime !== undefined) {
        // worldtimeapi: unixtime 是秒级 Unix 时间戳，需转为毫秒
        serverEpoch = data.unixtime * 1000;
      } else if (data.utc_datetime) {
        serverEpoch = new Date(data.utc_datetime).getTime();
      } else if (data.dateTime) {
        // timeapi.io: 返回本地时间 + UTC 偏移量，需要减去偏移量得到 UTC 时间
        serverEpoch = new Date(data.dateTime).getTime();
        if (data.utc_offset) {
          const m = data.utc_offset.match(/([+-]\d{2}):(\d{2})/);
          if (m) serverEpoch -= (parseInt(m[1]) * 60 + parseInt(m[2])) * 60 * 1000;
        }
      } else {
        continue;
      }

      const rtt = Math.round(t1 - t0);
      // RTT 补偿后的本地时钟偏移量（正值 = 本机慢于网络时间）
      const offset = (serverEpoch + rtt / 2) - Date.now();

      // 提取时区信息（worldtimeapi 返回 raw_offset + timezone）
      let timezone = null, rawOffset = null;
      if (data.raw_offset !== undefined && data.timezone) {
        timezone = data.timezone;
        rawOffset = data.raw_offset;
      }

      return { offset, rtt, clientIp: data.client_ip || null, timezone, rawOffset };
    } catch (_) { /* 当前端点失败，尝试下一个 */ }
  }
  return null;
}

// wttr.in 天气代码 → emoji（备用数据源的映射表）
const WEATHER_ICONS = {
  113: '☀️', 116: '⛅', 119: '☁️', 122: '☁️', 143: '🌫️',
  176: '🌦️', 179: '🌨️', 182: '🌨️', 185: '🌧️', 200: '⛈️',
  227: '💨', 230: '❄️', 248: '🌫️', 260: '🌫️', 263: '🌧️',
  266: '🌧️', 281: '🌧️', 284: '🌧️', 293: '🌧️', 296: '🌧️',
  299: '🌧️', 302: '🌧️', 305: '🌧️', 308: '🌧️', 311: '🌧️',
  314: '🌧️', 317: '🌧️', 320: '🌨️', 323: '🌨️', 326: '🌨️',
  329: '❄️', 332: '❄️', 335: '❄️', 338: '❄️', 350: '🌧️',
  353: '🌧️', 356: '🌧️', 359: '🌧️', 362: '🌧️', 365: '🌧️',
  368: '🌨️', 371: '❄️', 374: '🌧️', 377: '🌧️', 386: '⛈️',
  389: '⛈️', 392: '⛈️', 395: '❄️',
};

// WMO 天气代码 → 中文描述 + emoji（来源：Open-Meteo）
const WMO_INFO = {
  0:  ['☀️', '晴天'],
  1:  ['🌤️', '少云'],
  2:  ['⛅', '多云'],
  3:  ['☁️', '阴天'],
  45: ['🌫️', '有雾'],
  48: ['🌫️', '霜雾'],
  51: ['🌧️', '小毛毛雨'],
  53: ['🌧️', '毛毛雨'],
  55: ['🌧️', '大毛毛雨'],
  56: ['🌧️', '冻毛毛雨'],
  57: ['🌧️', '冻毛毛雨'],
  61: ['🌧️', '小雨'],
  63: ['🌧️', '中雨'],
  65: ['🌧️', '大雨'],
  66: ['🌧️', '冻雨'],
  67: ['🌧️', '冻雨'],
  71: ['🌨️', '小雪'],
  73: ['🌨️', '中雪'],
  75: ['❄️', '大雪'],
  77: ['❄️', '雪粒'],
  80: ['🌧️', '阵雨'],
  81: ['🌧️', '中阵雨'],
  82: ['🌧️', '大阵雨'],
  85: ['🌨️', '小阵雪'],
  86: ['🌨️', '大阵雪'],
  95: ['⛈️', '雷暴'],
  96: ['⛈️', '冰雹雷暴'],
  99: ['⛈️', '强冰雹雷暴'],
};

// 气象预警等级 → 中文标签 + emoji（按 QWeather 颜色代码索引）
const WARNING_SEVERITY = {
  blue:    { label: '蓝色预警', color: '#3388FF', emoji: '🔵' },
  yellow:  { label: '黄色预警', color: '#E8B800', emoji: '🟡' },
  orange:  { label: '橙色预警', color: '#E87800', emoji: '🟠' },
  red:     { label: '红色预警', color: '#E83030', emoji: '🔴' },
};

/**
 * 获取天气数据（基于设备 IP 地址定位，优先 wttr.in 单请求快速响应，Open-Meteo 作为备用）
 *
 * 数据源：
 *   1. wttr.in      — 单次请求，IP 定位 + 天气一并返回（最快）
 *   2. Open-Meteo + ipapi.co — 两次请求，无 rate-limit，作为可靠备用
 *
 * @returns {{ location, country, latitude, longitude, temp, weather, humidity, icon, iconEmoji } | null}
 */
export async function fetchWeather() {
  // ── 方案一：wttr.in（单请求，速度最快）──
  try {
    const res = await fetch('https://wttr.in/?format=j1&lang=zh-cn', {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const cur = data.current_condition[0];
      return {
        location: data.nearest_area?.[0]?.areaName?.[0]?.value || '',
        country: data.nearest_area?.[0]?.country?.[0]?.value || '',
        latitude: data.nearest_area?.[0]?.latitude || null,
        longitude: data.nearest_area?.[0]?.longitude || null,
        temp: cur.temp_C + '°C',
        weather: cur.weatherDesc[0].value,
        humidity: cur.humidity + '%',
        icon: cur.weatherCode,
        iconEmoji: WEATHER_ICONS[cur.weatherCode] || '🌤️',
      };
    }
  } catch (_) { /* 方案一失败，尝试备用方案 */ }

  // ── 方案二：Open-Meteo + ipapi.co（备用）──
  try {
    const geoRes = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    if (!geoRes.ok) throw new Error('geo fail');
    const geo = await geoRes.json();
    if (!geo.latitude || !geo.longitude) throw new Error('no coords');

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true&timezone=auto`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!weatherRes.ok) throw new Error('weather fail');
    const weather = await weatherRes.json();
    const cur = weather.current_weather;

    const info = WMO_INFO[cur.weathercode] || ['🌤️', '未知'];
    return {
      location: geo.city || geo.region || '未知位置',
      country: geo.country_name || '',
      latitude: geo.latitude,
      longitude: geo.longitude,
      temp: Math.round(cur.temperature) + '°C',
      weather: info[1],
      humidity: '',
      icon: cur.weathercode,
      iconEmoji: info[0],
    };
  } catch (_) { /* 备用方案也失败 */ }

  return null;
}

/**
 * 获取中国境内气象预警信号（和风天气 Weather Alert v1 API）
 *
 * 数据源：devapi.qweather.com（免费订阅，每日 1000 次调用）
 * 每 15 分钟调用一次，仅需 96 次/天
 *
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @param {string} apiKey - 和风天气 API Key
 * @returns {Array<{id, headline, severity, color, typeName, description, instruction, effectiveTime, expireTime}> | null}
 *         无预警时返回 []，网络/API 错误时返回 null
 */
export async function fetchWarnings(lat, lon, apiKey) {
  if (!lat || !lon || !apiKey) return null;

  try {
    const url = `https://devapi.qweather.com/weatheralert/v1/current/${lat}/${lon}?key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();

    // QWeather 返回码：200 = 成功，204 = 无数据，其余 = 错误
    if (data.code !== '200') return null;

    const alerts = data.alerts || data.alert || [];
    if (!Array.isArray(alerts) || alerts.length === 0) return [];

    // 精简字段：只保留 UI 和通知所需的
    return alerts.map(a => ({
      id: a.id || '',
      headline: a.headline || a.title || '',
      severity: a.severity || 'minor',
      color: (a.color && a.color.code) ? a.color.code : (a.severityColor || 'blue'),
      typeName: (a.eventType && a.eventType.name) ? a.eventType.name : (a.typeName || ''),
      description: a.description || a.text || '',
      instruction: a.instruction || '',
      effectiveTime: a.effectiveTime || a.startTime || '',
      expireTime: a.expireTime || a.endTime || '',
    }));
  } catch (_) {
    return null;
  }
}

export { WARNING_SEVERITY };
