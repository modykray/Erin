import { DARWIN_SYSTEM, writeText, speak, takeVoiceSlot, refundVoiceSlot } from "../../lib/darwin.js";

const COOLDOWN_MS = 30000;
const last = new Map();

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("*🐟 اكتب كلامك بعد الأمر، مثلا: .داروين كيف حالك*");
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  if (!process.env.FISH_API_KEY) return m.reply("*❌ الصوت مش متظبط*");
  if (!takeVoiceSlot()) return m.reply("*😴 داروين تعب النهاردة، جرب بكرة*");
  last.set(m.sender, now);
  try {
    const reply = (await writeText(DARWIN_SYSTEM, text.slice(0, 300), m.name)).slice(0, 300);
    if (!reply) throw new Error("no reply text");
    const audio = await speak(reply);
    await conn.sendMessage(m.chat, { audio, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: m });
  } catch (e) {
    console.log("[DARWIN] error:", e?.message);
    last.delete(m.sender);
    refundVoiceSlot();
    await m.reply("*🐟 داروين مش قادر يتكلم دلوقتي، جرب كمان شوية*");
  }
};
handler.usage = ["داروين"];
handler.category = "ai";
handler.command = ["داروين", "darwin"];
export default handler;
