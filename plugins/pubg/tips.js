import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(pick(TIPS)); };
handler.usage = ['نصايح'];
handler.category = 'pubg';
handler.command = ['نصايح','نصائح','نصايح_ببجي'];
export default handler;
