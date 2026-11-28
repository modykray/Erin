import fs from 'fs';

/* اختبر ذكاءك: static bank of Egyptian-Arabic riddles and logic questions with points */
const DATA_DIR = process.env.SESSION_PATH ? process.env.SESSION_PATH.replace(/\/[^/]*$/, '') : '.';
const FILE = DATA_DIR + '/erin_quiz.json';
let scores = {};
try { scores = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
const save = () => { try { fs.writeFileSync(FILE, JSON.stringify(scores)); } catch (e) { console.error('[ERIN-ERR] quiz save', e?.message); } };

const CUPS_FILE = DATA_DIR + '/erin_quiz_cups.json';
let cups = {};
try { cups = JSON.parse(fs.readFileSync(CUPS_FILE, 'utf8')); } catch {}
const saveCups = () => { try { fs.writeFileSync(CUPS_FILE, JSON.stringify(cups)); } catch (e) { console.error('[ERIN-ERR] quiz cups save', e?.message); } };
const WIN_PTS = 200;
const ordinal = (i) => ['🥇 المركز الأول', '🥈 المركز التاني', '🥉 المركز التالت'][i] || `🎖️ المركز ${i + 1}`;

const norm = (x) => (x || '').normalize('NFKC')
  .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
  .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660))
  .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  .split(' ').filter(Boolean).map(t => (t.length > 3 && t.startsWith('ال') ? t.slice(2) : t)).join(' ');

const lev = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

const BANK = [
  ['إيه الحاجة اللي كل ما تاخد منها بتكبر؟', ['الحفرة', 'حفرة']],
  ['بتمشي من غير رجلين وبتعيط من غير عينين، إيه هي؟', ['السحابة', 'سحاب', 'غيم', 'الغيمة', 'الغيوم']],
  ['ليها أسنان ومبتعضش، إيه هي؟', ['المشط', 'مشط']],
  ['بيتكلم كل اللغات ومحدش علمه، إيه هو؟', ['الصدى', 'صدى']],
  ['بتنشّف الناس وهي اللي دايماً مبلولة، إيه هي؟', ['المنشفة', 'الفوطة', 'فوطة', 'منشفة']],
  ['بيطلع وبينزل من غير ما يتحرك من مكانه، إيه هو؟', ['السلم', 'سلم']],
  ['ليها عين واحدة ومبتشوفش بيها، إيه هي؟', ['الإبرة', 'ابره', 'إبرة']],
  ['ليها رقبة ومعندهاش راس، إيه هي؟', ['الزجاجة', 'القزازة', 'الازازة', 'زجاجة', 'قزازة', 'ازازة']],
  ['كل ما يزيد بينقص، إيه هو؟', ['العمر', 'عمر']],
  ['لو نطقت اسمها اتكسرت، إيه هي؟', ['الصمت', 'صمت', 'السكوت', 'سكوت']],
  ['إيه اللي في نص مصر؟', ['ص', 'حرف الصاد', 'الصاد']],
  ['بيكتب ومبيقراش، إيه هو؟', ['القلم', 'قلم']],
  ['بيت ملوش باب ولا شباك، جواه أصفر وأبيض، إيه هو؟', ['البيضة', 'بيضة', 'بيضه']],
  ['دكتور جراح شاف مريض وقال: ده ابني! والمريض مش ابن الأب بتاعه. الدكتور ده يبقى مين للمريض؟', ['امه', 'أمه', 'الام', 'ام', 'أمّه', 'والدته', 'مامته', 'ماما']],
  ['عندك 3 تفاحات واخدت منهم 2. معاك كام تفاحة؟', ['2', 'اتنين', 'تفاحتين']],
  ['كام شهر في السنة فيهم 28 يوم؟', ['12', 'كلهم', 'اتناشر', 'اثنا عشر']],
  ['الساعة 12 بالليل والدنيا بتمطر. هل بعد 72 ساعة هتبقى شمس؟', ['لا', 'لأ', 'لاء', 'هتبقي ليل', 'هتبقى ليل', 'بالليل']],
  ['رقم لو قلبته بيزيد 3، إيه هو؟', ['6', 'ستة']],
  ['راجل عنده 17 خروف، كلهم ماتوا إلا 9. فاضل كام؟', ['9', 'تسعة', 'تسعه']],
  ['لو عديت اللي في المركز التاني في سباق، بقيت في المركز الكام؟', ['التاني', 'تاني', 'الثاني', 'ثاني', '2', 'المركز التاني']],
  ['لو 5 قطط بتصطاد 5 فيران في 5 دقايق، 100 قطة بتصطاد 100 فار في كام دقيقة؟', ['5', 'خمسة', 'خمس', 'خمس دقايق']],
  ['راجل اشترى حمار بـ 100 جنيه وباعه بـ 120، وبعدين اشتراه تاني بـ 130 وباعه بـ 150. كسب كام؟', ['40', 'اربعين', 'أربعين']],
  ['الساعة 3 بالظبط. الزاوية بين عقرب الساعة والدقايق كام درجة؟', ['90', 'تسعين']],
  ['كام يوم في أسبوعين؟', ['14', 'اربعتاشر', 'أربعة عشر']],
  ['ورد النيل بيتضاعف كل يوم. لو غطى البحيرة كلها في 48 يوم، بيغطي نصها في كام يوم؟', ['47', 'سبعة واربعين']],
  ['لو قصيت حبل مرتين، بيطلع كام حتة؟', ['3', 'تلاتة', 'تلات', 'ثلاثة', 'ثلاث']],
  ['بياكل ومبيشربش، إيه هو؟', ['النار', 'نار']],
  ['بيشرب ومبيشبعش، إيه هو؟', ['الإسفنجة', 'اسفنجة', 'اسفنج', 'الأرض', 'ارض', 'الارض', 'ليفة']],
  ['بيمشي وراك في الشمس ومبيتكلمش، إيه هو؟', ['الظل', 'ظل', 'ضل', 'الضل']],
  ['ليها ضهر ومبتمشيش، وكل الناس بتسند عليها، إيه هي؟', ['الكرسي', 'كرسي']],
  ['حاجة هي ملكك بس الناس بتستخدمها أكتر منك، إيه هي؟', ['اسمك', 'الاسم', 'اسم']],
  ['كل ما عاشت بتقصر، إيه هي؟', ['الشمعة', 'شمعة', 'شمعه']],
  ['ليها وش ومبتتكلمش، وليها عقارب ومبتلدغش، إيه هي؟', ['الساعة', 'ساعة', 'ساعه']],
  ['بيقع من السما ومبيتوجعش، إيه هو؟', ['المطر', 'مطر', 'الشتا', 'شتا', 'الندى', 'ندى']],
  ['ليه مفاتيح ومفيش قفل، إيه هو؟', ['البيانو', 'بيانو', 'الاورج', 'اورج', 'الأورج', 'كيبورد', 'الكيبورد', 'لوحة المفاتيح']],
  ['بيدخل المية ومبيتبلش، إيه هو؟', ['الضوء', 'ضوء', 'النور', 'نور', 'الشمس', 'شمس']],
  ['أب عنده 4 بنات، وكل بنت ليها أخ واحد. كام ابن وبنت للأب؟', ['5', 'خمسة', 'خمس']],
  ['جد وأب وابن راحوا يصطادوا، وكل واحد صاد سمكة. كام سمكة صادوا؟', ['3', 'تلاتة', 'تلات', 'ثلاثة', 'ثلاث']],
  ['نجار عنده خشبة 10 متر عايز يقطعها حتت 2 متر. كام قصة محتاج؟', ['4', 'اربعة', 'أربعة', 'اربع']],
  ['ساعة بتدق 6 دقات في 5 ثواني. هتدق 12 دقة في كام ثانية؟', ['11', 'احداشر', 'إحدى عشر']],
  ['كمل السلسلة: 2، 4، 8، 16، ؟', ['32', 'اتنين وتلاتين']],
  ['كمل السلسلة: 1، 1، 2، 3، 5، 8، ؟', ['13', 'تلتاشر']],
  ['كمل السلسلة: 1، 4، 9، 16، ؟', ['25', 'خمسة وعشرين']],
  ['كمل الحروف: أ، ب، ج، د، ؟', ['ه', 'هـ', 'هاء']],
  ['لو النهارده السبت، بعد 10 أيام يبقى يوم إيه؟', ['الثلاثاء', 'ثلاثاء', 'التلات', 'تلات', 'يوم التلات']],
  ['الأب عمره 40 والابن 10. بعد كام سنة يبقى عمر الأب ضعف عمر الابن؟', ['20', 'عشرين']],
  ['لو كتبتها غلط بتبقى صح، إيه هي الكلمة؟', ['غلط', 'كلمة غلط']],
  ['نص تفاحة شبه إيه؟', ['النص التاني', 'التاني', 'نص تاني', 'النص الثاني', 'تفاحة']],
  ['3 كلاب و2 قطط. كام رجل ليهم كلهم؟', ['20', 'عشرين']],
  ['اتنين اتولدوا في نفس اليوم من نفس الأم ونفس الأب، ومع ذلك مش توأم. إزاي؟', ['3', 'تلاتة', 'تلات', 'توائم', 'تلات توائم', 'ثلاثة', 'توأم', 'ثلاثي']],
  ['كام مرة تقدر تطرح 5 من 25؟', ['مرة واحدة', 'مرة', 'واحدة', '1', 'واحد']],
  ['رقم لو ضربته في أي رقم بيطلع نفسه، إيه هو؟', ['1', 'واحد']],
  ['رقم لو ضربته في أي رقم بيطلع صفر، إيه هو؟', ['0', 'صفر']],
  ['بتطلع بالنهار وبتختفي بالليل، ودايماً بتسخن الدنيا، إيه هي؟', ['الشمس', 'شمس']],
].map(([q, a]) => ({ q, a, n: a.map(norm) }));

const INTROS = ['🧠 *اختبر ذكاءك يا بطل*', '🤔 *سؤال للعباقرة بس*', '🎯 *شغل مخك يا فنان*', '🧩 *لغز على الماشي*'];
const TIMEOUT_MS = 60000, MAX_WRONG = 5, HINT_AFTER = 2, BASE_PTS = 10, HINT_PTS = 5;
if (!global.iqActive) global.iqActive = {};
const used = new Map();
const numOf = (j) => (j || '').split(':')[0].split('@')[0];

const isRight = (text, g) => {
  const n = norm(text);
  if (!n) return false;
  const padded = ' ' + n + ' ';
  return g.n.some(a => a && (n === a || padded.includes(' ' + a + ' ') || (n.length >= 5 && !n.includes(' ') && a.length >= 5 && lev(n, a) <= 1)));
};

const pick = (chat) => {
  let u = used.get(chat) || new Set();
  if (u.size >= BANK.length) u = new Set();
  let i; do { i = Math.floor(Math.random() * BANK.length); } while (u.has(i));
  u.add(i); used.set(chat, u);
  return BANK[i];
};

const cupsText = (chat, jid) => {
  const c = cups[chat]?.[jid] || { p1: 0, p2: 0, p3: 0, low: 0 };
  const pts = scores[chat]?.[jid] || 0;
  return `🏆 *بطولات @${numOf(jid)}*\n🥇 المركز الأول: *${c.p1}*\n🥈 المركز التاني: *${c.p2}*\n🥉 المركز التالت: *${c.p3}*\n🎖️ مراكز بعدهم: *${c.low}*\n\n🧮 نقطك في الجولة الحالية: *${pts}/${WIN_PTS}*`;
};

// round ends when someone reaches WIN_PTS: rank everyone with points, record cups, reset the round
const finishRound = (chat) => {
  const sc = scores[chat] || {};
  const ranked = Object.entries(sc).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]);
  cups[chat] = cups[chat] || {};
  ranked.forEach(([j], i) => {
    const c = cups[chat][j] = cups[chat][j] || { p1: 0, p2: 0, p3: 0, low: 0 };
    if (i === 0) c.p1++; else if (i === 1) c.p2++; else if (i === 2) c.p3++; else c.low++;
  });
  scores[chat] = {};
  save(); saveCups();
  return ranked;
};

const board = async (m, conn) => {
  const sc = scores[m.chat] || {};
  const top = Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!top.length) return m.reply('*🏆 لسه محدش كسب نقط. اكتب .اختبر ذكاءك وكون أول واحد*');
  const medals = ['🥇', '🥈', '🥉'];
  const txt = '🏆 *ترتيب العباقرة*\n\n' + top.map(([j, p], i) => `${medals[i] || (i + 1) + '.'} @${numOf(j)} ~ *${p}/${WIN_PTS}* نقطة`).join('\n');
  await conn.sendMessage(m.chat, { text: txt, mentions: top.map(t => t[0]) }, { quoted: m });
};

const handler = async (m, { conn, text }) => {
  const t = norm(text || '');
  if (/^(ترتيب|المتصدرين|لوحه الشرف|الصدارة)/.test(t)) return board(m, conn);
  if (/^(بطوله|بطولتي|بطولات|كاسات|كاس)/.test(t)) {
    return conn.sendMessage(m.chat, { text: cupsText(m.chat, m.sender), mentions: [m.sender] }, { quoted: m });
  }
  if (/^(نقاطي|نقطي|رصيدي)/.test(t)) {
    const p = scores[m.chat]?.[m.sender] || 0;
    return conn.sendMessage(m.chat, { text: `🧮 @${numOf(m.sender)} معاك *${p}* نقطة في الجروب ده`, mentions: [m.sender] }, { quoted: m });
  }
  const cur = global.iqActive[m.chat];
  if (cur) {
    return m.reply('*⏳ فيه سؤال لسه مستني إجابة، رد على رسالة السؤال*');
  }
  const g = pick(m.chat);
  const msg = await conn.sendMessage(m.chat, { text: `${INTROS[Math.floor(Math.random() * INTROS.length)]}\n\n${g.q}\n\n⏱️ معاك دقيقة. رد على رسالة السؤال بإجابتك\n💰 الإجابة الصح بـ ${BASE_PTS} نقط` }, { quoted: m });
  global.iqActive[m.chat] = {
    g, msgId: msg.key.id, wrong: 0, hint: false,
    timeout: setTimeout(() => {
      if (global.iqActive[m.chat]?.msgId === msg.key.id) {
        delete global.iqActive[m.chat];
        conn.sendMessage(m.chat, { text: `⏰ *الوقت خلص* والإجابة كانت: *${g.a[0]}*\nمحدش عرف؟ ده لا مؤاخذة مستوى 😂` }, { quoted: msg });
      }
    }, TIMEOUT_MS),
  };
};

handler.before = async (m, { conn }) => {
  try {
    if (!m.quoted || !m.text || m.key?.fromMe) return;
    const game = global.iqActive?.[m.chat];
    if (!game || m.quoted.id !== game.msgId) return;
    if (isRight(m.text, game.g)) {
      clearTimeout(game.timeout); delete global.iqActive[m.chat];
      const pts = game.hint ? HINT_PTS : BASE_PTS;
      scores[m.chat] = scores[m.chat] || {};
      scores[m.chat][m.sender] = (scores[m.chat][m.sender] || 0) + pts; save();
      if (scores[m.chat][m.sender] >= WIN_PTS) {
        const ranked = finishRound(m.chat);
        const txt = `🎉🏆 *انتهت البطولة!* @${numOf(m.sender)} وصل ${WIN_PTS} نقطة وبقى *البطل* 🥇\n\n` + ranked.map(([j, p], i) => `${ordinal(i)}: @${numOf(j)} (${p} نقطة)`).join('\n') + `\n\nكل واحد خد كاس على مركزه، واكتب *.بطولة* تشوف كاساتك. النقط اتصفرت وجولة جديدة بدأت 🔥`;
        await conn.sendMessage(m.chat, { text: txt, mentions: ranked.map(r => r[0]) }, { quoted: m });
        return true;
      }
      await conn.sendMessage(m.chat, { text: `✅ *إجابة صح!* @${numOf(m.sender)} عبقري زمانك 🧠\n+${pts} نقط، رصيدك *${scores[m.chat][m.sender]}*\n\n> اكتب *.اختبر ذكاءك* لسؤال تاني أو *.اختبر ترتيب* للمتصدرين`, mentions: [m.sender] }, { quoted: m });
      return true;
    }
    game.wrong++;
    if (game.wrong >= MAX_WRONG) {
      clearTimeout(game.timeout); delete global.iqActive[m.chat];
      await m.reply(`*🙈 5 محاولات غلط! الإجابة كانت: ${game.g.a[0]}*\nمحدش خد النقط المرة دي`);
      return true;
    }
    if (game.wrong >= HINT_AFTER && !game.hint) {
      game.hint = true;
      const a = game.g.a[0].replace(/^ال/, '');
      await m.reply(`*❌ غلط. تلميحة:* الإجابة بتبدأ بحرف "${a[0]}" وطولها ${a.replace(/\s/g, '').length} حروف (النقط بقت ${HINT_PTS})`);
    } else {
      await m.reply(`*❌ غلط يا فنان، جرب تاني* (${MAX_WRONG - game.wrong} محاولات فاضلة)`);
    }
    return true;
  } catch (e) { console.error('[ERIN-ERR] iq', e?.message); }
};

handler.usage = ['اختبر ذكاءك'];
handler.category = 'games';
handler.command = ['اختبر', 'اختبار', 'اختبر_ذكاءك', 'ذكاءك', 'ذكائك'];
export default handler;
