import { writeText } from "../../lib/darwin.js";

const SYS = `أنت خبير مصري صريح بيقيّم الأفكار بصدق من غير مجاملة. المستخدم هيديك فكرة (مشروع أو تطبيق أو محتوى أو أي حاجة). رد بالعامية المصرية بالشكل ده بالظبط:
⭐ التقييم: X/10 (X رقم من 1 لـ 10، كن واقعي، الأفكار العادية بين 4 و6)
✅ المميزات: نقطتين أو تلاتة قصيرين
❌ العيوب: نقطتين أو تلاتة قصيرين وحقيقيين
💡 نصيحة: جملة واحدة تحسّن بيها الفكرة
الإجمالي أقل من 600 حرف. ممنوع: الشتايم، الكلام الجنسي، السخرية من الدين أو المقدسات، السياسة. لو الفكرة فيها أذى لحد أو حاجة غير قانونية، قيّمها 1/10 واشرح السبب بإيجاز.`;
const COOLDOWN_MS = 15000;
const last = new Map();

const handler = async (m, { text }) => {
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  const q0 = (text || "").trim().replace(/^(فكرتي|الفكرة|فكره|فكرة)\s*/, "");
  const qt = m.quoted;
  const quotedText = (qt?.text || qt?.body || qt?.caption || qt?.msg?.conversation || qt?.msg?.text || "").trim();
  const idea = (q0 || quotedText).slice(0, 500);
  if (!idea) return m.reply("*💡 اكتب فكرتك بعد الأمر أو رد على رسالة فيها الفكرة، مثلا:*\n.تقييم تطبيق يوصل الأكل للجيران");
  last.set(m.sender, now);
  let out = "";
  try { out = (await writeText(SYS, "الفكرة: " + idea, "")).trim().slice(0, 1000); } catch (e) { console.log("[RATE] ai error:", e?.message); }
  if (!out) return m.reply("*😅 مخي هنج دلوقتي، ابعت الفكرة تاني بعد شوية*");
  await m.reply(`*📊 تقييم الفكرة:*\n\n${out}`);
};
handler.usage = ["تقييم", "قيم فكرتي"];
handler.category = "games";
handler.command = ["تقييم", "قيم", "قيم_فكرتي", "تقييم_الفكرة"];
export default handler;
