import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';

const gb = (b) => (b / 1024 / 1024 / 1024).toFixed(2);
const mb = (b) => (b / 1024 / 1024).toFixed(0);
const dur = (s) => { s = Math.floor(s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60); return `${d ? d + ' يوم ' : ''}${h} ساعة ${mi} دقيقة`; };
const rd = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch { return ''; } };
const disk = (p) => { try { const s = fs.statfsSync(p); const total = s.blocks * s.bsize, free = s.bavail * s.bsize; return `${gb(total - free)} / ${gb(total)} GB (فاضي ${gb(free)})`; } catch { return 'مش متاح'; } };
const sh = (c) => { try { return execSync(c, { timeout: 2000 }).toString().trim(); } catch { return ''; } };

const handler = async (m, { conn }) => {
  const isOwner = m.isOwner || (globalThis.erinIsOwnerMsg ? globalThis.erinIsOwnerMsg(m) : false);
  if (!isOwner) return m.reply('*🔒 الأمر ده للمطور بس*');
  const cgMax = Number(rd('/sys/fs/cgroup/memory.max')) || 0;
  const cgCur = Number(rd('/sys/fs/cgroup/memory.current')) || 0;
  const rss = process.memoryUsage().rss;
  const total = os.totalmem(), free = os.freemem();
  const ramLine = cgMax && cgMax < total * 2 ? `${mb(cgCur)} / ${mb(cgMax)} MB (حد الحاوية)` : `${gb(total - free)} / ${gb(total)} GB`;
  const load = os.loadavg().map(x => x.toFixed(2)).join(' / ');
  const cores = os.cpus().length;
  const py = sh('python3 --version') || 'مش موجود';
  const dataDir = process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.';
  let groups = '?';
  try { groups = Object.keys(await conn.groupFetchAllParticipating()).length; } catch {}
  const me = (conn.user?.id || conn.sock?.user?.id || '').split(':')[0].split('@')[0] || '?';
  const txt = `🖥️ *فحص جهاز البوت*
> ده جهاز السيرفر اللي البوت شغال عليه، مش موبايلك. واتساب مبيسمحش للبوت يشوف موبايل أي حد.

⏱️ *وقت التشغيل:* ${dur(process.uptime())} (السيرفر: ${dur(os.uptime())})
🧠 *الرام:* ${ramLine}
📦 *رام البوت:* ${mb(rss)} MB
💾 *التخزين (البيانات):* ${disk(dataDir)}
💽 *القرص الرئيسي:* ${disk('/')}
⚙️ *المعالج:* ${cores} أنوية، الحمل (1/5/15 د): ${load}
🧩 *النظام:* ${os.platform()} ${os.arch()}
🟢 *Node:* ${process.version}
🐍 *Python:* ${py.replace('Python ', '')}
🏷️ *نسخة البوت REV:* ${process.env.REV || '?'}
📱 *رقم البوت:* ${me}
👥 *جروبات البوت:* ${groups}
🔋 *البطارية:* مفيش، ده سيرفر`;
  await m.reply(txt);
};
handler.usage = ['فحص', 'فحص الموبايل'];
handler.category = 'info';
handler.command = ['فحص', 'فحص_الموبايل', 'فحص_الجهاز'];
handler.owner = true;
export default handler;
