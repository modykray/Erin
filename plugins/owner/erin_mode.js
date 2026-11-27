const handler = async (m) => {
  // handled by the global hook in index.js (owner only, toggles admin-only mode)
  return m.reply('*✅ تمام*');
};
handler.usage = ["ايرن"];
handler.category = "owner";
handler.command = ["ايرن", "إيرن", "ايرين", "إيرين"];
handler.owner = true;
export default handler;
