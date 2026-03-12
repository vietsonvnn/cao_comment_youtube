import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as keyManager from './services/keyManager.js';
import scrapeRoutes from './routes/scrape.js';
import keysRoutes from './routes/keys.js';
import downloadRoutes from './routes/download.js';
import historyRoutes from './routes/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = new Hono();

// CORS
app.use('*', cors({ origin: '*' }));

// Mount API routes
app.route('/api/scrape', scrapeRoutes);
app.route('/api/keys', keysRoutes);
app.route('/api/download', downloadRoutes);
app.route('/api/history', historyRoutes);

// Health check
app.get('/api/health', (c) => c.json({ ok: true }));

// Serve frontend static files in production
const distPath = path.relative(process.cwd(), path.resolve(__dirname, '../../frontend/dist'));
app.use('/*', serveStatic({ root: distPath }));

// SPA fallback - serve index.html for non-API routes
app.get('*', async (c) => {
  const fs = await import('fs');
  const indexPath = path.resolve(__dirname, '../../frontend/dist/index.html');
  try {
    const html = fs.readFileSync(indexPath, 'utf-8');
    return c.html(html);
  } catch {
    return c.json({ error: 'Frontend not built. Run: cd frontend && npm run build' }, 404);
  }
});

// Init
keyManager.init();

const port = process.env.PORT || 3000;
serve({ fetch: app.fetch, port }, () => {
  console.log(`YouTube Comment Scraper running on http://localhost:${port}`);
});
