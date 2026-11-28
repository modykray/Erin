import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(TOPUP); };
handler.usage = ['شحن'];
handler.category = 'pubg';
handler.command = ['شحن','شحن_ببجي','ببجي_شحن','UC'];
export default handler;
