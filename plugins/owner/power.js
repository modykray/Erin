const handler = async (m) => {
  // handled by the global power hook in index.js (owner only); this entry lists the commands
  return m.reply('*✅ تمام*');
};
handler.usage = ["بور_اوف", "بور_اون"];
handler.category = "owner";
handler.command = ["بور_اوف", "بور_اون"];
handler.owner = true;
export default handler;
