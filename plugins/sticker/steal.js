import { createSticker } from "../../system/utils.js";

const COOLDOWN_MS = 4000;
const last = new Map();

const handler = async (m, { conn, bot }) => {
  const q = m.quoted;
  if (!q) return m.reply("*🥷 رد على ملصق واكتب سرقة*");
  const mime = q.mimetype || q.msg?.mimetype || "";
  if (!/webp/i.test(mime) && !/sticker/i.test(q.mtype || q.type || "")) return m.reply("*🥷 ده مش ملصق، رد على ملصق*");
  const now = Date.now();
  if (now - (last.get(m.sender) || 0) < COOLDOWN_MS) return;
  last.set(m.sender, now);
  try {
    const { pack, author } = bot.config.info.copyright;
    const buffer = await createSticker(await q.download(), { mime: "image/jpg", pack, author });
    await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
  } catch (e) {
    console.error("[ERIN-ERR] steal", e?.message);
    await m.reply("*😅 معرفتش أسرق الملصق ده، جرب ملصق تاني*");
  }
};
handler.usage = ["سرقة"];
handler.category = "sticker";
handler.command = ["سرقة", "سرقه"];
export default handler;
