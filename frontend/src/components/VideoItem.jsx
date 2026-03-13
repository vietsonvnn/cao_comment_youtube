import React from 'react';

const styles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #1f1f1f',
    gap: 14,
    transition: 'background 0.15s',
  },
  itemRunning: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #1f1f1f',
    gap: 14,
    background: '#111828',
  },
  thumb: {
    width: 80,
    height: 45,
    background: '#333',
    borderRadius: 6,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#666',
  },
  info: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13,
    color: '#e1e1e1',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: { fontSize: 11, color: '#666', marginTop: 2 },
  progress: { width: 200, flexShrink: 0 },
  progressBar: {
    background: '#0f0f0f',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  download: { width: 36, flexShrink: 0 },
  dlBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: '1px solid #333',
    background: '#2a2a2a',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    cursor: 'pointer',
  },
  statusCol: { width: 80, textAlign: 'center', flexShrink: 0 },
  badge: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 6,
    display: 'inline-block',
  },
};

const STATUS_CONFIG = {
  running: { label: '⟳ Đang chạy', bg: '#1a2a3a', color: '#60a5fa', barColor: '#3b82f6' },
  done:    { label: '✓ Xong',       bg: '#1a3a1a', color: '#4ade80', barColor: '#22c55e' },
  pending: { label: '◌ Chờ',        bg: '#2a2a2a', color: '#888',    barColor: '#555' },
  error:   { label: '✕ Lỗi',        bg: '#3a1a1a', color: '#f87171', barColor: '#ff4444' },
  disabled:{ label: '⚠ Tắt BL',     bg: '#2a2a1a', color: '#fbbf24', barColor: '#fbbf24' },
};

export default function VideoItem({ video, jobId }) {
  const cfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.pending;
  const pct = video.commentCount > 0
    ? Math.min(100, Math.round((video.fetchedComments / video.commentCount) * 100))
    : 0;

  const canDownload = video.status === 'done' || (video.status === 'error' && video.fetchedComments > 0);

  function handleDownload() {
    if (!canDownload) return;
    window.open(`/api/download/${jobId}/${video.videoId}`, '_blank');
  }

  let metaText = '';
  if (video.status === 'running') {
    metaText = `${video.commentCount.toLocaleString()} bình luận · Trang ${video.page}/${video.totalPages || '?'}`;
  } else if (video.status === 'done') {
    metaText = `${video.fetchedComments.toLocaleString()} bình luận`;
  } else if (video.status === 'disabled') {
    metaText = 'Bình luận đã bị tắt trên video này';
  } else if (video.status === 'error') {
    metaText = `Lỗi: ${video.error || 'Không xác định'} — ${video.fetchedComments > 0 ? video.fetchedComments.toLocaleString() + ' bình luận đã lấy' : ''}`;
  } else {
    metaText = video.commentCount > 0 ? `~${video.commentCount.toLocaleString()} bình luận` : 'Chờ xử lý';
  }

  let progressText = '';
  if (video.status === 'done') {
    progressText = `${video.fetchedComments.toLocaleString()} bình luận ✓`;
  } else if (video.status === 'running') {
    progressText = `${video.fetchedComments.toLocaleString()} / ${video.commentCount.toLocaleString()}`;
  } else if (video.status === 'disabled') {
    progressText = '— bỏ qua —';
  } else if (video.status === 'error') {
    progressText = `${video.fetchedComments.toLocaleString()} / ~${video.commentCount.toLocaleString()}`;
  } else {
    progressText = 'Chờ xử lý';
  }

  return (
    <div style={video.status === 'running' ? styles.itemRunning : styles.item}>
      <div style={styles.thumb}>▶</div>
      <div style={styles.info}>
        <div style={styles.title}>{video.title}</div>
        <div style={{
          ...styles.meta,
          color: video.status === 'disabled' ? '#fbbf24' : video.status === 'error' ? '#f87171' : '#666'
        }}>
          {metaText}
        </div>
      </div>
      <div style={styles.progress}>
        <div style={styles.progressBar}>
          <div style={{
            height: '100%',
            borderRadius: 4,
            width: `${video.status === 'done' ? 100 : pct}%`,
            background: `linear-gradient(90deg, ${cfg.barColor}, ${cfg.barColor}cc)`,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={styles.progressText}>{progressText}</div>
      </div>
      <div style={styles.download}>
        <button
          style={{
            ...styles.dlBtn,
            opacity: canDownload ? 1 : 0.25,
            cursor: canDownload ? 'pointer' : 'not-allowed',
            color: video.status === 'done' ? '#4ade80' : video.status === 'error' ? '#fbbf24' : '#aaa',
            borderColor: video.status === 'done' ? '#2a4a2a' : video.status === 'error' ? '#4a3a1a' : '#333',
          }}
          onClick={handleDownload}
          title={canDownload ? 'Tải TXT video này' : 'Chưa có dữ liệu'}
        >
          ⬇
        </button>
      </div>
      <div style={styles.statusCol}>
        <span style={{ ...styles.badge, background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}
