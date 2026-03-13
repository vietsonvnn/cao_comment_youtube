import React, { useState, useEffect } from 'react';

const s = {
  container: { maxWidth: 1200, margin: '0 auto', padding: 24 },
  title: { fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 },
  section: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, color: '#fff', marginBottom: 12, fontWeight: 600 },
  desc: { fontSize: 13, color: '#888', marginBottom: 16 },
  keyList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  keyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
  },
  keyIndex: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#2a2a2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#888',
    flexShrink: 0,
  },
  keyValue: { flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#aaa' },
  keyQuota: { width: 160, flexShrink: 0 },
  quotaText: { fontSize: 11, color: '#888', textAlign: 'right', marginTop: 3 },
  barContainer: { background: '#0f0f0f', borderRadius: 6, height: 8, overflow: 'hidden' },
  btnIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #333',
    background: '#2a2a2a',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    cursor: 'pointer',
  },
  addRow: { display: 'flex', gap: 8 },
  btn: {
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: '#ff4444',
    color: '#fff',
    whiteSpace: 'nowrap',
  },
  divider: { border: 'none', borderTop: '1px solid #2a2a2a', margin: '16px 0' },
  hint: { fontSize: 11, color: '#555', marginTop: 8 },
  optionsRow: { display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' },
  checkbox: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa', cursor: 'pointer' },
};

export default function ApiKeysPage({ onKeysUpdate }) {
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [testing, setTesting] = useState(null);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeys(data.keys || []);
      if (onKeysUpdate) onKeysUpdate(data.keys?.length || 0, data.totalRemaining || 0);
    } catch {}
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleAdd() {
    if (!newKey.trim()) return;
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey.trim() }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    setNewKey('');
    fetchKeys();
  }

  async function handleDelete(id) {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    fetchKeys();
  }

  async function handleTest(key) {
    setTesting(key.id);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.key.replace(/●/g, '') }), // Won't work with masked keys
      });
      const data = await res.json();
      alert(data.valid ? 'Key hợp lệ!' : `Key không hợp lệ: ${data.message}`);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setTesting(null);
    }
  }

  return (
    <div style={s.container}>
      <div style={s.title}>Quản lý API Keys</div>

      <div style={s.section}>
        <div style={s.sectionTitle}>YouTube Data API v3 Keys</div>
        <p style={s.desc}>
          Thêm nhiều API key để tăng quota hàng ngày. Hệ thống tự động chuyển key khi quota cạn.
          Mỗi key miễn phí có 10,000 units/ngày.
        </p>

        <div style={s.keyList}>
          {keys.map((k, i) => {
            const pct = (k.quotaUsed / k.quotaLimit) * 100;
            const barColor = pct > 90 ? '#ff4444' : k.isActive ? '#3b82f6' : '#555';
            return (
              <div key={k.id} style={{
                ...s.keyItem,
                borderColor: k.isActive ? '#2a4a2a' : '#2a2a2a',
              }}>
                <div style={{
                  ...s.keyIndex,
                  background: k.isActive ? '#166534' : '#2a2a2a',
                  color: k.isActive ? '#4ade80' : '#888',
                }}>
                  {i + 1}
                </div>
                <div style={s.keyValue}>
                  {k.key}
                  {k.isActive && <span style={{ color: '#4ade80', fontSize: 11, marginLeft: 8 }}>← đang dùng</span>}
                </div>
                <div style={s.keyQuota}>
                  <div style={s.barContainer}>
                    <div style={{
                      height: '100%',
                      borderRadius: 6,
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                    }} />
                  </div>
                  <div style={s.quotaText}>
                    {k.quotaUsed.toLocaleString()} / {k.quotaLimit.toLocaleString()} đã dùng
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    style={s.btnIcon}
                    onClick={() => handleTest(k)}
                    title="Test key"
                    disabled={testing === k.id}
                  >
                    🔍
                  </button>
                  <button
                    style={s.btnIcon}
                    onClick={() => handleDelete(k.id)}
                    title="Xoá"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          {keys.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              Chưa có API key nào. Thêm key để bắt đầu sử dụng.
            </div>
          )}
        </div>

        <hr style={s.divider} />

        <div style={s.sectionTitle}>Thêm API Key mới</div>
        <div style={s.addRow}>
          <input
            type="text"
            placeholder="Dán API key tại đây... (AIzaSy...)"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, fontFamily: 'monospace' }}
          />
          <button style={s.btn} onClick={handleAdd}>+ Thêm key</button>
        </div>
        <p style={s.hint}>
          Lấy API key tại: console.cloud.google.com → APIs & Services → Credentials
        </p>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Cài đặt Key Rotation</div>
        <div style={s.optionsRow}>
          <label style={s.checkbox}>
            <input type="checkbox" defaultChecked /> Tự động chuyển key khi quota {'<'} 200 units
          </label>
          <label style={s.checkbox}>
            <input type="checkbox" defaultChecked /> Tự động tiếp tục khi quota reset (00:00 UTC)
          </label>
        </div>
      </div>
    </div>
  );
}
