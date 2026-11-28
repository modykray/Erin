import { writeText } from "../../lib/darwin.js";

const TTL = 5 * 60 * 1000;
const MAX_ROUNDS = 3;
const sessions = new Map();
const key = (m) => `${m.chat}|${(m.sender || '').split(':')[0].split('@')[0]}`;
const SYS = "أنت راوي قصص تفاعلية مصري خفيف الدم. بالعامية المصرية اكتب فقرة قصيرة (2 إلى 3 جمل، أقل من 350 حرف) ثم اكتب بالظبط 3 اختيارات مرقمة كل واحد في سطر بالشكل: 1) ... 2) ... 3) ... (كل اختيار أقل من 60 حرف). القصة مغامرة كوميدية خيالية. ممنوع: الشتايم، الكلام الجنسي، الدين والمقدسات، السياسة، الإساءة لأشخاص حقيقيين أو أي فئة، العنف الدموي. بدون هاشتاجات.";
const SYS_END = "أنت راوي قصص تفاعلية مصري خفيف الدم. اكتب بالعامية المصرية نهاية مضحكة للقصة في 2 إلى 3 جمل (أقل من 350 حرف) بناءً على اللي حصل، وبدون أي اختيارات. نفس الممنوعات: شتايم، جنس، دين، سياسة، إساءة لحد.";

const parse = (t) => {
  const choices = [];
  const body = [];
  for (const line of (t || '').split('\n')) {
    const mm = line.match(/^\s*([123])\s*[\)\.\-:]\s*(.+)$/);
    if (mm) choices.push(mm[2].trim()); else if (line.trim()) body.push(line.trim());
  }
  return { story: body.join('\n'), choices: choices.slice(0, 3) };
};

const STATIC = {
  s: { t: "صحيت الصبح لقيت حمار واقف في أوضتك لابس نضارة شمس وبيقولك: 'يلا بينا، فاضل 5 دقايق على الرحلة'.", c: ["أركب الحمار", "أسأله رحلة فين", "أرجع أنام تاني"],
    n: ["ركبت وانطلق بيك لحد السوق، والناس صقفت لك. الحمار بيقولك: 'أنا الدليل السياحي'.", "قالك رحلة للمريخ عن طريق مترو الأنفاق. وطلع التذكرة بـ 3 جنيه.", "نمت، وصحيت لقيت الحمار نايم جنبك وبيشخر أعلى منك."] },
  e: ["وفي الآخر طلعت بطل الحارة وعمل لك الحمار تمثال. النهاية 🐴", "ورجعت البيت وحكيت للجيران، محدش صدق، لكن الحمار حضر العشا. النهاية 🐴", "وكله طلع حلم، بس الحمار فضل يبعتلك رسايل على الواتساب. النهاية 🐴"],
};

const render = (story, choices) => `*📖 القصة*\n\n${story}${choices.length ? '\n\n' + choices.map((c, i) => `*${i + 1})* ${c}`).join('\n') + '\n\n_رد برقم الاختيار (1-' + choices.length + ')_' : ''}`;

const ask = async (sys, text) => {
  try { return parse((await writeText(sys, text, "")).trim().slice(0, 900)); } catch (e) { console.log("[STORY] ai error:", e?.message); return { story: '', choices: [] }; }
};

const handler = async (m, { text }) => {
  const k = key(m);
  const arg = (text || '').trim();
  if (/^(انهاء|إنهاء|خروج|وقف)$/.test(arg)) { sessions.delete(k); return m.reply('*📕 خلصنا القصة*'); }
  const theme = arg.slice(0, 80);
  let r = await ask(SYS, theme ? `ابدأ قصة عن: ${theme}` : 'ابدأ قصة جديدة من عندك');
  let st = { round: 1, log: '', static: false, time: Date.now() };
  if (!r.story || r.choices.length < 2) { r = { story: STATIC.s.t, choices: STATIC.s.c }; st.static = true; }
  st.log = r.story; st.choices = r.choices;
  sessions.set(k, st);
  return m.reply(render(r.story, r.choices));
};
handler.usage = ["قصة"];
handler.category = "games";
handler.command = ["قصة", "قصه", "قصة_تفاعلية"];
export default handler;

globalThis.erinStoryHook = async (m) => {
  try {
    const t = (m.text || m.body || '').trim();
    if (!/^[123]$/.test(t)) return false;
    const k = key(m);
    const st = sessions.get(k);
    if (!st) return false;
    if (Date.now() - st.time > TTL) { sessions.delete(k); return false; }
    const n = parseInt(t, 10);
    if (n > st.choices.length) return false;
    st.time = Date.now();
    const chosen = st.choices[n - 1];
    st.log += `\nاختار اللاعب: ${chosen}`;
    if (st.round >= MAX_ROUNDS) {
      sessions.delete(k);
      let end = '';
      if (!st.static) end = (await ask(SYS_END, st.log)).story;
      if (!end) end = STATIC.e[n - 1];
      await m.reply(`*📖 النهاية*\n\n${end}\n\n_عايز قصة تانية؟ اكتب .قصة_`);
      return true;
    }
    st.round++;
    let r;
    if (st.static) r = { story: STATIC.s.n[n - 1], choices: ["أكمل المغامرة", "أتصرف بذكاء", "أسيب كل حاجة وأمشي"] };
    else { r = await ask(SYS, `القصة لحد دلوقتي:\n${st.log}\n\nكمل القصة بفقرة جديدة بناءً على اختيار اللاعب مع 3 اختيارات جديدة.`); if (!r.story || r.choices.length < 2) r = { story: STATIC.s.n[n - 1], choices: ["أكمل المغامرة", "أتصرف بذكاء", "أسيب كل حاجة وأمشي"] }; }
    st.log += `\n${r.story}`; st.choices = r.choices;
    await m.reply(render(r.story, r.choices));
    return true;
  } catch (e) { console.error('[ERIN-ERR] storyHook', e?.message); return false; }
};
