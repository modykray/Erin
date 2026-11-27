import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OWNER_NUMS = new Set(['201044013292', '201044019293']);
const OWNER_LIDS = new Set(['168659775398062']);
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const k = m.key || {};
  const isOwner = m.isOwner || [m.sender, k.participant, k.participantAlt, k.remoteJid, k.remoteJidAlt]
    .some(j => j && (OWNER_NUMS.has(numOf(j)) || OWNER_LIDS.has(numOf(j))) && !(j.endsWith('@g.us')));
  if (isOwner) return m.reply('*✨ نسبة جمالك 100% يا مطوري، القمر نفسه بيغير منك 😎*');
  const img = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../assets/donkey.jpg');
  return conn.sendMessage(m.chat, { image: fs.readFileSync(img), caption: '*🫏 دي نسبة جمالك*' }, { quoted: m });
};
handler.usage = ['جمالي'];
handler.command = ['جمالي'];
handler.category = 'info';
export default handler;
