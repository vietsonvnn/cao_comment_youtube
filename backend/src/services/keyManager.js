import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

// In-memory state
let keys = [];
let usage = {}; // { keyId: { used: number, lastReset: string } }
let activeKeyIndex = 0;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsage() {
  ensureDataDir();
  try {
    if (fs.existsSync(USAGE_FILE)) {
      usage = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
    }
  } catch { usage = {}; }
}

let _usageSaveTimer = null;

function saveUsage() {
  ensureDataDir();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

function saveUsageDebounced() {
  if (_usageSaveTimer) return;
  _usageSaveTimer = setTimeout(() => {
    _usageSaveTimer = null;
    saveUsage();
  }, 2000);
}

function loadKeys() {
  ensureDataDir();
  if (fs.existsSync(KEYS_FILE)) {
    keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
  } else {
    keys = [];
    saveKeys();
  }
  // Load persisted usage, then init missing entries
  loadUsage();
  const today = new Date().toISOString().split('T')[0];
  for (const k of keys) {
    if (!usage[k.id] || usage[k.id].lastReset !== today) {
      usage[k.id] = { used: 0, lastReset: today };
    }
  }
  saveUsage();
}

function saveKeys() {
  ensureDataDir();
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

const DEFAULT_KEY = 'AIzaSyB85mcCpPH1WqazToIyIuKas1aK2O-vUdQ';

export function init() {
  loadKeys();
  // Tự động thêm key mặc định nếu chưa có key nào
  if (keys.length === 0) {
    addKey(DEFAULT_KEY);
  }
}

export function getAllKeys() {
  const today = new Date().toISOString().split('T')[0];
  return keys.map((k, i) => {
    // Reset usage if new day
    if (!usage[k.id] || usage[k.id].lastReset !== today) {
      usage[k.id] = { used: 0, lastReset: today };
    }
    const masked = k.key.slice(0, 8) + '●'.repeat(Math.max(0, k.key.length - 12)) + k.key.slice(-4);
    return {
      id: k.id,
      key: masked,
      quotaUsed: usage[k.id].used,
      quotaLimit: 10000,
      isActive: i === activeKeyIndex,
      createdAt: k.createdAt,
    };
  });
}

export function getCurrentKey() {
  if (keys.length === 0) return null;
  if (activeKeyIndex >= keys.length) activeKeyIndex = 0;
  return { ...keys[activeKeyIndex], index: activeKeyIndex };
}

export function getActiveKeyIndex() {
  return activeKeyIndex;
}

export function trackUsage(units = 1) {
  if (keys.length === 0) return;
  const key = keys[activeKeyIndex];
  if (!key) return;
  const today = new Date().toISOString().split('T')[0];
  if (!usage[key.id] || usage[key.id].lastReset !== today) {
    usage[key.id] = { used: 0, lastReset: today };
  }
  usage[key.id].used += units;
  saveUsageDebounced();
}

export function getTotalQuotaRemaining() {
  const today = new Date().toISOString().split('T')[0];
  let total = 0;
  for (const k of keys) {
    if (!usage[k.id] || usage[k.id].lastReset !== today) {
      total += 10000;
    } else {
      total += Math.max(0, 10000 - usage[k.id].used);
    }
  }
  return total;
}

export function rotateKey(reason = '') {
  if (keys.length <= 1) return false;
  const startIndex = activeKeyIndex;
  const today = new Date().toISOString().split('T')[0];

  // Try to find a key with remaining quota
  for (let i = 1; i <= keys.length; i++) {
    const nextIndex = (startIndex + i) % keys.length;
    const k = keys[nextIndex];
    if (!usage[k.id] || usage[k.id].lastReset !== today) {
      usage[k.id] = { used: 0, lastReset: today };
    }
    if (usage[k.id].used < 9800) { // leave buffer
      activeKeyIndex = nextIndex;
      return true;
    }
  }
  return false; // All keys exhausted
}

export function addKey(apiKey) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const entry = { id, key: apiKey, createdAt: new Date().toISOString() };
  keys.push(entry);
  usage[id] = { used: 0, lastReset: new Date().toISOString().split('T')[0] };
  saveKeys();
  saveUsage();
  return entry;
}

export function removeKey(id) {
  keys = keys.filter(k => k.id !== id);
  delete usage[id];
  if (activeKeyIndex >= keys.length) activeKeyIndex = Math.max(0, keys.length - 1);
  saveKeys();
  saveUsage();
}

export async function testKey(apiKey) {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'id', id: 'dQw4w9WgXcQ', key: apiKey },
    });
    return { valid: true, status: res.status };
  } catch (err) {
    const status = err.response?.status || 0;
    const message = err.response?.data?.error?.message || err.message;
    return { valid: false, status, message };
  }
}
