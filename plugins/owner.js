import fs from 'fs';
let IMG = null;
try { IMG = fs.readFileSync(new URL('../assets/menu_full.jpg', import.meta.url)); } catch (e) { console.error('[OWNER] image load failed:', e?.message); }

const NUM = '201044013292';
const NAME = 'إيرن / مودي';

let handler = async (m, { conn }) => {
  const caption = `*👑 المطور*\n\n${NAME}\n> إيرن ييغر ❤️💙`;
  try {
    if (IMG) await conn.sendMessage(m.chat, { image: IMG, caption }, { quoted: m });
    else await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
  } catch (e) { console.error('[OWNER] image send failed:', e?.message); }
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${NAME}\nTEL;type=CELL;waid=${NUM}:+${NUM}\nEND:VCARD`;
  try { await conn.sendMessage(m.chat, { contacts: { displayName: NAME, contacts: [{ vcard }] } }, { quoted: m }); }
  catch (e) { console.error('[OWNER] vcard send failed:', e?.message); }
};

handler.command = /^(owner|مطور|المطور)$/i;

export default handler;
