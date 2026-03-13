import React, { useEffect, useRef } from 'react';

const styles = {
  panel: {
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    marginTop: 16,
    fontFamily: 'monospace',
    fontSize: 12,
    maxHeight: 200,
    overflowY: 'auto',
  },
  header: {
    padding: '8px 12px',
    borderBottom: '1px solid #1a1a1a',
    color: '#888',
    fontSize: 11,
    display: 'flex',
    justifyContent: 'space-between',
  },
  content: { padding: '8px 12px' },
  line: { padding: '2px 0', color: '#888' },
};

const LEVEL_COLORS = {
  info: '#60a5fa',
  ok: '#4ade80',
  warn: '#fbbf24',
  error: '#f87171',
};

const LEVEL_LABELS = {
  info: 'INFO',
  ok: ' OK ',
  warn: 'WARN',
  error: ' ERR',
};

export default function LogPanel({ logs = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>Nhật ký hoạt động</span>
        <span>Tự cuộn ✓</span>
      </div>
      <div style={styles.content}>
        {logs.map((log, i) => (
          <div key={i} style={styles.line}>
            <span style={{ color: '#555' }}>[{log.time}]</span>{' '}
            <span style={{ color: LEVEL_COLORS[log.level] || '#888' }}>
              {LEVEL_LABELS[log.level] || log.level.toUpperCase()}
            </span>{' '}
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
