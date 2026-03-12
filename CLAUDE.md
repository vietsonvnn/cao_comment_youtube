# YouTube Comment Scraper

## Overview
Tool cào comment YouTube (video đơn hoặc cả kênh), lưu file TXT kèm metadata likes/replies.

## Tech Stack
- **Backend**: Node.js ESM + Hono framework (port 3000)
- **Frontend**: React 18 + Vite (port 5173, proxy /api → 3000)
- **Storage**: JSON files in `backend/data/` (no database)
- **Deploy target**: VPS with CF reverse proxy → `cmt.checkvarip.pro`

## Architecture
- Backend handles scraping in background (async jobs in memory)
- SSE for realtime progress updates
- Multiple YouTube API keys with auto-rotation on quota exhaustion
- Comments stored in memory during scraping, generated as TXT on download

## API Routes
- `/api/scrape/*` - Start/pause/resume scrape jobs, SSE progress
- `/api/keys/*` - CRUD API keys, test, quota status
- `/api/download/*` - Download TXT files (all or per-video)
- `/api/history/*` - Job history

## TXT Output Format
```
===== Video: {title} =====
===== URL: https://youtube.com/watch?v={id} =====
===== Tổng: {n} comments =====

[Likes: 15234 | Replies: 847]
Comment text here

[Likes: 2 | Replies: 0]
Another comment
```

## Development
```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```
