const handler = async (m, { conn }) => {
  const isOwner = globalThis.erinIsOwnerMsg ? globalThis.erinIsOwnerMsg(m) : false;
  const isAdmin = isOwner || (globalThis.erinLink ? await globalThis.erinLink.isGroupAdmin(m) : false);
  if (!isAdmin) return m.reply('*🔒 الأمر ده للمشرفين بس*');
  const target = m.quoted?.sender || m.mentionedJid?.[0];
  if (!target) return m.reply('*📎 رد على رسالة الشخص بـ .بروف*');
  const cands = [target, m.quoted?.participant, m.msg?.contextInfo?.participant].filter(Boolean);
  let url = null;
  for (const j of cands) {
    for (const type of ['image', 'preview']) {
      try { url = await conn.profilePictureUrl(j, type); } catch {}
      if (url) break;
    }
    if (url) break;
  }
  if (!url) return m.reply('*🙈 مفيش صورة ظاهرة، يا إما مخبيها يا إما مش حاطط أصلاً*');
  try {
    await conn.sendMessage(m.chat, { image: { url }, caption: `*📸 صورة @${(target.split('@')[0])}*`, mentions: [target] }, { quoted: m });
  } catch (e) {
    console.log('[PROF] send error', e?.message);
    await m.reply('*🙈 معرفتش أجيب الصورة*');
  }
};
handler.usage = ['بروف'];
handler.category = 'admin';
handler.command = ['بروف'];
export default handler;
