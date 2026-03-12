import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import * as scraper from '../services/scraper.js';

const app = new Hono();

// Start scrape job
app.post('/start', async (c) => {
  const { url, options = {} } = await c.req.json();
  if (!url) return c.json({ error: 'URL is required' }, 400);

  try {
    const jobId = await scraper.startJob(url, options);
    return c.json({ jobId });
  } catch (err) {
    if (err.message === 'INVALID_URL') {
      return c.json({ error: 'Invalid YouTube URL' }, 400);
    }
    if (err.message === 'NO_API_KEYS') {
      return c.json({ error: 'No API keys configured. Add keys first.' }, 400);
    }
    return c.json({ error: err.message }, 500);
  }
});

// Pause job
app.post('/pause', async (c) => {
  const { jobId } = await c.req.json();
  const ok = scraper.pauseJob(jobId);
  if (!ok) return c.json({ error: 'Job not found' }, 404);
  return c.json({ ok: true });
});

// Resume job
app.post('/resume', async (c) => {
  const { jobId } = await c.req.json();
  const ok = scraper.resumeJob(jobId);
  if (!ok) return c.json({ error: 'Job not found' }, 404);
  return c.json({ ok: true });
});

// SSE progress stream
app.get('/progress', async (c) => {
  const jobId = c.req.query('jobId');
  if (!jobId) return c.json({ error: 'jobId required' }, 400);

  const job = scraper.getJob(jobId);
  if (!job) return c.json({ error: 'Job not found' }, 404);

  return streamSSE(c, async (stream) => {
    let alive = true;

    const unsubscribe = scraper.subscribe(jobId, (snapshot) => {
      if (!alive) return;
      try {
        stream.writeSSE({ data: JSON.stringify(snapshot), event: 'progress' });
      } catch {
        alive = false;
      }
    });

    // Keep connection alive
    while (alive) {
      await new Promise(r => setTimeout(r, 1000));
      if (!alive) break;
      try {
        stream.writeSSE({ data: '', event: 'ping' });
      } catch {
        alive = false;
      }
    }

    unsubscribe();
  });
});

export default app;
