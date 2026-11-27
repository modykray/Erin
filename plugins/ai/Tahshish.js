import { writeText } from "../../lib/darwin.js";

const ROAST = "أنت بوت واتساب مصري خفيف الدم. اكتب تحشيش (قلش) ودود وقصير جدا (جملة أو جملتين، أقل من 160 حرف) بالعامية المصرية على شخص صاحبك في الجروب. ممنوع نهائيا: الشتائم، أي كلام جنسي، الدين، العيلة والأهل، الشكل أو الجسم أو أي حاجة بتجرح. هزار بريء عن حاجات خفيفة زي النوم الكتير أو التأخير أو الأكل أو إنه بيقول هيجي ومبيجيش. بدون إيموجي وبدون ذكر اسم أو رقم.";
const COMPLIMENT = "أنت بوت واتساب مصري. اكتب مجاملة حلوة وقصيرة جدا (جملة واحدة، أقل من 120 حرف) بالعامية المصرية عن مطور البوت إنه عبقري وأسطورة. بدون إيموجي وبدون ذكر اسم أو رقم.";
const COOLDOWN_MS = 20000;
const last = new Map();
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const handler = async (m, { conn }) => {
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  const target = m.quoted?.sender || m.mentionedJid?.[0];
  if (!target) return m.reply("*🎭 منشن حد أو رد على رسالته، مثلا: .تحشيش @فلان*");
  last.set(m.sender, now);
  try {
    let ids = new Set(['201044013292', '201044019293', '168659775398062']);
    try { if (globalThis.erinOwnerIdsIn) ids = await globalThis.erinOwnerIdsIn(m.chat); } catch {}
    const isOwnerTarget = ids.has(numOf(target)) || (m.quoted?.participant && ids.has(numOf(m.quoted.participant)));
    const line = (await writeText(isOwnerTarget ? COMPLIMENT : ROAST, isOwnerTarget ? "مجاملة للمطور" : "حشش عليه", "")).slice(0, 220);
    if (!line) throw new Error("empty");
    const tag = `@${numOf(target)}`;
    await conn.sendMessage(m.chat, { text: `${isOwnerTarget ? "👑" : "🎭"} ${tag} ${line}`, mentions: [target] }, { quoted: m });
  } catch (e) {
    console.log("[TAHSHISH] error:", e?.message);
    last.delete(m.sender);
    await m.reply("*🎭 مفيش حشو دلوقتي، جرب كمان شوية*");
  }
};
handler.usage = ["تحشيش"];
handler.category = "games";
handler.command = ["تحشيش"];
export default handler;
