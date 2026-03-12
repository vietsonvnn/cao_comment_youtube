import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as keyManager from './services/keyManager.js';
import scrapeRoutes from './routes/scrape.js';
import keysRoutes from './routes/keys.js';
import downloadRoutes from './routes/download.js';
import historyRoutes from './routes/history.js';

const app = new Hono();

// CORS
app.use('*', cors({ origin: '*' }));

// Mount routes
app.route('/api/scrape', scrapeRoutes);
app.route('/api/keys', keysRoutes);
app.route('/api/download', downloadRoutes);
app.route('/api/history', historyRoutes);

// Health check
app.get('/api/health', (c) => c.json({ ok: true }));

// Init
keyManager.init();

const port = process.env.PORT || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`YouTube Comment Scraper backend running on http://localhost:${port}`);
});
