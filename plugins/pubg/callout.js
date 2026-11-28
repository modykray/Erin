import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(`*📣 كول السكواد:*\n${pick(CALLS)}`); };
handler.usage = ['كول'];
handler.category = 'pubg';
handler.command = ['كول','كولاوت'];
export default handler;
