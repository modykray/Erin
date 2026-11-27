import { Scrapy } from "meowsab";

export const VOICE_ID = () => process.env.FISH_VOICE_ID || "81dc84b98d694875a5391242f29635bf";
const DAILY_CAP = 150;
const st = (globalThis.__darwinState ||= { day: new Date().toDateString(), used: 0 });

export function takeVoiceSlot() {
  const d = new Date().toDateString();
  if (d !== st.day) { st.day = d; st.used = 0; }
  if (st.used >= DAILY_CAP) return false;
  st.used++;
  return true;
}
export function refundVoiceSlot() { if (st.used > 0) st.used--; }

export const DARWIN_SYSTEM = "You are Darwin Watterson from The Amazing World of Gumball: a sweet, naive, cheerful goldfish with legs who loves Gumball. Always reply in Egyptian Arabic (written in Arabic letters), whatever language the user writes. Answer in 1-2 short spoken sentences, max 220 characters, no emojis, no hashtags, no stage directions.";

export async function writeText(system, userText, name) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 150, messages: [{ role: "system", content: system }, { role: "user", content: userText }] }),
        signal: AbortSignal.timeout(30000)
      });
      const d = await r.json();
      const out = d?.choices?.[0]?.message?.content?.trim();
      if (out) return out;
      console.log("[DARWIN] openai failed:", d?.error?.code || r.status);
    } catch (e) { console.log("[DARWIN] openai error:", e?.message); }
  }
  const { data } = await Scrapy.ZeroAI(userText, `${system}\n${name ? `اسم صاحبي: ${name}\n` : ""}الطلب:\n${userText}`);
  return String(data?.answer || "").trim();
}

export async function speak(text) {
  if (!process.env.FISH_API_KEY) throw new Error("no fish key");
  const r = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}`, "Content-Type": "application/json", model: process.env.FISH_MODEL || "s2.1-pro-free" },
    body: JSON.stringify({ text, reference_id: VOICE_ID(), format: "opus" }),
    signal: AbortSignal.timeout(60000)
  });
  if (!r.ok) throw new Error("fish " + r.status);
  return Buffer.from(await r.arrayBuffer());
}
