const OWNER_DM = '201044013292@s.whatsapp.net';
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const isOwner = globalThis.erinIsOwnerMsg ? globalThis.erinIsOwnerMsg(m) : false;
  if (!isOwner) return m.reply('*🔒 الأمر ده للمطور بس*');
  if (!m.quoted) return m.reply('*📎 رد على الرسالة اللي عايز تحفظها بـ .دليل*');
  try {
    const raw = m.raw?.message || m.message || {};
    const ctx = raw.extendedTextMessage?.contextInfo || raw.conversation?.contextInfo || {};
    const qm = ctx.quotedMessage || {};
    if (qm.viewOnceMessage || qm.viewOnceMessageV2 || qm.viewOnceMessageV2Extension) {
      return conn.sendMessage(OWNER_DM, { text: '*ℹ️ دي رسالة لمرة واحدة، البوت مش بيحفظ الميديا دي.*' });
    }
    let sender = m.quoted.sender || ctx.participant || '';
    let groupName = 'خاص';
    if (m.isGroup) {
      try {
        const md = await conn.groupMetadata(m.chat);
        groupName = md.subject || m.chat;
        const p = (md.participants || []).find(x => [x.id, x.lid, x.phoneNumber, x.jid].filter(Boolean).map(numOf).includes(numOf(sender)));
        if (p?.phoneNumber) sender = p.phoneNumber;
      } catch {}
    }
    const when = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'medium' });
    const head = `*📁 نسخة دليل خاصة بالمطور فقط*\n👤 المرسل: ${numOf(sender)}\n👥 المكان: ${groupName}\n🕒 وقت الحفظ: ${when}`;
    const mime = m.quoted.mimetype || m.quoted.msg?.mimetype || '';
    const hasMedia = /^(image|video|audio|application)\//.test(mime) || /image|video|audio|document|sticker/i.test(m.quoted.mtype || '');
    if (hasMedia) {
      const buf = await m.quoted.download();
      if (/^image\//.test(mime) && !/webp/.test(mime)) await conn.sendMessage(OWNER_DM, { image: buf, caption: head });
      else if (/^video\//.test(mime)) await conn.sendMessage(OWNER_DM, { video: buf, caption: head });
      else if (/^audio\//.test(mime)) { await conn.sendMessage(OWNER_DM, { text: head }); await conn.sendMessage(OWNER_DM, { audio: buf, mimetype: mime }); }
      else await conn.sendMessage(OWNER_DM, { document: buf, mimetype: mime || 'application/octet-stream', fileName: 'evidence', caption: head });
    } else {
      const body = m.quoted.text || m.quoted.body || '';
      if (!body) return conn.sendMessage(OWNER_DM, { text: '*⚠️ مقدرتش أقرأ الرسالة دي.*' });
      await conn.sendMessage(OWNER_DM, { text: `${head}\n\n💬 ${body}` });
    }
    try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
  } catch (e) {
    console.log('[EVIDENCE] error:', e?.message);
    try { await conn.sendMessage(OWNER_DM, { text: '*⚠️ فشل حفظ النسخة: ' + (e?.message || 'غير معروف') + '*' }); } catch {}
  }
};
handler.usage = ['دليل'];
handler.category = 'owner';
handler.command = ['دليل'];
export default handler;
