import fs from 'fs';
let IMG = null;
try { IMG = fs.readFileSync(new URL('../assets/menu_full.jpg', import.meta.url)); } catch (e) { console.error('[OWNER] image load failed:', e?.message); }

let handler = async (m, { conn, bot }) => {
  const num = bot.config.owners[0].jid.split('@')[0];
  const caption = `*👑 المطور*\n\n*الاسم:* إيرن / مودي\n*رقم التواصل:* +${num}\nwa.me/${num}\n\n*📢 القناة:*\nhttps://whatsapp.com/channel/0029Vb8xDV8A2pLCoK6KtH36\n\n> إيرن ييغر ❤️💙`;
  if (IMG) {
    try { return await conn.sendMessage(m.chat, { image: IMG, caption }, { quoted: m }); }
    catch (e) { console.error('[OWNER] image send failed:', e?.message); }
  }
  await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
};

handler.command = /^(owner|مطور|المطور)$/i;

export default handler;
