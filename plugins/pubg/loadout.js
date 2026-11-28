import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(`*🎲 تشكيلتك العشوائية*\n\n🔫 الأساسي: ${pick(pick([WEAPONS[0], WEAPONS[1]]))}\n🔫 التاني: ${pick(pick([WEAPONS[2], WEAPONS[3], WEAPONS[0]]))}\n🔭 السكوب: ${pick(SCOPES)}\n\n> لو خسرت يبقى السلاح غلطان مش إنت 😂`); };
handler.usage = ['تشكيلة'];
handler.category = 'pubg';
handler.command = ['تشكيلة','تشكيله','لودوت'];
export default handler;
