import React from 'react';

const styles = {
  nav: {
    background: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    height: 56,
    gap: 32,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#ff4444',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabs: { display: 'flex', gap: 4 },
  tab: {
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#aaa',
    background: 'transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    background: '#2a2a2a',
  },
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 },
  status: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 12,
    background: '#1a3a1a',
    color: '#4ade80',
    border: '1px solid #2a4a2a',
  },
  statusEmpty: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 12,
    background: '#3a1a1a',
    color: '#f87171',
    border: '1px solid #5a2a2a',
  },
};

const TABS = [
  { id: 'scraper', label: 'Scraper' },
  { id: 'apikeys', label: 'API Keys' },
  { id: 'history', label: 'Lich su' },
];

export default function Navbar({ activePage, onPageChange, keysCount, quotaRemaining }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418c-.86.23-1.538.908-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814c.23.86.908 1.538 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814z"/>
          <path d="M10 15.464V8.536L16 12l-6 3.464z" fill="#0f0f0f"/>
        </svg>
        Comment Scraper
      </div>
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            style={activePage === t.id ? styles.tabActive : styles.tab}
            onClick={() => onPageChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={styles.right}>
        <div style={keysCount > 0 ? styles.status : styles.statusEmpty}>
          {keysCount > 0
            ? `● ${keysCount} keys active — ${quotaRemaining.toLocaleString()} units con lai`
            : '● Chua co API key'
          }
        </div>
      </div>
    </nav>
  );
}
