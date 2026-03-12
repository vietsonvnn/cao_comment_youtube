import * as youtube from './youtube.js';
import * as keyManager from './keyManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// In-memory jobs: jobId → job
const jobs = new Map();

// SSE listeners: jobId → Set<callback>
const listeners = new Map();

// Auto-cleanup completed jobs after 2 hours
const JOB_TTL_MS = 2 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs) {
    if ((job.status === 'done' || job.status === 'error') && (now - job.startedAt) > JOB_TTL_MS) {
      jobs.delete(jobId);
      listeners.delete(jobId);
    }
  }
}, 60_000);

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now() {
  return new Date().toLocaleTimeString('vi-VN', { hour12: false });
}

function addLog(job, level, message) {
  const entry = { time: now(), level, message };
  job.logs.push(entry);
  if (job.logs.length > 500) job.logs = job.logs.slice(-500);
  notifyListeners(job.id);
}

function notifyListeners(jobId) {
  const cbs = listeners.get(jobId);
  if (!cbs) return;
  const job = jobs.get(jobId);
  if (!job) return;
  const snapshot = getJobSnapshot(job);
  for (const cb of cbs) {
    try { cb(snapshot); } catch (e) { /* listener write error, SSE cleanup handles it */ }
  }
}

function getJobSnapshot(job) {
  return {
    jobId: job.id,
    status: job.status,
    type: job.type,
    url: job.url,
    channelTitle: job.channelTitle || '',
    totalVideos: job.videos.length,
    processedVideos: job.videos.filter(v => v.status === 'done' || v.status === 'error' || v.status === 'disabled').length,
    videos: job.videos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      commentCount: v.commentCount || 0,
      fetchedComments: v.fetchedComments || 0,
      page: v.page || 0,
      totalPages: v.totalPages || 0,
      status: v.status,
      error: v.error || null,
    })),
    stats: {
      totalComments: job.stats.totalComments,
      filteredOwner: job.stats.filteredOwner,
      quotaUsed: job.stats.quotaUsed,
      activeKeyIndex: keyManager.getActiveKeyIndex(),
    },
    logs: job.logs.slice(-50),
    startedAt: job.startedAt,
    elapsed: Date.now() - job.startedAt,
  };
}

export function subscribe(jobId, callback) {
  if (!listeners.has(jobId)) listeners.set(jobId, new Set());
  listeners.get(jobId).add(callback);
  const job = jobs.get(jobId);
  if (job) {
    try { callback(getJobSnapshot(job)); } catch {}
  }
  return () => {
    const cbs = listeners.get(jobId);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) listeners.delete(jobId);
    }
  };
}

export async function startJob(url, options) {
  const parsed = youtube.parseUrl(url);
  const jobId = genId();

  const job = {
    id: jobId,
    url,
    type: parsed.type,
    status: 'running',
    options: {
      includeReplies: options.includeReplies ?? true,
      filterOwner: options.filterOwner ?? true,
      filterDuplicates: options.filterDuplicates ?? false,
      maxVideos: Math.max(0, parseInt(options.maxVideos) || 0),
      minViews: Math.max(0, parseInt(options.minViews) || 0),
      minComments: Math.max(0, parseInt(options.minComments) || 0),
      dateFrom: options.dateFrom || '',
      dateTo: options.dateTo || '',
      titleKeyword: options.titleKeyword || '',
      titleExclude: options.titleExclude || '',
      sortOrder: options.sortOrder || 'newest',
    },
    channelTitle: '',
    channelOwnerId: '',
    videos: [],
    comments: new Map(),
    stats: { totalComments: 0, filteredOwner: 0, quotaUsed: 0 },
    logs: [],
    startedAt: Date.now(),
    _paused: false,
    _processingPromise: null,
  };

  jobs.set(jobId, job);

  // Start processing in background
  job._processingPromise = processJob(job, parsed).catch(err => {
    job.status = 'error';
    addLog(job, 'error', `Job failed: ${err.message}`);
    saveHistory(job);
  });

  return jobId;
}

async function processJob(job, parsed) {
  try {
    if (parsed.type === 'video') {
      addLog(job, 'info', `Fetching video info: ${parsed.videoId}`);
      const info = await youtube.getVideoInfo(parsed.videoId);
      job.channelOwnerId = info.channelId;
      job.channelTitle = info.channelTitle;
      job.videos = [{
        videoId: info.videoId,
        title: info.title,
        commentCount: info.commentCount,
        fetchedComments: 0,
        page: 0,
        totalPages: Math.ceil(info.commentCount / 100),
        status: 'pending',
      }];
      addLog(job, 'info', `Video "${info.title}" — ~${info.commentCount.toLocaleString()} comments`);
    } else {
      addLog(job, 'info', `Fetching channel info...`);
      const channelInfo = await youtube.getChannelInfo(parsed);
      job.channelOwnerId = channelInfo.channelId;
      job.channelTitle = channelInfo.title;
      addLog(job, 'info', `Channel: ${channelInfo.title}`);

      addLog(job, 'info', `Fetching video list...`);
      let videos = await youtube.getChannelVideos(channelInfo.uploadsPlaylistId, (count) => {
        addLog(job, 'info', `Found ${count} videos so far...`);
      });

      const totalBefore = videos.length;
      const opts = job.options;

      // Date range filter (validate dates)
      if (opts.dateFrom) {
        const from = new Date(opts.dateFrom).getTime();
        if (!isNaN(from)) videos = videos.filter(v => new Date(v.publishedAt).getTime() >= from);
      }
      if (opts.dateTo) {
        const to = new Date(opts.dateTo).getTime() + 86400000;
        if (!isNaN(to)) videos = videos.filter(v => new Date(v.publishedAt).getTime() <= to);
      }

      // Title keyword filter
      if (opts.titleKeyword) {
        const kw = opts.titleKeyword.toLowerCase();
        videos = videos.filter(v => v.title.toLowerCase().includes(kw));
      }
      if (opts.titleExclude) {
        const ex = opts.titleExclude.toLowerCase();
        videos = videos.filter(v => !v.title.toLowerCase().includes(ex));
      }

      // Sort order
      if (opts.sortOrder === 'oldest') {
        videos.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
      } else {
        videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }

      // Max videos limit
      if (opts.maxVideos > 0) {
        videos = videos.slice(0, opts.maxVideos);
      }

      if (videos.length < totalBefore) {
        addLog(job, 'info', `Filtered: ${totalBefore} → ${videos.length} videos`);
      }

      job.videos = videos.map(v => ({
        videoId: v.videoId,
        title: v.title,
        publishedAt: v.publishedAt,
        commentCount: 0,
        fetchedComments: 0,
        page: 0,
        totalPages: 0,
        status: 'pending',
      }));

      addLog(job, 'info', `Total: ${videos.length} videos to process`);
    }

    notifyListeners(job.id);
    await processVideoLoop(job);
  } catch (err) {
    if (err.message === 'ALL_KEYS_EXHAUSTED') {
      job.status = 'paused';
      job._paused = true;
      addLog(job, 'warn', 'All API keys exhausted. Job paused — resume when quota resets.');
    } else {
      throw err;
    }
    saveHistory(job);
    notifyListeners(job.id);
  }
}

// Extracted loop so resume can re-enter it
async function processVideoLoop(job) {
  // Find first unprocessed video (supports resume)
  for (const video of job.videos) {
    if (video.status === 'done' || video.status === 'disabled') continue;
    if (video.status === 'error' && video.fetchedComments > 0) continue; // skip already-errored with data

    // Check pause
    while (job._paused) {
      await sleep(500);
    }

    await processVideo(job, video);
  }

  // Only mark done if all videos processed and job wasn't paused mid-way
  if (!job._paused && job.status === 'running') {
    job.status = 'done';
    addLog(job, 'info', `Job complete! ${job.stats.totalComments.toLocaleString()} comments collected.`);
    saveHistory(job);
    notifyListeners(job.id);
  }
}

async function processVideo(job, video) {
  let viewCount = 0;
  try {
    const info = await youtube.getVideoInfo(video.videoId);
    video.commentCount = info.commentCount;
    video.totalPages = Math.ceil(info.commentCount / 100);
    viewCount = info.viewCount;
    if (!job.channelOwnerId) job.channelOwnerId = info.channelId;
  } catch (err) {
    if (err.message === 'NOT_FOUND' || err.message === 'VIDEO_NOT_FOUND') {
      video.status = 'error';
      video.error = 'Video not found or private';
      addLog(job, 'warn', `"${video.title}" — not found/private, skipping`);
      notifyListeners(job.id);
      return;
    }
    throw err;
  }

  // Skip by min views
  if (job.options.minViews > 0 && viewCount < job.options.minViews) {
    video.status = 'disabled';
    video.error = `Views ${viewCount.toLocaleString()} < min ${job.options.minViews.toLocaleString()}`;
    addLog(job, 'warn', `"${video.title}" — ${viewCount.toLocaleString()} views, skipping`);
    notifyListeners(job.id);
    return;
  }

  // Skip by min comments
  if (job.options.minComments > 0 && video.commentCount < job.options.minComments) {
    video.status = 'disabled';
    video.error = `Comments ${video.commentCount.toLocaleString()} < min ${job.options.minComments.toLocaleString()}`;
    addLog(job, 'warn', `"${video.title}" — ${video.commentCount.toLocaleString()} comments, skipping`);
    notifyListeners(job.id);
    return;
  }

  video.status = 'running';
  addLog(job, 'info', `Processing "${video.title}" (~${video.commentCount.toLocaleString()} comments)`);
  notifyListeners(job.id);

  const comments = [];
  const seenTexts = new Set();
  let pageToken = null;
  let page = 0;

  try {
    do {
      while (job._paused) {
        await sleep(500);
      }

      const result = await youtube.getVideoComments(video.videoId, pageToken);
      page++;
      video.page = page;
      job.stats.quotaUsed++;

      for (const comment of result.comments) {
        if (job.options.filterOwner && comment.authorChannelId === job.channelOwnerId) {
          job.stats.filteredOwner++;
          continue;
        }
        if (job.options.filterDuplicates && seenTexts.has(comment.text)) continue;

        seenTexts.add(comment.text);
        comments.push({
          text: comment.text,
          likeCount: comment.likeCount,
          replyCount: comment.replyCount,
        });
        job.stats.totalComments++;

        // Fetch replies
        if (job.options.includeReplies && comment.replyCount > 0) {
          try {
            let replyPageToken = null;
            do {
              const replyResult = await youtube.getCommentReplies(comment.id, replyPageToken);
              job.stats.quotaUsed++;

              for (const reply of replyResult.replies) {
                if (job.options.filterOwner && reply.authorChannelId === job.channelOwnerId) {
                  job.stats.filteredOwner++;
                  continue;
                }
                if (job.options.filterDuplicates && seenTexts.has(reply.text)) continue;
                seenTexts.add(reply.text);
                comments.push({
                  text: reply.text,
                  likeCount: reply.likeCount,
                  replyCount: 0,
                });
                job.stats.totalComments++;
              }

              replyPageToken = replyResult.nextPageToken;
              await sleep(100);
            } while (replyPageToken);
          } catch (replyErr) {
            // Log reply errors but don't stop the video
            if (replyErr.message === 'ALL_KEYS_EXHAUSTED') throw replyErr;
            addLog(job, 'warn', `Reply fetch error on "${video.title}": ${replyErr.message}`);
          }
        }
      }

      video.fetchedComments = comments.length;
      pageToken = result.nextPageToken;
      notifyListeners(job.id);
      await sleep(100);
    } while (pageToken);

    job.comments.set(video.videoId, comments);
    video.status = 'done';
    video.fetchedComments = comments.length;
    addLog(job, 'ok', `"${video.title}" — ${comments.length.toLocaleString()} comments collected`);
  } catch (err) {
    // Save partial results
    if (comments.length > 0) {
      job.comments.set(video.videoId, comments);
      video.fetchedComments = comments.length;
    }

    if (err.message === 'COMMENTS_DISABLED') {
      video.status = 'disabled';
      addLog(job, 'warn', `"${video.title}" — comments disabled, skipping`);
    } else if (err.message === 'NOT_FOUND') {
      video.status = 'disabled';
      addLog(job, 'warn', `"${video.title}" — comments not available, skipping`);
    } else if (err.message === 'ALL_KEYS_EXHAUSTED') {
      video.status = 'error';
      video.error = 'API quota exhausted';
      throw err;
    } else {
      video.status = 'error';
      video.error = err.message;
      addLog(job, 'error', `"${video.title}" — ${err.message}`);
    }
  }

  notifyListeners(job.id);
}

export function pauseJob(jobId) {
  const job = jobs.get(jobId);
  if (!job || !jobId) return false;
  job._paused = true;
  job.status = 'paused';
  addLog(job, 'info', 'Job paused');
  saveHistory(job);
  notifyListeners(jobId);
  return true;
}

export function resumeJob(jobId) {
  const job = jobs.get(jobId);
  if (!job || !jobId) return false;

  const wasPausedByQuota = job._paused && job.status === 'paused';
  job._paused = false;
  job.status = 'running';
  addLog(job, 'info', 'Job resumed');
  notifyListeners(jobId);

  // If the processing loop exited (e.g. ALL_KEYS_EXHAUSTED), restart it
  if (wasPausedByQuota) {
    job._processingPromise = processVideoLoop(job).then(() => {
      if (job.status === 'running') {
        job.status = 'done';
        addLog(job, 'info', `Job complete! ${job.stats.totalComments.toLocaleString()} comments collected.`);
        saveHistory(job);
        notifyListeners(job.id);
      }
    }).catch(err => {
      if (err.message === 'ALL_KEYS_EXHAUSTED') {
        job.status = 'paused';
        job._paused = true;
        addLog(job, 'warn', 'All API keys exhausted again. Job paused.');
      } else {
        job.status = 'error';
        addLog(job, 'error', `Job failed: ${err.message}`);
      }
      saveHistory(job);
      notifyListeners(job.id);
    });
  }

  return true;
}

export function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  return getJobSnapshot(job);
}

export function generateTxt(jobId, videoId) {
  const job = jobs.get(jobId);
  if (!job) return null;

  let lines = [];
  const videoIds = videoId ? [videoId] : Array.from(job.comments.keys());

  for (const vid of videoIds) {
    const comments = job.comments.get(vid);
    if (!comments || comments.length === 0) continue;

    const videoInfo = job.videos.find(v => v.videoId === vid);
    const title = videoInfo?.title || vid;

    lines.push(`===== Video: ${title} =====`);
    lines.push(`===== URL: https://youtube.com/watch?v=${vid} =====`);
    lines.push(`===== Total: ${comments.length.toLocaleString()} comments =====`);
    lines.push('');

    for (const c of comments) {
      lines.push(`[Likes: ${c.likeCount.toLocaleString()} | Replies: ${c.replyCount.toLocaleString()}]`);
      lines.push(c.text);
      lines.push('');
    }

    lines.push('');
  }

  return lines.join('\n');
}

// History persistence
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveHistory(job) {
  const history = loadHistory();
  const existing = history.findIndex(h => h.jobId === job.id);
  const entry = {
    jobId: job.id,
    url: job.url,
    type: job.type,
    channelTitle: job.channelTitle,
    totalVideos: job.videos.length,
    totalComments: job.stats.totalComments,
    status: job.status,
    startedAt: job.startedAt,
    updatedAt: Date.now(),
  };
  if (existing >= 0) {
    history[existing] = entry;
  } else {
    history.unshift(entry);
  }
  if (history.length > 50) history.length = 50;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function getHistory() {
  return loadHistory();
}

export function deleteHistory(jobId) {
  const history = loadHistory().filter(h => h.jobId !== jobId);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  jobs.delete(jobId);
  listeners.delete(jobId);
}
