import { searchYT, sendMedia, fetchMedia, sendFile, ytTitle } from '../../system/ytdl.js';

const isUrl = (t) => /^https?:\/\//i.test(t);

const handler = async (m, { conn, command, text }) => {
  if (!text) throw '*❲ ❤️ ❳ ~ اكتب اسم الفيديو أو الأغنية أو حط رابط جنب الأمر ~ ❲ 💙 ❳ *\n\nمثال:\n.اغنيه اسم الاغنية\n.يوت اسم الفيديو';
  const isAudio = ['يوت_اغنيه', 'ytmp3', 'اغنيه', 'اغنية', 'play'].includes(command);
  try {
    m.react('⏳');
    const q = text.trim();
    if (isAudio) {
      let r;
      if (isUrl(q)) {
        try { r = await fetchMedia(q, 'audio'); }
        catch (e) {
          console.error('[ERIN-ERR] yt audio url, trying soundcloud', e?.message?.slice(0, 120));
          const t = await ytTitle(q);
          r = await fetchMedia('scsearch1:' + t, 'audio');
        }
      } else {
        try { r = await fetchMedia('scsearch1:' + q, 'audio'); }
        catch (e) {
          console.error('[ERIN-ERR] soundcloud failed, trying youtube', e?.message?.slice(0, 120));
          const s = await searchYT(q);
          r = await fetchMedia(s.url, 'audio');
        }
      }
      await conn.sendMessage(m.chat, { text: `*🎧 ${r.title}*` }, { quoted: m });
      await sendFile(conn, m.chat, m, r, 'audio');
    } else {
      let url = q, title = '';
      if (!isUrl(url)) { const s = await searchYT(url); url = s.url; title = s.title; }
      if (title) await conn.sendMessage(m.chat, { text: `*🐞 ${title}*\n> _*⏱️ استنى لحظات...*_` }, { quoted: m });
      await sendMedia(conn, m.chat, m, url, 'video');
    }
    m.react('✅');
  } catch (e) {
    console.error('[ERIN-ERR] yt', e?.message);
    m.react('❌');
    m.reply(isAudio ? '❌ حصل مشكلة في التحميل، جرب اسم تاني' : '❌ يوتيوب بيمنع تحميل الفيديو من السيرفر دلوقتي، جرب .اغنيه للصوت');
  }
};

handler.usage = ["يوتيوب", "يوت", "اغنيه", "يوت_اغنيه"];
handler.category = "downloads";
handler.command = ['يوت_اغنيه', 'يوتيوب', 'يوت', 'اغنيه', 'اغنية', 'play', 'ytmp3', 'ytmp4'];

export default handler;
