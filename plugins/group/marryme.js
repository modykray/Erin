const num = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const meta = await conn.groupMetadata(m.chat);
  const participants = meta.participants || [];
  const sender = m.sender;
  const botIds = new Set([num(conn.user?.id), num(conn.user?.lid)].filter(Boolean));
  const mine = new Set([num(sender)]);
  const me = participants.find(p => num(p.id) === num(sender) || num(p.phoneNumber) === num(sender) || num(p.lid) === num(sender));
  const senderId = me?.id || sender;
  mine.add(num(senderId)); if (me?.phoneNumber) mine.add(num(me.phoneNumber)); if (me?.lid) mine.add(num(me.lid));

  const pool = participants.filter(p => {
    const ids = [p.id, p.phoneNumber, p.lid].map(num).filter(Boolean);
    return !ids.some(i => botIds.has(i) || mine.has(i));
  });
  if (!pool.length) return conn.sendMessage(m.chat, { text: 'المجموعة صغيرة جداً' }, { quoted: m });

  const other = pool[Math.floor(Math.random() * pool.length)].id;
  const senderIsGroom = Math.random() < 0.5;
  const groom = senderIsGroom ? senderId : other;
  const bride = senderIsGroom ? other : senderId;
  const p1 = (Math.floor(Math.random() * 100) + 1) + '%';
  const p2 = (Math.floor(Math.random() * 100) + 1) + '%';

  return conn.sendMessage(m.chat, {
    text: `*🥳 مبروك الزواج تمني لكم كل خير 🥳*

*🤵🏻 العريس:* @${num(groom)} 
*🌹 نسبة حبه للعروسه:* ${p1}

*👰🏻‍♀️ العروسه:* @${num(bride)} 
*🌹 نسبة حبها للعريس:* ${p2}`,
    mentions: [groom, bride]
  }, { quoted: m });
};

handler.usage = ["جوزني"];
handler.category = "group";
handler.command = ["جوزني"];
handler.group = true;

export default handler;
