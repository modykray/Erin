import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(SETTINGS); };
handler.usage = ['اعدادات'];
handler.category = 'pubg';
handler.command = ['اعدادات','ببجي_اعدادات','اعدادات_ببجي'];
export default handler;
