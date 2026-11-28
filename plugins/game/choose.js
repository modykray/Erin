import { writeText } from "../../lib/darwin.js";

const SAFE = "ممنوع: الشتايم، الكلام الجنسي، السخرية من الدين أو الأنبياء أو المقدسات، السياسة، الإساءة لأشخاص حقيقيين أو أي فئة.";
const FALLBACK = [
  (c) => `اخترت *${c}* لأن قلبي حاسس، وقلبي عمره ما غلط (غلط مرتين بس).`,
  (c) => `*${c}* هو الحل. اللي يعترض يروح يختار لنفسه.`,
  (c) => `رميت عملة في خيالي وطلعت *${c}*. القرار نهائي ومفيش استئناف.`,
  (c) => `*${c}* بدون تفكير، التفكير غالي النهارده.`,
  (c) => `الأرقام بتقول *${c}*، وأنا ما بجادلش الأرقام لما بعمل نفسي فاهم.`,
];
const COOLDOWN_MS = 8000;
const last = new Map();

const handler = async (m, { text }) => {
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  const raw = (text || "").replace(/^\s*(بدالي|بدلي|لي)\s*/, "").trim().slice(0, 300);
  const opts = raw.split(/\s+(?:او|أو|or)\s+|[,،\n|/]+/i).map(s => s.trim()).filter(Boolean);
  if (opts.length < 2) return m.reply("*🎲 اكتب اختياراتك، مثلا: .اختار بدالي بيتزا او كشري او شاورما*\nتقدر تفصل بـ او أو فاصلة");
  last.set(m.sender, now);
  const pick = opts[Math.floor(Math.random() * opts.length)];
  const SYS = `أنت بوت واتساب مصري خفيف الدم. المستخدم محتار بين اختيارات، وأنا اخترت له واحد بالفعل. اكتب جملة واحدة قصيرة (أقل من 150 حرف) بالعامية المصرية تبرر بيها الاختيار بشكل مضحك. لازم تذكر الاختيار المختار بالنص. بدون هاشتاجات. ${SAFE}`;
  let why = "";
  try { why = (await writeText(SYS, `الاختيارات: ${opts.join(" / ")}\nالمختار: ${pick}`, "")).trim().slice(0, 300); } catch (e) { console.log("[CHOOSE] ai error:", e?.message); }
  if (!why) why = FALLBACK[Math.floor(Math.random() * FALLBACK.length)](pick);
  await m.reply(`*🎲 اخترتلك: ${pick}*\n\n${why}`);
};
handler.usage = ["اختار بدالي"];
handler.category = "games";
handler.command = ["اختار", "اختر"];
export default handler;
