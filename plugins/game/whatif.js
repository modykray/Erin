import { writeText } from "../../lib/darwin.js";

const SYS = "أنت بوت واتساب مصري خفيف الدم وخيالك واسع. المستخدم هيديك سيناريو خيالي بعد عبارة (ماذا لو). اكتب إجابة مضحكة وخيالية عن اللي كان هيحصل، بالعامية المصرية، في 3 إلى 4 جمل قصيرة (أقل من 450 حرف). ممنوع: الشتايم، الكلام الجنسي، السخرية من الدين أو الأنبياء أو المقدسات، السياسة، الإساءة لأشخاص حقيقيين أو أي فئة. لو السؤال فيه حاجة من دي، حوله لسيناريو بريء ومضحك. بدون هاشتاجات.";
const FALLBACK = [
  "كان أول حاجة هيحصل إن الناس تعمل جروب واتساب للموضوع، وبعد 5 دقايق نص الجروب يطلع من الجروب، والباقي يتخانق على الصورة الشخصية. بعدها الحكومة تعلن إنها بتدرس الموضوع، والدراسة تفضل شغالة 30 سنة.",
  "أسعار كل حاجة كانت هتزيد فوراً، حتى الحاجة اللي ملهاش دعوة بالموضوع. وفي الآخر هنكتشف إن الحل هو كوباية شاي وتسليم أمر لله.",
  "الأول كله هيصور فيديو ويقول 'مصدقتش عيني'، بعدين هيطلع ميم، وبعدين عم حسين اللي في المحل هيبيع حاجة اسمها 'ضد الموضوع ده' بـ 50 جنيه.",
];
const COOLDOWN_MS = 15000;
const last = new Map();

const handler = async (m, { text }) => {
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  let q = (text || "").trim().replace(/^لو\s+/, "").slice(0, 200);
  if (!q) return m.reply("*🤔 اكتب السيناريو بعد الأمر، مثلا: .ماذا لو عاشت الديناصورات*");
  last.set(m.sender, now);
  let out = "";
  try { out = (await writeText(SYS, "ماذا لو " + q, "")).trim().slice(0, 700); } catch (e) { console.log("[WHATIF] ai error:", e?.message); }
  if (!out) out = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  await m.reply(`*🔮 ماذا لو ${q}؟*\n\n${out}`);
};
handler.usage = ["ماذا لو"];
handler.category = "games";
handler.command = ["ماذا", "ماذا_لو", "ماذالو"];
export default handler;
