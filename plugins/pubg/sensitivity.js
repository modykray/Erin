import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(SENS); };
handler.usage = ['حساسية'];
handler.category = 'pubg';
handler.command = ['حساسية','حساسيه','ببجي_حساسية'];
export default handler;
