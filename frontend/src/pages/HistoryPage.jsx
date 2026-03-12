import React, { useState, useEffect } from 'react';

const s = {
  container: { maxWidth: 1200, margin: '0 auto', padding: 24 },
  title: { fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    marginBottom: 8,
    gap: 16,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: '#2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  info: { flex: 1 },
  jobTitle: { fontSize: 14, color: '#e1e1e1' },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  actions: { display: 'flex', gap: 8 },
  btn: {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  btnSec: { background: '#2a2a2a', color: '#ccc', border: '1px solid #333' },
  btnPrimary: { background: '#ff4444', color: '#fff' },
  btnDanger: { background: '#2a2a2a', color: '#f87171', border: '1px solid #3a2a2a' },
  empty: { textAlign: 'center', color: '#666', padding: 40 },
};

export default function HistoryPage({ onResumeJob }) {
  const [jobs, setJobs] = useState([]);

  async function fetchHistory() {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {}
  }

  useEffect(() => { fetchHistory(); }, []);

  async function handleDelete(jobId) {
    await fetch(`/api/history/${jobId}`, { method: 'DELETE' });
    fetchHistory();
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const statusLabels = {
    done: 'Hoan tat',
    running: 'Dang chay',
    paused: 'Tam dung',
    error: 'Loi',
  };

  return (
    <div style={s.container}>
      <div style={s.title}>Lich su scraping</div>

      {jobs.length === 0 && (
        <div style={s.empty}>Chua co lich su scraping nao.</div>
      )}

      {jobs.map(job => (
        <div key={job.jobId} style={s.item}>
          <div style={s.icon}>{job.type === 'channel' ? '📺' : '🎬'}</div>
          <div style={s.info}>
            <div style={s.jobTitle}>
              {job.type === 'channel'
                ? `${job.channelTitle || job.url} — ${job.totalVideos} video`
                : `Video don: ${job.channelTitle || job.url}`
              }
            </div>
            <div style={s.meta}>
              {job.totalComments.toLocaleString()} comments · {formatDate(job.startedAt)} · {statusLabels[job.status] || job.status}
            </div>
          </div>
          <div style={s.actions}>
            <button
              style={{ ...s.btn, ...s.btnSec }}
              onClick={() => window.open(`/api/download/${job.jobId}`, '_blank')}
            >
              ⬇ TXT
            </button>
            {(job.status === 'paused' || job.status === 'running') && (
              <button
                style={{ ...s.btn, ...s.btnPrimary }}
                onClick={() => onResumeJob && onResumeJob(job.jobId)}
              >
                Tiep tuc
              </button>
            )}
            <button
              style={{ ...s.btn, ...s.btnDanger }}
              onClick={() => handleDelete(job.jobId)}
            >
              Xoa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
