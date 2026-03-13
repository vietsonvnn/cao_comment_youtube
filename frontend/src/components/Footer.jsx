const styles = {
  footer: {
    textAlign: 'center',
    padding: '24px 0 32px',
    marginTop: 40,
    borderTop: '1px solid #1a1a1a',
    fontSize: 13,
    color: '#555',
  },
  heart: {
    color: '#ff4444',
    fontSize: 15,
    margin: '0 4px',
    display: 'inline-block',
    animation: 'heartbeat 1.2s ease-in-out infinite',
  },
  name: {
    color: '#e1e1e1',
    fontWeight: 700,
    letterSpacing: 0.5,
  },
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
      Made with <span style={styles.heart}>&#10084;</span> by <span style={styles.name}>Jution</span>
    </footer>
  );
}
