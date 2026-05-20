// ═══════════════════════════════════════════════════════════
//  useTimeSync — 网络时间同步 Hook
// ═══════════════════════════════════════════════════════════
//
// 启动时立刻同步一次，之后每 10 分钟自动同步
// 返回当前的时间偏移量（用于修正 Date.now()）及同步状态

import { useState, useCallback, useRef, useEffect } from 'react';
import { syncNetworkTime } from '../services/api';

const SYNC_INTERVAL = 10 * 60 * 1000; // 自动同步间隔：10 分钟

export function useTimeSync() {
  // 时间偏移量（毫秒）：本地时间 + offset ≈ 网络精确时间
  const [offset, setOffset] = useState(0);
  const [rtt, setRtt] = useState(0);            // 最近一次同步的往返延迟
  const [clientIp, setClientIp] = useState(''); // 客户端公网 IP
  const [synced, setSynced] = useState(false);  // 是否至少成功同步过一次
  const [syncFailures, setSyncFailures] = useState(0); // 连续同步失败次数
  const [syncing, setSyncing] = useState(false); // 是否正在同步中
  const [syncTz, setSyncTz] = useState(null);    // API 返回的时区信息（IP 定位）
  const intervalRef = useRef(null);

  // 用 ref 保存 synced 状态，避免在 sync 回调中使用过期的闭包值
  const syncedRef = useRef(synced);
  syncedRef.current = synced;

  /** 执行一次网络时间同步 */
  const sync = useCallback(async () => {
    setSyncing(true);
    const result = await syncNetworkTime();
    if (result) {
      setOffset(result.offset);
      setRtt(result.rtt);
      if (result.clientIp) setClientIp(result.clientIp);
      if (result.timezone) {
        setSyncTz({
          tz: result.timezone,
          offset: result.rawOffset,
          name: result.timezone.split('/').pop().replace('_', ' '),
        });
      }
      setSynced(true);
      setSyncFailures(0);  // 成功后重置失败计数
    } else {
      setSyncFailures(f => f + 1);
      // 从未成功同步过则保持 offset 为 0（使用本地时间）
      if (!syncedRef.current) setOffset(0);
    }
    setSyncing(false);
  }, []);

  // 启动时立即同步，并设置定时器每隔 10 分钟同步一次
  useEffect(() => {
    sync();
    intervalRef.current = setInterval(sync, SYNC_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [sync]);

  return { offset, rtt, clientIp, synced, syncFailures, syncing, syncTz, syncTime: sync };
}
