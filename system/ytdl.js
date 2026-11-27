import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import yts from 'yt-search';

const DIRS = ['/data', '/tmp'];
const BIN_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
let binPromise = null;

const run = (bin, args, opts = {}) => new Promise((res, rej) => {
  execFile(bin, args, { maxBuffer: 20 * 1024 * 1024, timeout: 180000, ...opts }, (err, stdout, stderr) => {
    if (err) { const e = new Error((stderr || err.message || '').toString().split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 300)); return rej(e); }
    res(stdout.toString());
  });
});

export const ensureBin = () => {
  if (binPromise) return binPromise;
  binPromise = (async () => {
    for (const d of DIRS) {
      const p = path.join(d, 'yt-dlp');
      try { if (fs.existsSync(p)) { await run(p, ['--version']); return p; } } catch {}
    }
    for (const d of DIRS) {
      const p = path.join(d, 'yt-dlp');
      try {
        const r = await fetch(BIN_URL, { redirect: 'follow' });
        if (!r.ok) throw new Error('download ' + r.status);
        fs.writeFileSync(p, Buffer.from(await r.arrayBuffer()), { mode: 0o755 });
        fs.chmodSync(p, 0o755);
        const v = await run(p, ['--version']);
        console.log('[ERIN-YT] yt-dlp ready', p, v.trim());
        return p;
      } catch (e) { console.error('[ERIN-ERR] yt-dlp install', d, e.message); }
    }
    binPromise = null;
    throw new Error('yt-dlp unavailable');
  })();
  binPromise.catch(() => { binPromise = null; });
  return binPromise;
};

export const searchYT = async (q) => {
  const r = await yts(q);
  const v = r.videos?.[0];
  if (!v) throw new Error('no results');
  return { url: v.url, title: v.title, channel: v.author?.name || '' };
};

// kind: 'audio' | 'video'. Returns { file, title, ext }
export const fetchMedia = async (url, kind) => {
  const bin = await ensureBin();
  const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const out = `/tmp/erin_${id}.%(ext)s`;
  const fmt = kind === 'audio'
    ? 'bestaudio[ext=m4a]/bestaudio'
    : '18/best[ext=mp4][height<=480]/best[ext=mp4]/best';
  const args = ['--no-playlist', '--no-warnings', '--js-runtimes', 'node', '--max-filesize', '90M',
    '-f', fmt, '-o', out, '--print', 'after_move:%(title)s\t%(filepath)s', url];
  let stdout, lastErr;
  const tries = /youtu/i.test(url) ? [[], ['--extractor-args', 'youtube:player_client=tv,web_safari'], ['--extractor-args', 'youtube:player_client=android_vr,mweb']] : [[]];
  for (const extra of tries) {
    try { stdout = await run(bin, [...extra, ...args]); lastErr = null; break; } catch (e) { lastErr = e; console.error('[ERIN-ERR] yt-dlp try', e.message.slice(0, 160)); }
  }
  if (lastErr) throw lastErr;
  const line = stdout.trim().split('\n').pop();
  const [title, file] = line.split('\t');
  if (!file || !fs.existsSync(file)) throw new Error('download failed');
  return { file, title: title || 'media', ext: path.extname(file).slice(1) };
};

export const sendMedia = async (conn, chat, m, url, kind) => {
  const r = await fetchMedia(url, kind);
  try {
    const buf = fs.readFileSync(r.file);
    if (kind === 'audio') {
      await conn.sendMessage(chat, { audio: buf, mimetype: r.ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg', fileName: `${r.title}.${r.ext}` }, { quoted: m });
    } else {
      await conn.sendMessage(chat, { video: buf, mimetype: 'video/mp4', caption: `*${r.title}*` }, { quoted: m });
    }
    return r;
  } finally { try { fs.unlinkSync(r.file); } catch {} }
};
