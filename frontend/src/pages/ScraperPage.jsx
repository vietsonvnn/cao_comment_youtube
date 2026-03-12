import React, { useState } from 'react';
import StatsRow from '../components/StatsRow.jsx';
import VideoItem from '../components/VideoItem.jsx';
import LogPanel from '../components/LogPanel.jsx';
import TxtPreview from '../components/TxtPreview.jsx';

const s = {
  container: { maxWidth: 1200, margin: '0 auto', padding: 24 },
  section: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  h2: { fontSize: 16, marginBottom: 16, color: '#fff' },
  inputGroup: { display: 'flex', gap: 12, marginBottom: 16 },
  btn: {
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  },
  btnPrimary: { background: '#ff4444', color: '#fff' },
  btnSecondary: { background: '#2a2a2a', color: '#ccc', border: '1px solid #333' },
  btnSuccess: { background: '#166534', color: '#4ade80', border: '1px solid #22543d', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 },
  btnSm: { padding: '6px 12px', fontSize: 12 },
  optionsRow: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  checkbox: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa', cursor: 'pointer' },
  progressSection: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressHeader: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2a2a2a',
  },
  progressOverall: { padding: '16px 20px', borderBottom: '1px solid #2a2a2a' },
  progressInfo: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 },
  barContainer: { background: '#0f0f0f', borderRadius: 6, height: 8, overflow: 'hidden', marginTop: 8 },
  videoList: { maxHeight: 500, overflowY: 'auto' },
};

export default function ScraperPage({ progress, jobId, onJobId }) {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState({
    includeReplies: true,
    filterOwner: true,
    filterDuplicates: false,
    maxVideos: 0,
    minViews: 0,
    minComments: 0,
    dateFrom: '',
    dateTo: '',
    titleKeyword: '',
    titleExclude: '',
    sortOrder: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRunning = progress?.status === 'running';
  const isPaused = progress?.status === 'paused';

  async function handleStart() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), options }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      onJobId(data.jobId);
    } catch (err) {
      alert('Loi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    if (!jobId) return;
    await fetch('/api/scrape/pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  }

  async function handleResume() {
    if (!jobId) return;
    await fetch('/api/scrape/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
  }

  function handleDownloadAll() {
    if (!jobId) return;
    window.open(`/api/download/${jobId}`, '_blank');
  }

  const totalVideos = progress?.totalVideos || 0;
  const processedVideos = progress?.processedVideos || 0;
  const pct = totalVideos > 0 ? ((processedVideos / totalVideos) * 100).toFixed(1) : 0;

  return (
    <div style={s.container}>
      {/* Input */}
      <div style={s.section}>
        <h2 style={s.h2}>Nhap URL YouTube</h2>
        <div style={s.inputGroup}>
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=... hoac https://www.youtube.com/@channel"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            style={{ flex: 1 }}
          />
          {!isRunning && !isPaused && (
            <button
              style={{ ...s.btn, ...s.btnPrimary }}
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? '...' : '▶ Bat dau cao'}
            </button>
          )}
          {isRunning && (
            <button style={{ ...s.btn, ...s.btnSecondary }} onClick={handlePause}>
              ⏸ Tam dung
            </button>
          )}
          {isPaused && (
            <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleResume}>
              ▶ Tiep tuc
            </button>
          )}
        </div>
        <div style={s.optionsRow}>
          <label style={s.checkbox}>
            <input type="checkbox" checked={options.includeReplies} onChange={e => setOptions(o => ({ ...o, includeReplies: e.target.checked }))} />
            Bao gom replies
          </label>
          <label style={s.checkbox}>
            <input type="checkbox" checked={options.filterOwner} onChange={e => setOptions(o => ({ ...o, filterOwner: e.target.checked }))} />
            Loai bo comment chu kenh
          </label>
          <label style={s.checkbox}>
            <input type="checkbox" checked={options.filterDuplicates} onChange={e => setOptions(o => ({ ...o, filterDuplicates: e.target.checked }))} />
            Loai bo comment trung lap
          </label>
        </div>

        {/* Channel filter toggle */}
        <div style={{ marginTop: 12 }}>
          <button
            style={{ ...s.btn, ...s.btnSecondary, padding: '8px 14px', fontSize: 13 }}
            onClick={() => setShowFilters(f => !f)}
          >
            {showFilters ? '▾ An bo loc kenh' : '▸ Bo loc kenh (khi cao ca kenh)'}
          </button>
        </div>

        {showFilters && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Row 1: Max videos + Sort */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>So video toi da:</span>
                <input
                  type="number" min="0" placeholder="0 = tat ca"
                  value={options.maxVideos || ''}
                  onChange={e => setOptions(o => ({ ...o, maxVideos: parseInt(e.target.value) || 0 }))}
                  style={{ width: 100, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>Thu tu:</span>
                <select
                  value={options.sortOrder}
                  onChange={e => setOptions(o => ({ ...o, sortOrder: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: 13, background: '#0f0f0f', color: '#fff', border: '1px solid #333', borderRadius: 8, outline: 'none' }}
                >
                  <option value="newest">Moi nhat truoc</option>
                  <option value="oldest">Cu nhat truoc</option>
                </select>
              </div>
            </div>

            {/* Row 2: Min views + Min comments */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>Min luot xem:</span>
                <input
                  type="number" min="0" placeholder="0"
                  value={options.minViews || ''}
                  onChange={e => setOptions(o => ({ ...o, minViews: parseInt(e.target.value) || 0 }))}
                  style={{ width: 110, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>Min comments:</span>
                <input
                  type="number" min="0" placeholder="0"
                  value={options.minComments || ''}
                  onChange={e => setOptions(o => ({ ...o, minComments: parseInt(e.target.value) || 0 }))}
                  style={{ width: 110, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
            </div>

            {/* Row 3: Date range */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>Tu ngay:</span>
                <input
                  type="date"
                  value={options.dateFrom}
                  onChange={e => setOptions(o => ({ ...o, dateFrom: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: 13, background: '#0f0f0f', color: '#fff', border: '1px solid #333', borderRadius: 8 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#aaa' }}>Den ngay:</span>
                <input
                  type="date"
                  value={options.dateTo}
                  onChange={e => setOptions(o => ({ ...o, dateTo: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: 13, background: '#0f0f0f', color: '#fff', border: '1px solid #333', borderRadius: 8 }}
                />
              </div>
            </div>

            {/* Row 4: Title keyword filters */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }}>Tieu de chua:</span>
                <input
                  type="text" placeholder="vd: MV, Official..."
                  value={options.titleKeyword}
                  onChange={e => setOptions(o => ({ ...o, titleKeyword: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }}>Loai tru:</span>
                <input
                  type="text" placeholder="vd: Shorts, Live..."
                  value={options.titleExclude}
                  onChange={e => setOptions(o => ({ ...o, titleExclude: e.target.value }))}
                  style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {progress && <StatsRow progress={progress} />}

      {/* Progress */}
      {progress && progress.videos.length > 0 && (
        <div style={s.progressSection}>
          <div style={s.progressHeader}>
            <h3 style={{ fontSize: 14, color: '#fff' }}>Tien trinh xu ly</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {progress.stats.totalComments > 0 && (
                <button style={{ ...s.btn, ...s.btnSuccess }} onClick={handleDownloadAll}>
                  ⬇ Tai TXT ({progress.stats.totalComments.toLocaleString()} comments)
                </button>
              )}
            </div>
          </div>

          <div style={s.progressOverall}>
            <div style={s.progressInfo}>
              <span>Tong tien trinh: {processedVideos} / {totalVideos} video ({pct}%)</span>
              <span>~{totalVideos - processedVideos} video con lai</span>
            </div>
            <div style={s.barContainer}>
              <div style={{
                height: '100%',
                borderRadius: 6,
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #ff4444, #ff6666)',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>

          <div style={s.videoList}>
            {progress.videos.map(v => (
              <VideoItem key={v.videoId} video={v} jobId={jobId} />
            ))}
          </div>
        </div>
      )}

      {/* TXT Preview (only show when no job active) */}
      {!progress && <TxtPreview />}

      {/* Log */}
      {progress && <LogPanel logs={progress.logs} />}
    </div>
  );
}
