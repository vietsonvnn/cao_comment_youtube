import { Hono } from 'hono';
import * as scraper from '../services/scraper.js';

const app = new Hono();

app.get('/', (c) => {
  const jobs = scraper.getHistory();
  return c.json({ jobs });
});

app.delete('/:jobId', (c) => {
  const jobId = c.req.param('jobId');
  scraper.deleteHistory(jobId);
  return c.json({ ok: true });
});

export default app;
