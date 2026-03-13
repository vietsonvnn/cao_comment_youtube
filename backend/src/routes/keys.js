import { Hono } from 'hono';
import * as keyManager from '../services/keyManager.js';

const app = new Hono();

// List all keys
app.get('/', (c) => {
  const keys = keyManager.getAllKeys();
  const totalRemaining = keyManager.getTotalQuotaRemaining();
  return c.json({ keys, totalRemaining });
});

// Add key(s) — supports single `key` or bulk `keys` array
app.post('/', async (c) => {
  const body = await c.req.json();
  const rawKeys = body.keys || (body.key ? [body.key] : []);
  const validKeys = rawKeys
    .map(k => k.trim())
    .filter(k => k.length > 0 && (k.startsWith('AIza') || k.startsWith('sk-api-')));

  if (validKeys.length === 0) {
    return c.json({ error: 'Không tìm thấy API key hợp lệ (bắt đầu bằng AIza...)' }, 400);
  }

  // Skip duplicates
  const existing = keyManager.getAllKeys().map(k => k.key);
  const added = [];
  let skipped = 0;
  for (const k of validKeys) {
    const masked = k.slice(0, 8) + '●'.repeat(Math.max(0, k.length - 12)) + k.slice(-4);
    if (existing.some(e => e === masked)) {
      skipped++;
      continue;
    }
    const entry = keyManager.addKey(k);
    added.push(entry.id);
  }

  return c.json({ ok: true, added: added.length, skipped });
});

// Delete key
app.delete('/:id', (c) => {
  const id = c.req.param('id');
  keyManager.removeKey(id);
  return c.json({ ok: true });
});

// Test key
app.post('/test', async (c) => {
  const { key } = await c.req.json();
  if (!key) return c.json({ error: 'Key required' }, 400);
  const result = await keyManager.testKey(key);
  return c.json(result);
});

export default app;
