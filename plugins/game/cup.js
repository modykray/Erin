import fs from 'fs';
const DATA_DIR = process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.';
const rd = (f) => { try { return JSON.parse(fs.readFileSync(DATA_DIR + '/' + f, 'utf8')); } catch { return {}; } };
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const cups = rd('erin_quiz_cups.json'), scores = rd('erin_quiz.json');
  const c = cups[m.chat]?.[m.sender] || { p1: 0, p2: 0, p3: 0, low: 0 };
  const pts = scores[m.chat]?.[m.sender] || 0;
  const txt = `🏆 *بطولات @${numOf(m.sender)}*\n🥇 المركز الأول: *${c.p1}*\n🥈 المركز التاني: *${c.p2}*\n🥉 المركز التالت: *${c.p3}*\n🎖️ مراكز بعدهم: *${c.low}*\n\n🧮 نقطك في الجولة الحالية: *${pts}/200*\n> الجولة بتخلص لما حد يوصل 200 نقطة في اختبر ذكاءك`;
  await conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m });
};
handler.usage = ['بطولة'];
handler.category = 'games';
handler.command = ['بطولة', 'بطولتي'];
export default handler;
