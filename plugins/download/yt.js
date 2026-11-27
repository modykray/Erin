import { searchYT, sendMedia } from '../../system/ytdl.js';

const isUrl = (t) => /^https?:\/\//i.test(t);

const handler = async (m, { conn, command, text }) => {
  if (!text) throw '*❲ ❤️ ❳ ~ اكتب اسم الفيديو أو الأغنية أو حط رابط جنب الأمر ~ ❲ 💙 ❳ *\n\nمثال:\n.اغنيه اسم الاغنية\n.يوت اسم الفيديو';
  const isAudio = ['يوت_اغنيه', 'ytmp3', 'اغنيه', 'اغنية', 'play'].includes(command);
  try {
    m.react('⏳');
    let url = text.trim(), title = '';
    if (!isUrl(url)) { const s = await searchYT(url); url = s.url; title = s.title; }
    if (title) await conn.sendMessage(m.chat, { text: `*🐞 ${title}*\n> _*⏱️ استنى لحظات...*_` }, { quoted: m });
    await sendMedia(conn, m.chat, m, url, isAudio ? 'audio' : 'video');
    m.react('✅');
  } catch (e) {
    console.error('[ERIN-ERR] yt', e?.message);
    m.react('❌');
    m.reply('❌ حصل مشكلة في التحميل، جرب تاني أو رابط/اسم تاني');
  }
};

handler.usage = ["يوتيوب", "يوت", "اغنيه", "يوت_اغنيه"];
handler.category = "downloads";
handler.command = ['يوت_اغنيه', 'يوتيوب', 'يوت', 'اغنيه', 'اغنية', 'play', 'ytmp3', 'ytmp4'];

export default handler;
