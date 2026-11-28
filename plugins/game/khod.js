const handler = async (m) => {
  const ok = globalThis.erinKhod ? await globalThis.erinKhod(m) : false;
  if (!ok) return m.reply('*↩️ رد على رسالة حد أو منشنه واكتب خد*');
};
handler.usage = ['خد'];
handler.category = 'games';
handler.command = ['خد'];
export default handler;
