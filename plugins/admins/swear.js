const handler = async (m) => {
  const chat = m.chat;
  if (!chat.endsWith('@g.us')) return m.reply('*الأمر ده للجروبات بس*');
  const S = globalThis.erinSwear;
  const ok = (globalThis.erinIsOwnerMsg && globalThis.erinIsOwnerMsg(m)) || (await S.isGroupAdmin(m));
  if (!ok) return m.reply('*🔒 الأمر ده للمشرفين بس*');
  if (S.isOn(chat)) {
    S.set(chat, false);
    return m.reply('*✅ تم إيقاف منع السباب في الجروب ده*');
  }
  let botAdmin = false;
  try { botAdmin = await S.botIsAdmin(chat); } catch {}
  if (!botAdmin) return m.reply('*⚠️ لازم أكون مشرف في الجروب عشان أقدر أمسح الرسائل. ارفعني مشرف وجرب تاني*');
  S.set(chat, true);
  return m.reply('*✅ تم تفعيل منع السباب: أي رسالة فيها ألفاظ مسيئة هتتمسح تلقائياً (المشرفين مستثنين)*');
};
handler.usage = ['سب'];
handler.category = 'admin';
handler.command = ['سب'];
export default handler;
