import { Client } from 'meowsab';
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from './sub.js';

/* Channel jid: starts from the old id, then resolved from the invite link once connected */
globalThis.CH_JID = '120363434971453417@newsletter';
const CH_INVITE = '0029Vb8xDV8A2pLCoK6KtH36';

/* =========== Client ========== */
const client = new Client({
  phoneNumber: process.env.BOT_NUMBER || '201044019293', // Bot number
  sessionPath: process.env.SESSION_PATH || './session',
  prefix: [".", "/", "!"],
  fromMe: false, 
  owners: [
    { name: "إيرن / مودي", jid: "201044013292@s.whatsapp.net", lid: "168659775398062@lid" },
    { name: "إيرن / مودي", jid: "201044019293@s.whatsapp.net", lid: "78456922595383@lid" }
  ],
  settings: { noWelcome: false },
  commandsPath: './plugins',
  onError: (e) => console.error('[ERIN-ERR]', e && (e.stack || e.message || e))
});

client.onGroupEvent(group);
client.onCommandAccess(access);

/* =========== Database ========== */
if (!global.db) {
    global.db = new UltraDB();
}

/* =========== Config ========== */
const { config } = client;
config.info = { 
  nameBot: "♡ إيرن ييغر 〈", 
  nameChannel: "Erin Bot", 
  idChannel: globalThis.CH_JID,
  urls: {
    repo: "https://github.com/modykray/Erin",
    
    channel: "https://whatsapp.com/channel/0029Vb8xDV8A2pLCoK6KtH36"
  },
  copyright: { 
    pack: 'إيرن / مودي', 
    author: 'إيرن / مودي'
  },
  images: [
    "https://i.pinimg.com/originals/11/26/97/11269786cdb625c60213212aa66273a9.png",
    "https://i.pinimg.com/originals/e2/21/20/e221203f319df949ee65585a657501a2.jpg",
    "https://i.pinimg.com/originals/bb/77/0f/bb770fad66a634a6b3bf93e9c00bf4e5.jpg"
  ]
};

/* =========== Resolve channel jid =========== */
const chTimer = setInterval(async () => {
  try {
    const sock = client.sock;
    if (!sock || !sock.user || typeof sock.newsletterMetadata !== 'function') return;
    const meta = await sock.newsletterMetadata('invite', CH_INVITE);
    if (meta?.id) {
      globalThis.CH_JID = meta.id;
      client.config.info.idChannel = meta.id;
      console.log('✅ Channel resolved:', meta.id);
      clearInterval(chTimer);
    }
  } catch (e) { console.log('channel resolve failed:', e?.message); }
}, 20000);

/* ===== Power switch: بور_اوف / بور_اون (owner only). State persists in /data ===== */
import fs from 'fs';
const POWER_FILE = (process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.') + '/erin_power_off';
const OWNER_NUMS = new Set(['201044013292', '201044019293']);
const OWNER_LIDS = new Set(['168659775398062']);
globalThis.erinOff = false;
const ADMIN_FILE = POWER_FILE.replace('erin_power_off', 'erin_admin_only');
globalThis.erinAdminOnly = false;
try { if (!process.env.ERIN_FORCE_ON && fs.existsSync(ADMIN_FILE)) globalThis.erinAdminOnly = true; } catch {}
const setAdminOnly = (on) => {
  globalThis.erinAdminOnly = on;
  try { on ? fs.writeFileSync(ADMIN_FILE, String(Date.now())) : fs.rmSync(ADMIN_FILE, { force: true }); } catch (e) { console.error('[ERIN-ERR] admin file', e?.message); }
  console.log('[ERIN-POWER] admin-only', on ? 'ON' : 'OFF');
};
try { if (!process.env.ERIN_FORCE_ON && fs.existsSync(POWER_FILE)) globalThis.erinOff = true; } catch {}
const setPower = (off) => {
  globalThis.erinOff = off;
  try { off ? fs.writeFileSync(POWER_FILE, String(Date.now())) : fs.rmSync(POWER_FILE, { force: true }); } catch (e) { console.error('[ERIN-ERR] power file', e?.message); }
  console.log('[ERIN-POWER]', off ? 'OFF' : 'ON');
};
const numOf = (j) => (j || '').split(':')[0].split('@')[0];
const isOwnerMsg = (m) => {
  if (m.isOwner) return true;
  const k = m.key || {};
  return [m.sender, k.participant, k.participantAlt, k.remoteJid, k.remoteJidAlt].some(j => j && (OWNER_NUMS.has(numOf(j)) || OWNER_LIDS.has(numOf(j)))) && !(k.remoteJid || '').endsWith('@g.us') ||
    [m.sender, k.participant, k.participantAlt].some(j => j && (OWNER_NUMS.has(numOf(j)) || OWNER_LIDS.has(numOf(j))));
};
const adminCache = new Map();
const isGroupAdminMsg = async (m) => {
  try {
    const chat = m.chat || (m.key && m.key.remoteJid) || '';
    if (!chat.endsWith('@g.us')) return false;
    let e = adminCache.get(chat);
    if (!e || Date.now() - e.t > 60000) {
      const md = await client.sock.groupMetadata(chat);
      const ids = new Set();
      for (const p of md.participants || []) if (p.admin) [p.id, p.lid, p.jid, p.phoneNumber].forEach(x => x && ids.add(numOf(x)));
      e = { t: Date.now(), ids }; adminCache.set(chat, e);
    }
    const k = m.key || {};
    return [m.sender, k.participant, k.participantAlt].some(j => j && e.ids.has(numOf(j)));
  } catch (err) { console.error('[ERIN-ERR] adminCheck', err?.message); return false; }
};
const ownerIdCache = new Map();
const ownerIdsIn = async (chat) => {
  let e = ownerIdCache.get(chat);
  if (e && Date.now() - e.t < 60000) return e.ids;
  const ids = new Set([...OWNER_NUMS, ...OWNER_LIDS]);
  try {
    const md = await client.sock.groupMetadata(chat);
    for (const p of md.participants || []) {
      const all = [p.id, p.lid, p.jid, p.phoneNumber].filter(Boolean).map(numOf);
      if (all.some(x => OWNER_NUMS.has(x) || OWNER_LIDS.has(x))) all.forEach(x => ids.add(x));
    }
  } catch (err) { console.error('[ERIN-ERR] ownerIds', err?.message); }
  ownerIdCache.set(chat, { t: Date.now(), ids });
  return ids;
};
globalThis.erinOwnerIdsIn = ownerIdsIn;
const PROTECTED_CMDS = new Set(['طرد','خفض','حذف','كتم','انذار','تحذير','warn','حذفانذار','حذفالانذار','ضيف']);
const OWNER_ONLY_CMDS = new Set([]);
globalThis.erinIsOwnerMsg = isOwnerMsg;
const protectHook = async (m) => {
  try {
    const t = (m.text || m.body || '').trim();
    const mm = t.match(/^[./!]?\s*([^\s]+)/);
    if (!mm) return false;
    const c = mm[1].replace(/[^\p{L}]/gu, '');
    const cn = c.toLowerCase();
    const chat = m.chat || (m.key && m.key.remoteJid) || '';
    if (OWNER_ONLY_CMDS.has(c) && chat.endsWith('@g.us') && t.length <= 20 && !isOwnerMsg(m)) {
      console.log('[ERIN-PROTECT] owner-only', c, 'from', m.sender);
      try { await m.reply('*🔒 الأمر ده للمطور بس*'); } catch {}
      return true;
    }
    if (!PROTECTED_CMDS.has(c) && !PROTECTED_CMDS.has(cn)) return false;
    if (isOwnerMsg(m)) return false;
    if (!chat.endsWith('@g.us')) return false;
    const ids = await ownerIdsIn(chat);
    const targets = [m.quoted?.sender, m.quoted?.participant, ...(m.mentionedJid || []), ...(m.msg?.contextInfo?.mentionedJid || [])].filter(Boolean);
    const rest = t.replace(/^[./!]?\s*[^\s]+/, '').replace(/[^0-9]/g, '');
    if (rest.length >= 8) targets.push(rest);
    if (targets.some(j => ids.has(numOf(j)) || ids.has(rest))) {
      console.log('[ERIN-PROTECT] blocked', c, 'from', m.sender);
      try { await m.reply('*🛡️ مينفعش، ده المطور*'); } catch {}
      return true;
    }
  } catch (e) { console.error('[ERIN-ERR] protectHook', e?.message); }
  return false;
};
const powerHook = async (m) => {
  try {
    const t = (m.text || m.body || '').trim();
    const flat = t.replace(/[^\p{L}]/gu, '');
    const cmd = t.length <= 24 ? (flat === 'بوراوف' ? 'بور_اوف' : flat === 'بوراون' ? 'بور_اون' : undefined) : undefined;
    if (cmd) console.log('[ERIN-POWER] cmd', cmd, 'owner?', isOwnerMsg(m), JSON.stringify({ sender: m.sender, key: m.key }));
    if (cmd && isOwnerMsg(m)) {
      if (cmd === 'بور_اون') { setPower(false); try { await m.reply('*✅ البوت اشتغل تاني*'); } catch {} }
      else { try { await m.reply('*⛔ البوت اتقفل، اكتب بور_اون عشان يشتغل*'); } catch {} setPower(true); }
      return true;
    }
    const flat2 = t.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[^\p{L}]/gu, '');
    if (!globalThis.erinOff && t.length <= 14 && (flat2 === 'ايرن' || flat2 === 'ايرين') && (isOwnerMsg(m) || await isGroupAdminMsg(m))) {
      try { await m.reply('*🔒 وضع الادمنز شغال، البوت هيتفاعل مع المالك والادمنز بس. اكتب عام عشان يرجع للكل*'); } catch {}
      setAdminOnly(true);
      return true;
    }
    if (!globalThis.erinOff && t.length <= 10 && flat2 === 'عام' && (isOwnerMsg(m) || await isGroupAdminMsg(m))) {
      setAdminOnly(false);
      try { await m.reply('*🔓 رجع للكل، البوت بيرد على الكل تاني*'); } catch {}
      return true;
    }
    if (globalThis.erinAdminOnly && !globalThis.erinOff && !isOwnerMsg(m) && !(await isGroupAdminMsg(m))) return true;
    if (globalThis.erinOff) return true;
  } catch (e) { console.error('[ERIN-ERR] powerHook', e?.message); }
  return false;
};

/* ===== anti-profanity (سب) ===== */
const SWEAR_FILE = (process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.') + '/erin_swear.json';
let swearGroups = {};
try { swearGroups = JSON.parse(fs.readFileSync(SWEAR_FILE, 'utf8')); } catch {}
const saveSwear = () => { try { fs.writeFileSync(SWEAR_FILE, JSON.stringify(swearGroups)); } catch (e) { console.error('[ERIN-ERR] swear save', e?.message); } };
const normAr = (x) => (x || '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640\u06D6-\u06ED]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك').replace(/ی/g, 'ي')
  .toLowerCase().replace(/(.)\1+/gu, '$1');
const SWEAR_WORDS = new Set('كس بز طيز زب تيز تيظك تيظ تيزك كسمك علق خول متناك متناكه شرموطه'.split(' ').map(normAr));
const SWEAR_RES = [
  /^(?:و|ف)?(?:احا|احه)$/,
  /^[وف]?(?:يا|ال|[يبولكف])?خول(?:ك|كم|ي|نا|ات|ين)?$/,
  /^[وف]?(?:يا|ال|[يبولكف])?علق(?:ك|كم|نا|ني)?$/,
  /^[وف]?(?:يا|ال|[يبتنولكفم]{0,3})عرص(?:ك|كم|ها|هم|نا|ات|ين|ي)?$/,
  /^[وف]?(?:ال|[بلك])?سكس(?:ي|يه|ات|ا)?$/,
  /^[وف]?(?:ال|[بلك])?سيكو$/,
  /^sex(?:y)?$/,
  /^(?:يا|[يبولكفت])?كسم(?:ك|كم|ي|ه|ها|هم|نا|ات|ين)?$/,
];
const hasSwear = (text) => {
  const toks = normAr(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return toks.some(t => SWEAR_WORDS.has(t) || (t.length > 2 && t[0] === 'و' && SWEAR_WORDS.has(t.slice(1))) || SWEAR_RES.some(r => r.test(t)));
};
globalThis.erinHasSwear = hasSwear;
globalThis.erinSwear = {
  isOn: (chat) => !!swearGroups[chat],
  set: (chat, on) => { if (on) swearGroups[chat] = 1; else delete swearGroups[chat]; saveSwear(); },
  isGroupAdmin: isGroupAdminMsg,
  botIsAdmin: async (chat) => {
    const md = await client.sock.groupMetadata(chat);
    const me = [client.sock.user?.id, client.sock.user?.lid].filter(Boolean).map(numOf);
    return (md.participants || []).some(p => p.admin && [p.id, p.lid, p.jid, p.phoneNumber].filter(Boolean).map(numOf).some(x => me.includes(x)));
  },
};
/* strikes: more than 5 deleted swear messages from one person in a group within 10 min -> close group 10 min */
const LOCK_FILE = SWEAR_FILE.replace('erin_swear.json', 'erin_lock.json');
let lockState = {};
try { lockState = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')); } catch {}
const saveLock = () => { try { fs.writeFileSync(LOCK_FILE, JSON.stringify(lockState)); } catch (e) { console.error('[ERIN-ERR] lock save', e?.message); } };
const strikes = new Map();
const STRIKE_MAX = 5, STRIKE_WINDOW = 10 * 60 * 1000, LOCK_MS = 10 * 60 * 1000;
const swearStrike = async (chat, who) => {
  if (!who || lockState[chat]) return;
  const k = chat + '|' + numOf(who);
  const now = Date.now();
  const arr = (strikes.get(k) || []).filter(t => now - t < STRIKE_WINDOW);
  arr.push(now); strikes.set(k, arr);
  if (arr.length <= STRIKE_MAX) return;
  if (!(await globalThis.erinSwear.botIsAdmin(chat))) return;
  const md = await client.sock.groupMetadata(chat);
  if (md.announce) return;
  for (const kk of [...strikes.keys()]) if (kk.startsWith(chat + '|')) strikes.delete(kk);
  await client.sock.groupSettingUpdate(chat, 'announcement');
  lockState[chat] = Date.now() + LOCK_MS; saveLock();
  try { await client.sock.sendMessage(chat, { text: '*🔒 اتقفل الجروب 10 دقايق (للمشرفين بس) بسبب كتر السباب. هيفتح لوحده بعدها*' }); } catch {}
  console.log('[ERIN-SWEAR] group locked', chat);
};
const lockTimer = setInterval(async () => {
  try {
    if (!client.sock) return;
    for (const chat of Object.keys(lockState).filter(x => x !== '__tries')) {
      if (Date.now() < lockState[chat]) continue;
      try {
        await client.sock.groupSettingUpdate(chat, 'not_announcement');
        try { await client.sock.sendMessage(chat, { text: '*🔓 الجروب اتفتح تاني، التزموا بالأدب*' }); } catch {}
        console.log('[ERIN-SWEAR] group reopened', chat);
        delete lockState[chat]; saveLock();
      } catch (e) {
        console.error('[ERIN-ERR] reopen', e?.message);
        lockState[chat] = Date.now() + 60000; // retry in a minute
        if (!lockState.__tries) lockState.__tries = {};
        const n = (lockState.__tries[chat] = (lockState.__tries[chat] || 0) + 1);
        if (n >= 5) { delete lockState[chat]; delete lockState.__tries[chat]; }
        saveLock();
      }
    }
  } catch {}
}, 15000);
const swearHook = async (m) => {
  try {
    if (globalThis.erinOff) return false;
    const chat = m.chat || (m.key && m.key.remoteJid) || '';
    if (!chat.endsWith('@g.us') || !swearGroups[chat] || m.key?.fromMe) return false;
    const t = m.text || m.body || '';
    if (!t || !hasSwear(t)) return false;
    if (isOwnerMsg(m) || await isGroupAdminMsg(m)) return false;
    await client.sock.sendMessage(chat, { delete: m.key });
    console.log('[ERIN-SWEAR] deleted msg in', chat);
    try { await swearStrike(chat, m.sender || m.key?.participant || ''); } catch (e) { console.error('[ERIN-ERR] swearStrike', e?.message); }
    return true;
  } catch (e) { console.error('[ERIN-ERR] swearHook', e?.message); return false; }
};

/* ===== anti-link (رابط) ===== */
const LINK_FILE = (process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.') + '/erin_link.json';
let linkGroups = {};
try { linkGroups = JSON.parse(fs.readFileSync(LINK_FILE, 'utf8')); } catch {}
const saveLink = () => { try { fs.writeFileSync(LINK_FILE, JSON.stringify(linkGroups)); } catch (e) { console.error('[ERIN-ERR] link save', e?.message); } };
const LINK_RE = /(?:https?:\/\/|www\.|wa\.me\/|t\.me\/|chat\.whatsapp\.com|whatsapp\.com\/(?:channel|catalog)|discord\.gg|bit\.ly|tinyurl\.com|(?:^|[^\p{L}\p{N}@])[a-z0-9-]{2,}\.(?:com|net|org|io|me|gg|ly|co|app|xyz|link|ru|tv|info|to|cc|ws|click|site|online|shop|store|live|vip|top|club|fun|cloud|dev|ai|eg|sa|ae)(?:[\/:?#]|$|[^\p{L}\p{N}]))/iu;
const hasLink = (t) => LINK_RE.test((t || '').normalize('NFKC').replace(/\s*\[?\(?\s*(?:dot|نقطة)\s*\)?\]?\s*/gi, '.').replace(/[\u200B-\u200F\u202A-\u202E]/g, ''));
globalThis.erinLink = {
  isOn: (chat) => !!linkGroups[chat],
  set: (chat, on) => { if (on) linkGroups[chat] = 1; else delete linkGroups[chat]; saveLink(); },
  isGroupAdmin: isGroupAdminMsg,
  botIsAdmin: (chat) => globalThis.erinSwear.botIsAdmin(chat),
};
globalThis.erinHasLink = hasLink;
const linkHook = async (m) => {
  try {
    if (globalThis.erinOff) return false;
    const chat = m.chat || (m.key && m.key.remoteJid) || '';
    if (!chat.endsWith('@g.us') || !linkGroups[chat] || m.key?.fromMe) return false;
    const t = [m.text, m.body, m.msg?.matchedText, m.msg?.canonicalUrl].filter(Boolean).join(' ');
    if (!t || !hasLink(t)) return false;
    if (isOwnerMsg(m) || await isGroupAdminMsg(m)) return false;
    await client.sock.sendMessage(chat, { delete: m.key });
    console.log('[ERIN-LINK] deleted msg in', chat);
    return true;
  } catch (e) { console.error('[ERIN-ERR] linkHook', e?.message); return false; }
};
const powerTimer = setInterval(() => {
  const cs = client.commandSystem;
  if (!cs || !Array.isArray(cs.beforeHandlers)) return;
  clearInterval(powerTimer);
  cs.beforeHandlers.unshift(powerHook);
  cs.beforeHandlers.unshift(async (m, a) => { try { if (!m.isOwner && isOwnerMsg(m)) { m.isOwner = true; if (a) a.isOwner = true; } } catch {} return false; });
  cs.beforeHandlers.push(stickerHook);
  cs.beforeHandlers.push(khodHook);
  cs.beforeHandlers.push(async (m) => (globalThis.erinOff ? false : (globalThis.erinStoryHook ? globalThis.erinStoryHook(m) : false)));
  cs.beforeHandlers.unshift(async (m) => (globalThis.erinOff ? false : protectHook(m)));
  // moderation filters run before the admin-only/power gate so they work in every mode
  cs.beforeHandlers.unshift(linkHook);
  cs.beforeHandlers.unshift(swearHook);
  console.log('[ERIN-POWER] hook installed, off =', globalThis.erinOff);
}, 1000);


/* ===== Darwin welcome / goodbye on group join/leave ===== */
import { DARWIN_SYSTEM, writeText as dWrite, speak as dSpeak, takeVoiceSlot as dSlot, refundVoiceSlot as dRefund } from './lib/darwin.js';
const greetLast = new Map();
const GREET_SYS = {
  add: DARWIN_SYSTEM + " A new member just joined the group. Welcome them warmly and briefly. Do not say any name or number.",
  remove: DARWIN_SYSTEM + " A member just left the group. Say a short, kind, funny goodbye. Do not say any name or number."
};
const greetTimer = setInterval(() => {
  const sock = client.sock;
  if (!sock || sock.__erinGreet || !sock.ev) return;
  sock.__erinGreet = true;
  sock.ev.on('group-participants.update', async (ev) => {
    try {
      if (globalThis.erinOff) return;
      if (ev.action !== 'add' && ev.action !== 'remove') return;
      const chat = ev.id;
      const me = [sock.user?.id, sock.user?.lid].filter(Boolean).map(numOf);
      const people = (ev.participants || []).map(p => typeof p === 'string' ? { id: p } : p)
        .filter(p => !me.includes(numOf(p.id)) && !me.includes(numOf(p.phoneNumber)));
      if (!people.length) return;
      const now = Date.now();
      const prev = greetLast.get(chat) || { t: 0, v: 0 };
      if (now - prev.t < 15000) return;
      const voiceOk = now - prev.v > 60000 && !!process.env.FISH_API_KEY && dSlot();
      greetLast.set(chat, { t: now, v: voiceOk ? now : prev.v });
      const first = people[0];
      const tagNum = numOf(first.phoneNumber || first.id);
      const mentions = people.map(p => p.id);
      const tag = people.length > 1 ? `@${tagNum} وباقي الشلة` : `@${tagNum}`;
      const text = (await dWrite(GREET_SYS[ev.action], ev.action === 'add' ? 'رحب بعضو جديد' : 'ودع عضو غادر', '')).slice(0, 300);
      if (!text) { if (voiceOk) dRefund(); return; }
      const head = ev.action === 'add' ? '👋 نورت' : '👋 مع السلامة';
      if (voiceOk) {
        try {
          const audio = await dSpeak(text);
          await sock.sendMessage(chat, { text: `${head} ${tag}`, mentions });
          await sock.sendMessage(chat, { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true });
          return;
        } catch (e) { console.log('[DARWIN-GREET] voice failed:', e?.message); dRefund(); }
      }
      await sock.sendMessage(chat, { text: `${head} ${tag}\n🐟 ${text}`, mentions });
    } catch (e) { console.error('[ERIN-ERR] greet', e?.message); }
  });
  clearInterval(greetTimer);
  console.log('[DARWIN-GREET] listener installed');
}, 2000);

/* ===== sticker triggers: استر / مش فاهم ===== */
const loadSticker = (f) => { try { return fs.readFileSync(new URL('./assets/' + f, import.meta.url)); } catch (e) { console.error('[ERIN-ERR] sticker load', f, e?.message); return null; } };
const SEP = '[\\s!؟?.,،]';
const STICKERS = [
  { name: 'aster', buf: loadSticker('aster.webp'), re: new RegExp('(^|' + SEP + ')استر($|' + SEP + ')') },
  { name: 'mesh-fahem', buf: loadSticker('mesh_fahem.webp'), re: new RegExp('(^|' + SEP + ')مش\\s+فاهم(ه|ين|ك|ني|ها|هم)?($|' + SEP + ')') }
];

/* ===== خد sticker (needs reply or mention) ===== */
const KHOD_BUF = loadSticker('khod.webp');
const khodLast = new Map();
globalThis.erinKhod = async (m) => {
  if (!KHOD_BUF) return false;
  const chat = m.chat || m.key?.remoteJid;
  const hasTarget = !!(m.quoted || (m.mentionedJid && m.mentionedJid.length) || (m.msg?.contextInfo?.mentionedJid || []).length);
  if (!chat || !hasTarget) return false;
  const k = chat + '|' + numOf(m.sender);
  const now = Date.now();
  if (now - (khodLast.get(k) || 0) < 5000) return true;
  khodLast.set(k, now);
  let qt = m; try { if (m.quoted?.fakeObj) qt = m.quoted.fakeObj(); } catch {}
  try { await client.sock.sendMessage(chat, { sticker: KHOD_BUF }, { quoted: qt }); } catch (e) { await client.sock.sendMessage(chat, { sticker: KHOD_BUF }); }
  return true;
};
const khodHook = async (m) => {
  try {
    if (globalThis.erinOff || m.key?.fromMe) return false;
    const t = (m.text || m.body || '').trim();
    if (!/^خد(\s+@?\S+)?$/.test(t)) return false;
    return await globalThis.erinKhod(m);
  } catch (e) { console.error('[ERIN-ERR] khod', e?.message); return false; }
};
const stickerLast = new Map();
const stickerHook = async (m) => {
  try {
    if (globalThis.erinOff || m.key?.fromMe) return false;
    const t = (m.text || m.body || '').trim();
    if (!t || t.length > 40) return false;
    const flat = t.replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    const hit = STICKERS.find(x => x.buf && x.re.test(flat));
    if (!hit) return false;
    const chat = m.chat || m.key?.remoteJid;
    if (!chat) return false;
    const k = hit.name + '|' + chat;
    const now = Date.now();
    if (now - (stickerLast.get(k) || 0) < 20000) return false;
    stickerLast.set(k, now);
    await client.sock.sendMessage(chat, { sticker: hit.buf }, { quoted: m });
  } catch (e) { console.error('[ERIN-ERR] sticker', e?.message); }
  return false;
};

/* one-shot direct send test (only when DIRECT_TEST_TO is set) */
let directDone = false;
const directTimer = setInterval(async () => {
  const to = process.env.DIRECT_TEST_TO;
  const sock = client.sock;
  if (!to || directDone || !sock?.user || !sock.__erinWrapped) return;
  directDone = true;
  clearInterval(directTimer);
  try {
    const jid = to.replace(/\D/g, '') + '@s.whatsapp.net';
    const r = await sock.sendMessage(jid, { text: 'اختبار إرسال مباشر من إيرن ييغر ✅' });
    console.log('[ERIN-DIRECT] accepted', jid, r?.key?.id, JSON.stringify(r?.status));
  } catch (e) { console.error('[ERIN-DIRECT] FAIL', e?.message); }
}, 4000);

/* =========== Start ========== */
client.start();

/* LID -> phone-number JID for replies, plus send logging */
const lidToPn = new Map();
const wrapTimer = setInterval(() => {
  const sock = client.sock;
  if (!sock || sock.__erinWrapped || typeof sock.sendMessage !== 'function') return;
  sock.__erinWrapped = true;
  try {
    sock.ev.on('messages.upsert', ({ messages }) => {
      for (const m of messages || []) {
        const k = m.key || {};
        try {
          const me = (sock.user?.id || '').split(':')[0].split('@')[0];
          const meLid = (sock.user?.lid || '').split(':')[0].split('@')[0];
          const txt = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
          const num = (j) => (j || '').split(':')[0].split('@')[0];
          const own = [k.remoteJid, k.participant, k.remoteJidAlt, k.participantAlt].some(j => j && (num(j) === me || (meLid && num(j) === meLid)));
          console.log('[ERIN-IN]', JSON.stringify({ id: k.id, remoteJid: k.remoteJid, participant: k.participant, remoteJidAlt: k.remoteJidAlt, participantAlt: k.participantAlt, fromMe: !!k.fromMe, ownNumberInvolved: own, botUser: sock.user?.id, botLid: sock.user?.lid, push: m.pushName, text: txt.slice(0, 40) }));
        } catch (e) { console.log('[ERIN-IN] log failed', e?.message); }
        const alt = k.remoteJidAlt || k.senderPn || k.participantPn;
        if (k.remoteJid?.endsWith('@lid') && alt?.endsWith('@s.whatsapp.net')) lidToPn.set(k.remoteJid, alt);
      }
    });
  } catch (e) { console.error('[ERIN-LID] listener failed:', e?.message); }
  const resolve = async (jid) => {
    if (typeof jid !== 'string' || !jid.endsWith('@lid')) return jid;
    let pn = lidToPn.get(jid);
    if (!pn) {
      try { pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(jid); } catch {}
      if (pn && !pn.includes('@')) pn += '@s.whatsapp.net';
      if (pn) pn = pn.replace(/:\d+@/, '@');
    }
    if (pn) { lidToPn.set(jid, pn); return pn; }
    return jid;
  };
  for (const fn of ['sendMessage', 'relayMessage']) {
    const orig = sock[fn]?.bind(sock);
    if (!orig) continue;
    sock[fn] = async (jid, ...rest) => {
      if (globalThis.erinOff) { console.log('[ERIN-POWER] send blocked while off'); return { key: { id: 'ERIN-OFF', remoteJid: jid, fromMe: true } }; }
      const to = await resolve(jid);
      if (fn === 'sendMessage' && rest[0] && typeof rest[0] === 'object') {
        try {
          const ci = rest[0].contextInfo;
          if (ci) {
            if (ci.forwardedNewsletterMessageInfo) { ci.forwardedNewsletterMessageInfo.newsletterJid = globalThis.CH_JID; ci.forwardedNewsletterMessageInfo.newsletterName = 'إيرن ييغر'; }
          }
        } catch (e) { console.error('[ERIN-ERR] sanitize', e?.message); }
      }
      try {
        const r = await orig(to, ...rest);
        console.log('[ERIN-SEND]', fn, jid === to ? 'to' : 'lid->pn', jid, '=>', to, r?.key?.id || '');
        return r;
      } catch (e) { console.error('[ERIN-SEND] FAIL', fn, to, e?.message); throw e; }
    };
  }
}, 3000);


setTimeout(async () => {
if (client.commandSystem) { 
sub(client)
  }
}, 2000);


/* =========== Catch Errors ========== */
process.on('uncaughtException', (e) => {
    if (e.message.includes('rate-overlimit')) {}
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
});


/* 
=========== Memory Monitor ========== 

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 800) {
        console.log(`🔄 Bot memory full (${used.toFixed(1)}MB), restarting...`)
        process.exit(1) 
    }
}, 300_000) 

*/