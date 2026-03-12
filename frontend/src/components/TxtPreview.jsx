import React from 'react';

const styles = {
  section: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 16, color: '#fff', fontWeight: 600 },
  hint: { fontSize: 11, color: '#888' },
  pre: {
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: 16,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 1.7,
    color: '#ccc',
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  note: { fontSize: 11, color: '#666', marginTop: 8 },
  meta: { color: '#555' },
  likes: { color: '#4ade80' },
};

export default function TxtPreview() {
  return (
    <div style={styles.section}>
      <div style={styles.header}>
        <div style={styles.title}>Xem truoc dinh dang file TXT</div>
        <span style={styles.hint}>Moi comment = 1 block, ngan cach bang dong trong</span>
      </div>
      <div style={styles.pre}>
        <span style={styles.meta}>{'===== Video: Hay Trao Cho Anh - Son Tung M-TP ft. Snoop Dogg ====='}</span>{'\n'}
        <span style={styles.meta}>{'===== URL: https://youtube.com/watch?v=knW7-x7Y7RE ====='}</span>{'\n'}
        <span style={styles.meta}>{'===== Total: 45,892 comments ====='}</span>{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 15,234 | Replies: 847]</span>{'\n'}
        {'MV nay la dinh cao cua nhac Viet, khong ai co the phu nhan!'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 8,102 | Replies: 234]</span>{'\n'}
        {'Nghe di nghe lai van khong chan, Son Tung qua tai nang'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 45 | Replies: 3]</span>{'\n'}
        {'Beat qua xin, xem MV bao nhieu lan van thay dep'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 2 | Replies: 0]</span>{'\n'}
        {'moi nghe lan dau, hay qua moi nguoi oi'}
      </div>
      <p style={styles.note}>
        Likes = so like cua comment · Replies = so luot tra loi comment do · Comment chu kenh da bi loai
      </p>
    </div>
  );
}
