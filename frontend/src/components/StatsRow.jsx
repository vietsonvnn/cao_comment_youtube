import React from 'react';

const styles = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: 16,
  },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  value: { fontSize: 24, fontWeight: 700, color: '#fff' },
  sub: { fontSize: 11, color: '#666', marginTop: 2 },
};

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}p`;
}

export default function StatsRow({ progress }) {
  if (!progress) return null;

  const { totalVideos, processedVideos, stats, elapsed } = progress;
  const remaining = totalVideos - processedVideos;
  const estTotal = processedVideos > 0
    ? Math.round((elapsed / processedVideos) * totalVideos)
    : 0;

  return (
    <div style={styles.row}>
      <div style={styles.card}>
        <div style={styles.label}>Tổng video</div>
        <div style={styles.value}>{totalVideos.toLocaleString()}</div>
        <div style={styles.sub}>Đã quét: {processedVideos} / {totalVideos}</div>
      </div>
      <div style={styles.card}>
        <div style={styles.label}>Bình luận thu được</div>
        <div style={{ ...styles.value, color: '#4ade80' }}>
          {stats.totalComments.toLocaleString()}
        </div>
        <div style={styles.sub}>Loại bỏ chủ kênh: {stats.filteredOwner.toLocaleString()}</div>
      </div>
      <div style={styles.card}>
        <div style={styles.label}>API Quota đã dùng</div>
        <div style={{ ...styles.value, color: '#fbbf24' }}>
          {stats.quotaUsed.toLocaleString()}
        </div>
        <div style={styles.sub}>Key đang dùng: #{stats.activeKeyIndex + 1}</div>
      </div>
      <div style={styles.card}>
        <div style={styles.label}>Thời gian</div>
        <div style={styles.value}>
          {estTotal > 0 ? `~${formatElapsed(estTotal)}` : '—'}
        </div>
        <div style={styles.sub}>Đã chạy: {formatElapsed(elapsed)}</div>
      </div>
    </div>
  );
}
