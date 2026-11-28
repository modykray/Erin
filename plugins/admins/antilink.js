const handler = async (m) => {
  const chat = m.chat;
  if (!chat.endsWith('@g.us')) return m.reply('*الأمر ده للجروبات بس*');
  const S = globalThis.erinLink;
  const ok = (globalThis.erinIsOwnerMsg && globalThis.erinIsOwnerMsg(m)) || (await S.isGroupAdmin(m));
  if (!ok) return m.reply('*🔒 الأمر ده للمشرفين بس*');
  if (S.isOn(chat)) {
    S.set(chat, false);
    return m.reply('*✅ تم إيقاف منع الروابط في الجروب ده*');
  }
  let botAdmin = false;
  try { botAdmin = await S.botIsAdmin(chat); } catch {}
  if (!botAdmin) return m.reply('*⚠️ لازم أكون مشرف في الجروب عشان أقدر أمسح الرسائل. ارفعني مشرف وجرب تاني*');
  S.set(chat, true);
  return m.reply('*✅ تم تفعيل منع الروابط: أي رسالة فيها رابط من غير المشرفين هتتمسح تلقائياً (المشرفين مستثنين)*');
};
handler.usage = ['رابط'];
handler.category = 'admin';
handler.command = ['رابط'];
export default handler;
