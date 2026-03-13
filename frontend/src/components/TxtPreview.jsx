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
        <div style={styles.title}>Xem trước định dạng file TXT</div>
        <span style={styles.hint}>Mỗi bình luận = 1 block, ngăn cách bằng dòng trống</span>
      </div>
      <div style={styles.pre}>
        <span style={styles.meta}>{'===== Video: Hãy Trao Cho Anh - Sơn Tùng M-TP ft. Snoop Dogg ====='}</span>{'\n'}
        <span style={styles.meta}>{'===== URL: https://youtube.com/watch?v=knW7-x7Y7RE ====='}</span>{'\n'}
        <span style={styles.meta}>{'===== Total: 45,892 bình luận ====='}</span>{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 15,234 | Replies: 847]</span>{'\n'}
        {'MV này là đỉnh cao của nhạc Việt, không ai có thể phủ nhận!'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 8,102 | Replies: 234]</span>{'\n'}
        {'Nghe đi nghe lại vẫn không chán, Sơn Tùng quá tài năng'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 45 | Replies: 3]</span>{'\n'}
        {'Beat quá xịn, xem MV bao nhiêu lần vẫn thấy đẹp'}{'\n'}
        {'\n'}
        <span style={styles.likes}>[Likes: 2 | Replies: 0]</span>{'\n'}
        {'mới nghe lần đầu, hay quá mọi người ơi'}
      </div>
      <p style={styles.note}>
        Likes = số like của bình luận · Replies = số lượt trả lời bình luận đó · Bình luận chủ kênh đã bị loại
      </p>
    </div>
  );
}
