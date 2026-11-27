import { downloadContentFromMessage } from '@whiskeysockets/baileys';
const OWNER_DM = '201044013292@s.whatsapp.net';
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const isOwner = globalThis.erinIsOwnerMsg ? globalThis.erinIsOwnerMsg(m) : false;
  if (!isOwner) return m.reply('*🔒 الأمر ده للمطور بس*');
  if (!m.quoted) return m.reply('*📎 رد على الرسالة اللي عايز تحفظها بـ .دليل*');
  try {
    const ctx = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo || m.raw?.message?.extendedTextMessage?.contextInfo || {};
    let qm = ctx.quotedMessage || {};
    let wasVO = false;
    const w = qm.viewOnceMessage || qm.viewOnceMessageV2 || qm.viewOnceMessageV2Extension;
    if (w?.message) { qm = w.message; wasVO = true; }
    const vk = Object.keys(qm).find(k => /^(image|video|audio)Message$/.test(k));
    if (wasVO && !vk) return conn.sendMessage(OWNER_DM, { text: '*⚠️ دي رسالة لمرة واحدة بس مقدرتش أقرأ محتواها.*' });
    if (wasVO || (vk && !m.quoted.download)) {
      m.__vo = { node: qm[vk], type: vk.replace('Message', ''), vo: wasVO };
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
    const head = `*📁 نسخة دليل خاصة بالمطور فقط${m.__vo?.vo ? ' (رسالة لمرة واحدة)' : ''}*\n👤 المرسل: ${numOf(sender)}\n👥 المكان: ${groupName}\n🕒 وقت الحفظ: ${when}`;
    if (m.__vo) {
      const { node, type } = m.__vo;
      let buf = Buffer.from([]);
      try { for await (const c of await downloadContentFromMessage(node, type)) buf = Buffer.concat([buf, c]); } catch (e) { buf = null; }
      if (!buf || !buf.length) return conn.sendMessage(OWNER_DM, { text: head + '\n\n⚠️ دي رسالة لمرة واحدة بس فشل فك تشفير الميديا (ممكن اتفتحت أو انتهت).' });
      const cap = head + (node.caption ? '\n\n💬 ' + node.caption : '');
      if (type === 'image') await conn.sendMessage(OWNER_DM, { image: buf, caption: cap });
      else if (type === 'video') await conn.sendMessage(OWNER_DM, { video: buf, caption: cap });
      else { await conn.sendMessage(OWNER_DM, { text: head }); await conn.sendMessage(OWNER_DM, { audio: buf, mimetype: node.mimetype || 'audio/ogg; codecs=opus' }); }
      try { await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
      return;
    }
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
