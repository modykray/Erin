import { Scrapy } from "meowsab";

const VOICE_ID = process.env.FISH_VOICE_ID || "5286c238bf64488199f6cef8dde768d1";
const COOLDOWN_MS = 30000;
const DAILY_CAP = 150;
const last = new Map();
let day = new Date().toDateString();
let used = 0;

const SYSTEM = "You are Darwin Watterson from The Amazing World of Gumball: a sweet, naive, cheerful goldfish with legs who loves Gumball. Reply in the same language as the user (Egyptian Arabic if they write Arabic). Answer in 1-2 short spoken sentences, max 220 characters, no emojis, no hashtags, no stage directions.";

async function writeReply(text, name) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 120, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: text }] }),
        signal: AbortSignal.timeout(30000)
      });
      const d = await r.json();
      const out = d?.choices?.[0]?.message?.content?.trim();
      if (out) return out;
      console.log("[DARWIN] openai failed:", d?.error?.code || r.status);
    } catch (e) { console.log("[DARWIN] openai error:", e?.message); }
  }
  const { data } = await Scrapy.ZeroAI(text, `${SYSTEM}\nرد على رسالة ${name || "صاحبي"}:\n${text}`);
  return String(data?.answer || "").trim();
}

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("*🐟 اكتب كلامك بعد الأمر، مثلا: .داروين كيف حالك*");
  const now = Date.now();
  const d = new Date().toDateString();
  if (d !== day) { day = d; used = 0; }
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  if (used >= DAILY_CAP) return m.reply("*😴 داروين تعب النهاردة، جرب بكرة*");
  if (!process.env.FISH_API_KEY) return m.reply("*❌ الصوت مش متظبط*");
  last.set(m.sender, now);
  used++;
  try {
    let reply = (await writeReply(text.slice(0, 300), m.name)).slice(0, 300);
    if (!reply) throw new Error("no reply text");
    const r = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}`, "Content-Type": "application/json", model: process.env.FISH_MODEL || "s2.1-pro-free" },
      body: JSON.stringify({ text: reply, reference_id: VOICE_ID, format: "opus" }),
      signal: AbortSignal.timeout(60000)
    });
    if (!r.ok) throw new Error("fish " + r.status);
    const audio = Buffer.from(await r.arrayBuffer());
    await conn.sendMessage(m.chat, { audio, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: m });
  } catch (e) {
    console.log("[DARWIN] error:", e?.message);
    last.delete(m.sender);
    await m.reply("*🐟 داروين مش قادر يتكلم دلوقتي، جرب كمان شوية*");
  }
};
handler.usage = ["داروين"];
handler.category = "ai";
handler.command = ["داروين", "darwin"];
export default handler;
