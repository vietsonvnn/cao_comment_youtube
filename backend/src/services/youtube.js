import axios from 'axios';
import * as keyManager from './keyManager.js';

const YT_API = 'https://www.googleapis.com/youtube/v3';

async function ytGet(endpoint, params, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const currentKey = keyManager.getCurrentKey();
    if (!currentKey) throw new Error('NO_API_KEYS');

    try {
      const res = await axios.get(`${YT_API}/${endpoint}`, {
        params: { ...params, key: currentKey.key },
      });
      keyManager.trackUsage(1);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      const reason = err.response?.data?.error?.errors?.[0]?.reason;

      if (status === 403 && reason === 'quotaExceeded') {
        const rotated = keyManager.rotateKey('quotaExceeded');
        if (!rotated) throw new Error('ALL_KEYS_EXHAUSTED');
        continue; // retry with new key
      }

      if (status === 403 && reason === 'commentsDisabled') {
        throw new Error('COMMENTS_DISABLED');
      }

      // API not enabled or key blocked
      if (status === 403 && (reason === 'forbidden' || reason === 'accessNotConfigured' || reason === 'API_KEY_SERVICE_BLOCKED')) {
        const msg = err.response?.data?.error?.message || 'API key blocked';
        throw new Error(`API_KEY_BLOCKED: ${msg}`);
      }

      // Other 403 — try rotating key
      if (status === 403) {
        const rotated = keyManager.rotateKey(reason);
        if (!rotated) {
          const msg = err.response?.data?.error?.message || reason || 'Forbidden';
          throw new Error(`API_ERROR_403: ${msg}`);
        }
        continue;
      }

      if (status === 404) {
        // commentThreads returns 404 with "videoNotFound" when comments are disabled
        if (reason === 'videoNotFound' && endpoint === 'commentThreads') {
          throw new Error('COMMENTS_DISABLED');
        }
        throw new Error('NOT_FOUND');
      }

      // Transient error — retry after delay
      if (attempt < retries - 1) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      const errMsg = err.response?.data?.error?.message || err.message;
      throw new Error(errMsg);
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Parse YouTube URL to extract type + ID
export function parseUrl(rawUrl) {
  // Decode URL-encoded characters (e.g. Korean, Japanese, etc.)
  const url = decodeURIComponent(rawUrl);

  // Video URLs
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (match) return { type: 'video', videoId: match[1] };

  // Channel handle: @handle (supports Unicode characters)
  match = url.match(/youtube\.com\/@([^\/?&#]+)/);
  if (match) return { type: 'channel', handle: match[1].trim() };

  // Channel ID: /channel/UCxxxx
  match = url.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (match) return { type: 'channel', channelId: match[1] };

  // Custom URL: /c/name
  match = url.match(/youtube\.com\/c\/([\w.-]+)/);
  if (match) return { type: 'channel', handle: match[1] };

  throw new Error('INVALID_URL');
}

// Get channel info from handle or ID
export async function getChannelInfo(parsed) {
  let params;
  if (parsed.channelId) {
    params = { part: 'snippet,contentDetails', id: parsed.channelId };
  } else if (parsed.handle) {
    params = { part: 'snippet,contentDetails', forHandle: parsed.handle };
  } else {
    throw new Error('INVALID_CHANNEL');
  }

  const data = await ytGet('channels', params);
  if (!data.items || data.items.length === 0) {
    // Try forUsername as fallback
    if (parsed.handle) {
      const data2 = await ytGet('channels', {
        part: 'snippet,contentDetails',
        forUsername: parsed.handle,
      });
      if (!data2.items || data2.items.length === 0) throw new Error('CHANNEL_NOT_FOUND');
      const ch = data2.items[0];
      return {
        channelId: ch.id,
        title: ch.snippet.title,
        uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
      };
    }
    throw new Error('CHANNEL_NOT_FOUND');
  }

  const ch = data.items[0];
  return {
    channelId: ch.id,
    title: ch.snippet.title,
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
  };
}

// Get all videos from uploads playlist
export async function getChannelVideos(uploadsPlaylistId, onProgress) {
  const videos = [];
  let pageToken = null;

  do {
    const params = {
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await ytGet('playlistItems', params);

    for (const item of data.items) {
      videos.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
    if (onProgress) onProgress(videos.length);
    await sleep(100);
  } while (pageToken);

  return videos;
}

// Get video details (title, channel ID, view count)
export async function getVideoInfo(videoId) {
  const data = await ytGet('videos', {
    part: 'snippet,statistics',
    id: videoId,
  });

  if (!data.items || data.items.length === 0) throw new Error('VIDEO_NOT_FOUND');

  const v = data.items[0];
  return {
    videoId: v.id,
    title: v.snippet.title,
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
    viewCount: parseInt(v.statistics.viewCount || '0'),
    commentCount: parseInt(v.statistics.commentCount || '0'),
  };
}

// Get one page of top-level comments
export async function getVideoComments(videoId, pageToken) {
  const params = {
    part: 'snippet',
    videoId,
    maxResults: 100,
    order: 'relevance',
    textFormat: 'plainText',
  };
  if (pageToken) params.pageToken = pageToken;

  const data = await ytGet('commentThreads', params);

  const comments = data.items.map(item => {
    const s = item.snippet.topLevelComment.snippet;
    return {
      id: item.id,
      text: s.textDisplay,
      likeCount: s.likeCount || 0,
      replyCount: item.snippet.totalReplyCount || 0,
      authorChannelId: s.authorChannelId?.value || '',
      publishedAt: s.publishedAt,
    };
  });

  return {
    comments,
    nextPageToken: data.nextPageToken || null,
    totalResults: data.pageInfo?.totalResults || 0,
  };
}

// Get replies for a comment thread
export async function getCommentReplies(parentId, pageToken) {
  const params = {
    part: 'snippet',
    parentId,
    maxResults: 100,
    textFormat: 'plainText',
  };
  if (pageToken) params.pageToken = pageToken;

  const data = await ytGet('comments', params);

  const replies = data.items.map(item => {
    const s = item.snippet;
    return {
      id: item.id,
      text: s.textDisplay,
      likeCount: s.likeCount || 0,
      replyCount: 0,
      authorChannelId: s.authorChannelId?.value || '',
      publishedAt: s.publishedAt,
    };
  });

  return {
    replies,
    nextPageToken: data.nextPageToken || null,
  };
}
