import { pick, SETTINGS, SENS, TOPUP, TIPS, WEAPONS, SCOPES, SPOTS, CALLS } from '../../lib/pubg.js';
const handler = async (m) => { m.reply(`*🪂 هتنزل في:*\n${pick(SPOTS)}\n\n> متقولش إني ورطتك 🐦`); };
handler.usage = ['هبوط'];
handler.category = 'pubg';
handler.command = ['هبوط','انزل_فين','انزل'];
export default handler;
