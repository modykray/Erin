import { writeText } from "../../lib/darwin.js";

const STYLES = ["رسمي", "كوميدي", "صعيدي", "سرسجي", "اسكندراني", "شاعري", "رومانسي", "غاضب", "مهذب", "فلاحي", "بلدي", "اطفال", "دراما", "اعلان"];
const SAFE = "ممنوع: الشتايم، الكلام الجنسي، السخرية من الدين أو الأنبياء أو المقدسات، السياسة، الإساءة لأشخاص حقيقيين أو أي فئة. لو الجملة فيها حاجة من دي، اكتب نسخة بريئة ومهذبة.";
const COOLDOWN_MS = 10000;
const last = new Map();
const nz = (s) => (s || "").replace(/[\u064B-\u065F\u0640]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
const STYLE_SET = new Set(STYLES.map(nz));
const help = `*🎭 اسلوب*\nاكتب الأسلوب وبعده الجملة، مثلا: *.اسلوب صعيدي انا رايح السوق*\nأو رد على رسالة واكتب *.اسلوب رسمي*\n\nالأساليب: ${STYLES.join("، ")} (وأي أسلوب تاني تكتبه لو بتردّ على رسالة)`;

const handler = async (m, { text }) => {
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  const arg = (text || "").trim();
  const q = m.quoted;
  const quotedText = (q?.text || q?.body || q?.caption || q?.msg?.conversation || q?.msg?.text || "").trim();
  let style = "", body = "";
  if (quotedText && arg) { style = arg.slice(0, 40); body = quotedText; }
  else {
    const toks = arg.split(/\s+/).filter(Boolean);
    if (toks.length >= 2 && STYLE_SET.has(nz(toks[0]))) { style = toks[0]; body = toks.slice(1).join(" "); }
    else if (toks.length >= 2 && STYLE_SET.has(nz(toks[toks.length - 1]))) { style = toks[toks.length - 1]; body = toks.slice(0, -1).join(" "); }
  }
  body = body.slice(0, 300);
  if (!style || !body) return m.reply(help);
  last.set(m.sender, now);
  const SYS = `أنت بوت واتساب مصري. المستخدم هيديك جملة وأسلوب، أعد كتابة نفس الجملة بنفس المعنى بالظبط بأسلوب (${style}) بالعامية أو اللهجة المناسبة للأسلوب. رد بالجملة المعاد كتابتها فقط، أقل من 400 حرف، بدون شرح ولا هاشتاجات. ${SAFE}`;
  let out = "";
  try { out = (await writeText(SYS, `الأسلوب: ${style}\nالجملة: ${body}`, "")).trim().slice(0, 700); } catch (e) { console.log("[STYLE] ai error:", e?.message); }
  if (!out) return m.reply("*😅 الدماغ بتاعتي هنجت دلوقتي، جرب تاني بعد شوية*");
  await m.reply(`*🎭 ${style}:*\n\n${out}`);
};
handler.usage = ["اسلوب"];
handler.category = "games";
handler.command = ["اسلوب", "أسلوب", "style"];
export default handler;
