import { Client } from 'meowsab';
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from './sub.js';

/* Channel jid: starts from the old id, then resolved from the invite link once connected */
globalThis.CH_JID = '120363225356834044@newsletter';
const CH_INVITE = '0029Vb8xDV8A2pLCoK6KtH36';

/* =========== Client ========== */
const client = new Client({
  phoneNumber: process.env.BOT_NUMBER || '201044019293', // Bot number
  sessionPath: process.env.SESSION_PATH || './session',
  prefix: [".", "/", "!"],
  fromMe: false, 
  owners: [
    { name: "إيرن / مودي", jid: "201044013292@s.whatsapp.net", lid: "" },
    { name: "إيرن / مودي", jid: "201044019293@s.whatsapp.net", lid: "" }
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
    return jid; // reply to the exact chat the message came from (no lid->pn rewrite)
    // eslint-disable-next-line no-unreachable
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
      const to = await resolve(jid);
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