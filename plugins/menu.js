const MENU_TIMEOUT = 120000;

const CATEGORIES = [
    [1, 'التـحـمـيـل', 'downloads', '📂'],
    [2, 'الـمـجـمـوعـات', 'group', '🐞'],
    [3, 'الـمـلـصـقـات', 'sticker', '🌄'],
    [4, 'الـمـطـوريـن', 'owner', '🇩🇪'],
    [5, 'امـثـلـه', 'example', '✳️'],
    [6, 'الـادوات', 'tools', '🚀'],
    [7, 'الـبـحـث', 'search', '🌐'],
    [8, 'الادمــن', 'admin', '👨🏻‍⚖️'],
    [9, 'الالــعـاب', 'games', '🎮'],
    [10, 'الچيف', 'gif', '✴️'],
    [11, 'الـبــنـك', 'bank', '💰'],
    [12, 'الـذكـاء الاصـطـنـاعـي', 'ai', '🤖'],
    [13, 'الـبـوتـات الـفـرعـي', 'sub', '♥️'],
    [14, 'مـعـلومـات الـبـوت', 'info', '🗃️'],
    [15, 'الـالــقــاب', 'nicknames', '🫯'],
    [16, 'الـلـوجـوهــات', 'logos', '🎡'],
    [17, 'تـغـيـر الاصـوات', 'voices', '📢'],
    [18, 'أخــرى', 'other', '🌹'],
    [19, 'ببجي', 'pubg', '🔫']
];

const getCat = n => CATEGORIES.find(c => c[0] === n);

if (!global.menus) global.menus = {};

const clean = () => {
    const now = Date.now();
    Object.keys(global.menus).forEach(k => {
        if (now - global.menus[k].time > MENU_TIMEOUT) delete global.menus[k];
    });
};

const getImg = (bot) => {
    const { images } = bot.config.info;
    return Array.isArray(images) ? images[Math.floor(Math.random() * images.length)] : images;
};

import fs from 'fs';
let THUMB = null;
try { THUMB = fs.readFileSync(new URL('../assets/menu_full.jpg', import.meta.url)); } catch (e) { console.error('[ERIN-MENU] thumb load failed:', e?.message); }

const context = () => ({
    externalAdReply: {
        title: "إيرن ييغر 🎪 | Erin Bot",
        body: "بوت واتساب سريع وسهل التعديل",
        ...(THUMB ? { thumbnail: THUMB } : {}),
        sourceUrl: 'https://whatsapp.com/channel/0029Vb8xDV8A2pLCoK6KtH36',
        mediaType: 1,
        renderLargerThumbnail: false
    }
});

const menu = async (m, { conn, bot }) => {
    clean();
    
    const cmds = await bot.getAllCommands();
    const cats = {};
    
    cmds.forEach(c => {
        if (!c.usage?.length) return;
        const cat = c.category || 'other';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(c);
    });

    const txt = `
رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ
وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ
╭─┈─┈─┈─⟞🎪⟝─┈─┈─┈─╮
${CATEGORIES.map(c => `┃ ⌯︙${c[0]} ~ *قـسـم ${c[1]} ${c[3]}*`).join('\n')}
╰─┈─┈─┈─⟞🎪⟝─┈─┈─┈─╯
> *رد عـلـي الـرسـالـه بـ رقـم الـقـسـم فـقـط بـدون نـقـطـه*`;

    const msg = await sendBoth(conn, m.chat, txt, 'menu');
    console.log('[ERIN-MENU] sent', msg?.key?.id);
  
    global.menus[msg.key.id] = { cats, chatId: m.chat, time: Date.now() };
};

const sendBoth = async (conn, chat, text, tag) => {
    let r;
    if (THUMB && text.length < 1800) {
        try { r = await conn.sendMessage(chat, { image: THUMB, caption: text }, { quoted: global.reply_status }); console.log('[ERIN-SEC] image', tag, chat, r?.key?.id); return r; }
        catch (e) { console.error('[ERIN-ERR] image', tag, e?.message); }
    }
    try { r = await conn.sendMessage(chat, { text }, { quoted: global.reply_status }); console.log('[ERIN-SEC] plain', tag, chat, r?.key?.id); }
    catch (e) { console.error('[ERIN-ERR] plain', tag, e?.message); try { r = await conn.sendMessage(chat, { text }); } catch (e2) { console.error('[ERIN-ERR] plain2', tag, e2?.message); } }
    return r;
};

menu.before = async (m, { conn, bot }) => {
    clean();
    
    const menuData = global.menus[m.quoted?.id];
    if (!menuData) return false;
    const target = menuData.chatId || m.chat;
    console.log('[ERIN-SEC] pick', JSON.stringify({ text: m.text, mChat: m.chat, mSender: m.sender, menuChat: menuData.chatId, quoted: m.quoted?.id, target }));
    
    const cat = getCat(parseInt(m.text));
    if (!cat) {
        await sendBoth(conn, target, '*❌≥ اختار رقم من القائمة بس*', 'badnum');
        return true;
    }
    
    const cmds = menuData.cats[cat[2]];
    if (!cmds?.length) {
        await sendBoth(conn, target, '*❌≥ القسم فاضي*', 'empty');
        return true;
    }
    
    const cmdsList = cmds.map(c => `┃${cat[3]} /${c.usage.join(`\n┃${cat[3]} /`)}`).join('\n');
    
    await sendBoth(conn, target, `
╭─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╮
┃ *⌯︙ قـسـم ${cat[1]} ${cat[3]}*
╰─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╯

${cmdsList}

╭─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╮
┃ *⌯︙Erin ~ ${bot.config.info.nameBot}*
╰─┈─┈─┈─⟞${cat[3]}⟝─┈─┈─┈─╯
> *رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا*`.trim(), 'section');
    
    return true;
};

menu.command = ['الاوامر', 'القائمة', 'menu', 'اوامر'];
export default menu;