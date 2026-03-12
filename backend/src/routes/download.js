import { Hono } from 'hono';
import * as scraper from '../services/scraper.js';

const app = new Hono();

// Download all comments for a job
app.get('/:jobId', (c) => {
  const jobId = c.req.param('jobId');
  const txt = scraper.generateTxt(jobId);
  if (txt === null) return c.json({ error: 'Job not found' }, 404);

  const job = scraper.getJob(jobId);
  const filename = job?.channelTitle
    ? `comments_${job.channelTitle.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.txt`
    : `comments_${jobId}.txt`;

  c.header('Content-Type', 'text/plain; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.body(txt);
});

// Download comments for a single video
app.get('/:jobId/:videoId', (c) => {
  const { jobId, videoId } = c.req.param();
  const txt = scraper.generateTxt(jobId, videoId);
  if (txt === null) return c.json({ error: 'Not found' }, 404);

  c.header('Content-Type', 'text/plain; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="comments_${videoId}.txt"`);
  return c.body(txt);
});

export default app;
