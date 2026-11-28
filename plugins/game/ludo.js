/* ليدو lobby: .ليدو opens a lobby, .1-.4 take a colour slot, .بدا starts (owner of lobby or Erin). The web game plugs in later via global.ludo.onStart. */
const COLORS = { 1: '🔴 الأحمر', 2: '🟢 الأخضر', 3: '🟡 الأصفر', 4: '🔵 الأزرق' };
const IDLE_MS = 15 * 60 * 1000;
if (!global.ludo) global.ludo = { lobbies: {}, onStart: null };
const L = global.ludo;
const numOf = (j) => (j || '').split(':')[0].split('@')[0];
const isGroup = (m) => (m.chat || '').endsWith('@g.us');
const isErin = (m) => m.isOwner || (globalThis.erinIsOwnerMsg ? globalThis.erinIsOwnerMsg(m) : false);

const lobbyOf = (chat) => {
  const lb = L.lobbies[chat];
  if (lb && Date.now() - lb.touched > IDLE_MS && lb.state === 'open') { delete L.lobbies[chat]; return null; }
  return lb || null;
};
const render = (lb) => {
  const rows = [1, 2, 3, 4].map(i => `${COLORS[i]}  ←  ${lb.slots[i] ? '@' + numOf(lb.slots[i].jid) : '(فاضي، اكتب .' + i + ')'}`).join('\n');
  const n = Object.values(lb.slots).filter(Boolean).length;
  return `🎲 *لوبي ليدو*\n\n${rows}\n\nاللاعبين: *${n}/4* (أقل حاجة 2)\nاكتب *.1* أو *.2* أو *.3* أو *.4* تدخل بلون\nصاحب اللوبي @${numOf(lb.owner)} يكتب *.بدا* يبدأ\nاللوبي بيتقفل لوحده بعد 15 دقيقة سكوت`;
};
const mentionsOf = (lb) => [...new Set([lb.owner, ...Object.values(lb.slots).filter(Boolean).map(s => s.jid)])];
const send = (conn, m, lb, text) => conn.sendMessage(m.chat, { text, mentions: mentionsOf(lb) }, { quoted: m });

const open = async (m, { conn }) => {
  if (!isGroup(m)) return m.reply('*🎲 ليدو بتتلعب في الجروبات بس*');
  let lb = lobbyOf(m.chat);
  if (lb && lb.state === 'started') return m.reply('*🎲 فيه لعبة ليدو شغالة في الجروب ده دلوقتي*');
  if (!lb) lb = L.lobbies[m.chat] = { chat: m.chat, owner: m.sender, slots: { 1: null, 2: null, 3: null, 4: null }, state: 'open', touched: Date.now() };
  lb.touched = Date.now();
  await send(conn, m, lb, render(lb));
};

const join = (slot) => async (m, { conn }) => {
  if (!isGroup(m)) return;
  const lb = lobbyOf(m.chat);
  if (!lb || lb.state !== 'open') return;
  const cur = lb.slots[slot];
  if (cur && cur.jid === m.sender) return m.reply(`*أنت أصلا ${COLORS[slot]}*`);
  if (cur) return m.reply(`*${COLORS[slot]} واخده @${numOf(cur.jid)}، اختار لون تاني*`);
  for (const i of [1, 2, 3, 4]) if (lb.slots[i]?.jid === m.sender) lb.slots[i] = null; // switching colour frees the old one
  lb.slots[slot] = { jid: m.sender, name: m.pushName || numOf(m.sender) };
  lb.touched = Date.now();
  await send(conn, m, lb, render(lb));
};

const start = async (m, { conn }) => {
  if (!isGroup(m)) return;
  const lb = lobbyOf(m.chat);
  if (!lb || lb.state !== 'open') return;
  if (m.sender !== lb.owner && !isErin(m)) return m.reply('*🎲 صاحب اللوبي بس هو اللي يبدأ*');
  const players = Object.entries(lb.slots).filter(([, s]) => s);
  if (players.length < 2) return m.reply('*🎲 محتاجين لاعبين اتنين على الأقل*');
  if (typeof L.onStart === 'function') return L.onStart(lb, m, conn);
  lb.state = 'started';
  await send(conn, m, lb, `🎲 *اللوبي اتقفل* واللاعبين جاهزين:\n${players.map(([i, s]) => `${COLORS[i]}: @${numOf(s.jid)}`).join('\n')}\n\n⏳ لعبة الويب لسه بتتجهز، هبعتلكم الرابط أول ما تخلص.`);
  setTimeout(() => { if (L.lobbies[m.chat] === lb && lb.state === 'started' && !lb.game) delete L.lobbies[m.chat]; }, 30 * 60 * 1000);
};

const cancel = async (m) => {
  if (!isGroup(m)) return;
  const lb = lobbyOf(m.chat);
  if (!lb) return;
  if (m.sender !== lb.owner && !isErin(m)) return m.reply('*🎲 صاحب اللوبي بس هو اللي يلغيه*');
  delete L.lobbies[m.chat];
  await m.reply('*🎲 اللوبي اتلغى*');
};

const joinFns = { 1: join(1), 2: join(2), 3: join(3), 4: join(4) };
const handler = async (m, ctx) => {
  const c = String(ctx.command || '').trim().toLowerCase();
  if (/^[1-4]$/.test(c)) return joinFns[c](m, ctx);
  if (['بدا', 'بدأ', 'ابدا', 'ابدأ'].includes(c)) return start(m, ctx);
  if (['الغي_ليدو', 'الغاء_ليدو'].includes(c)) return cancel(m, ctx);
  return open(m, ctx);
};
handler.command = ['ليدو', 'ludo', '1', '2', '3', '4', 'بدا', 'بدأ', 'ابدا', 'ابدأ', 'الغي_ليدو', 'الغاء_ليدو'];
handler.usage = ['ليدو'];
handler.category = 'games';
export default handler;
