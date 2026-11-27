import { writeText, speak, takeVoiceSlot, refundVoiceSlot } from "../../lib/darwin.js";

const MAYA_VOICE = process.env.FISH_MAYA_VOICE_ID || "0037772530374fb6b1f09216c63e12d4";
const SYSTEM = "You are Maya, a friendly, warm, witty young Egyptian woman chatting with a friend. Always reply in Egyptian Arabic (written in Arabic letters), whatever language the user writes. Answer in 1-2 short spoken sentences, max 220 characters, no emojis, no hashtags, no stage directions.";
const COOLDOWN_MS = 30000;
const last = new Map();

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("*🎙️ اكتب كلامك بعد الأمر، مثلا: .مايا ازيك*");
  const now = Date.now();
  const prev = last.get(m.sender) || 0;
  if (now - prev < COOLDOWN_MS) return m.reply(`*⏳ استنى ${Math.ceil((COOLDOWN_MS - (now - prev)) / 1000)} ثانية*`);
  if (!process.env.FISH_API_KEY) return m.reply("*❌ الصوت مش متظبط*");
  if (!takeVoiceSlot()) return m.reply("*😴 مايا تعبت النهاردة، جرب بكرة*");
  last.set(m.sender, now);
  try {
    const reply = (await writeText(SYSTEM, text.slice(0, 300), m.name)).slice(0, 300);
    if (!reply) throw new Error("no reply text");
    const audio = await speak(reply, MAYA_VOICE);
    await conn.sendMessage(m.chat, { audio, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: m });
  } catch (e) {
    console.log("[MAYA] error:", e?.message);
    last.delete(m.sender);
    refundVoiceSlot();
    await m.reply("*🎙️ مايا مش قادرة تتكلم دلوقتي، جرب كمان شوية*");
  }
};
handler.usage = ["مايا"];
handler.category = "ai";
handler.command = ["مايا", "maya"];
export default handler;
