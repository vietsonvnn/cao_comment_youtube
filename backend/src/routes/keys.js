import { Hono } from 'hono';
import * as keyManager from '../services/keyManager.js';

const app = new Hono();

// List all keys
app.get('/', (c) => {
  const keys = keyManager.getAllKeys();
  const totalRemaining = keyManager.getTotalQuotaRemaining();
  return c.json({ keys, totalRemaining });
});

// Add key
app.post('/', async (c) => {
  const { key } = await c.req.json();
  if (!key || !key.startsWith('AIza')) {
    return c.json({ error: 'Invalid API key format' }, 400);
  }
  const entry = keyManager.addKey(key);
  return c.json({ ok: true, id: entry.id });
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
