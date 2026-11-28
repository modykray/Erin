import fs from 'fs';
let IMG = null;
try { IMG = fs.readFileSync(new URL('../assets/menu_full.jpg', import.meta.url)); } catch (e) { console.error('[OWNER] image load failed:', e?.message); }

const NUM = '201044013292';
const NAME = 'إيرن / مودي';

let handler = async (m, { conn }) => {
  const quoted = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: { conversation: 'إيرن ييغر ❤️💙' }
  };
  const card = {
    text: '*👑 المطور*',
    contextInfo: {
      forwardingScore: 2023,
      externalAdReply: {
        title: '𝑇𝛨𝛯 𝛩𝑊𝛮𝛯𝑅',
        body: NAME,
        sourceUrl: 'https://whatsapp.com',
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true,
        ...(IMG ? { thumbnail: IMG } : {})
      }
    }
  };
  try { await conn.sendMessage(m.chat, card, { quoted }); }
  catch (e) {
    console.error('[OWNER] card failed:', e?.message);
    try { await conn.sendMessage(m.chat, IMG ? { image: IMG, caption: `*👑 المطور*\n${NAME}` } : { text: `*👑 المطور*\n${NAME}` }, { quoted: m }); } catch {}
  }
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${NAME}\nTEL;type=CELL;waid=${NUM}:+${NUM}\nEND:VCARD`;
  try { await conn.sendMessage(m.chat, { contacts: { displayName: NAME, contacts: [{ vcard }] } }, { quoted: m }); }
  catch (e) { console.error('[OWNER] vcard send failed:', e?.message); }
};

handler.command = /^(owner|مطور|المطور)$/i;

export default handler;
