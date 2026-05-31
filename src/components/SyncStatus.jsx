// ═══════════════════════════════════════════════════════════
//  SyncStatus — 网络时间同步状态指示器
// ═══════════════════════════════════════════════════════════
//
// 显示三态指示：
//   - 🟢 已同步：绿色圆点 + 时间偏差值 + RTT + 客户端 IP
//   - 🟡 同步中：黄色圆点 + 呼吸动画
//   - 🔴 同步失败：橙色圆点 + 重试次数

import { memo } from 'react';

function SyncStatus({ synced, syncing, syncFailures, offset, rtt, clientIp }) {
  let status, label;
  if (syncing) {
    status = 'syncing';
    label = '正在同步网络时间…';
  } else if (synced) {
    status = 'ok';
    // 时间偏差以秒为单位显示，保留 3 位小数
    label = `已同步 · 偏差 ${offset > 0 ? '+' : ''}${(offset / 1000).toFixed(3)}s`;
  } else {
    status = 'bad';
    label = '同步失败 · 使用本地时间';
  }

  const extra = synced ? `(RTT ${rtt}ms)` : `(重试${syncFailures}次)`;

  return (
    <div className="sync-bar">
      <span className={`sync-dot ${status}`} />
      <span>{label}</span>
      <span>{extra}</span>
      {clientIp && <span>| {clientIp}</span>}
    </div>
  );
}

export default memo(SyncStatus);
