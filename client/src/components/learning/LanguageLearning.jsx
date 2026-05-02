import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, Volume2, ChevronDown, ChevronUp, Languages } from 'lucide-react';

// =====================================================================
// LANGUAGE DATA — Alphabets, Phrases, Numbers, Food, Travel, Work
// =====================================================================
const LANGUAGES = {
  french: { name: 'French', flag: '🇫🇷', code: 'fr-FR' },
  german: { name: 'German', flag: '🇩🇪', code: 'de-DE' },
  japanese: { name: 'Japanese', flag: '🇯🇵', code: 'ja-JP' },
  chinese: { name: 'Chinese', flag: '🇨🇳', code: 'zh-CN' },
};

const ALPHABET_MAP = [
  { en: 'A', french: 'A (ah)', german: 'A (ah)', japanese: 'あ (a)', chinese: '啊 (ā)' },
  { en: 'B', french: 'B (bé)', german: 'B (beh)', japanese: 'ば (ba)', chinese: '八 (bā)' },
  { en: 'C', french: 'C (cé)', german: 'C (tseh)', japanese: 'か (ka)', chinese: '吃 (chī)' },
  { en: 'D', french: 'D (dé)', german: 'D (deh)', japanese: 'だ (da)', chinese: '大 (dà)' },
  { en: 'E', french: 'E (euh)', german: 'E (eh)', japanese: 'え (e)', chinese: '饿 (è)' },
  { en: 'F', french: 'F (effe)', german: 'F (eff)', japanese: 'ふ (fu)', chinese: '发 (fā)' },
  { en: 'G', french: 'G (gé)', german: 'G (geh)', japanese: 'が (ga)', chinese: '个 (gè)' },
  { en: 'H', french: 'H (ache)', german: 'H (ha)', japanese: 'は (ha)', chinese: '好 (hǎo)' },
  { en: 'I', french: 'I (ee)', german: 'I (ih)', japanese: 'い (i)', chinese: '一 (yī)' },
  { en: 'J', french: 'J (ji)', german: 'J (yot)', japanese: 'じ (ji)', chinese: '几 (jǐ)' },
  { en: 'K', french: 'K (ka)', german: 'K (ka)', japanese: 'き (ki)', chinese: '可 (kě)' },
  { en: 'L', french: 'L (elle)', german: 'L (ell)', japanese: 'ら (ra)', chinese: '了 (le)' },
  { en: 'M', french: 'M (emme)', german: 'M (emm)', japanese: 'ま (ma)', chinese: '吗 (ma)' },
  { en: 'N', french: 'N (enne)', german: 'N (enn)', japanese: 'な (na)', chinese: '你 (nǐ)' },
  { en: 'O', french: 'O (oh)', german: 'O (oh)', japanese: 'お (o)', chinese: '哦 (ó)' },
  { en: 'P', french: 'P (pé)', german: 'P (peh)', japanese: 'ぱ (pa)', chinese: '皮 (pí)' },
  { en: 'Q', french: 'Q (ku)', german: 'Q (ku)', japanese: 'きゅ (kyu)', chinese: '七 (qī)' },
  { en: 'R', french: 'R (erre)', german: 'R (err)', japanese: 'り (ri)', chinese: '人 (rén)' },
  { en: 'S', french: 'S (esse)', german: 'S (ess)', japanese: 'さ (sa)', chinese: '三 (sān)' },
  { en: 'T', french: 'T (té)', german: 'T (teh)', japanese: 'た (ta)', chinese: '他 (tā)' },
  { en: 'U', french: 'U (u)', german: 'U (uh)', japanese: 'う (u)', chinese: '优 (yōu)' },
  { en: 'V', french: 'V (vé)', german: 'V (fau)', japanese: 'ぶ (bu)', chinese: '威 (wēi)' },
  { en: 'W', french: 'W (double vé)', german: 'W (veh)', japanese: 'わ (wa)', chinese: '我 (wǒ)' },
  { en: 'X', french: 'X (iks)', german: 'X (iks)', japanese: 'くす (kusu)', chinese: '小 (xiǎo)' },
  { en: 'Y', french: 'Y (i grec)', german: 'Y (üpsilon)', japanese: 'や (ya)', chinese: '也 (yě)' },
  { en: 'Z', french: 'Z (zède)', german: 'Z (tsett)', japanese: 'ざ (za)', chinese: '在 (zài)' },
];

// --- Category-organized phrase data ---
const CATEGORIES = [
  { key: 'greetings', label: '👋 Greetings', emoji: '👋' },
  { key: 'essentials', label: '⭐ Essentials', emoji: '⭐' },
  { key: 'numbers', label: '🔢 Numbers', emoji: '🔢' },
  { key: 'food', label: '🍽️ Food & Drink', emoji: '🍽️' },
  { key: 'travel', label: '✈️ Travel', emoji: '✈️' },
  { key: 'work', label: '💼 Work', emoji: '💼' },
  { key: 'emergency', label: '🚨 Emergency', emoji: '🚨' },
];

const PHRASES = {
  greetings: [
    { english: 'Hello', french: 'Bonjour', german: 'Hallo', japanese: 'こんにちは (Konnichiwa)', chinese: '你好 (Nǐ hǎo)' },
    { english: 'Good morning', french: 'Bonjour', german: 'Guten Morgen', japanese: 'おはよう (Ohayou)', chinese: '早上好 (Zǎoshang hǎo)' },
    { english: 'Good evening', french: 'Bonsoir', german: 'Guten Abend', japanese: 'こんばんは (Konbanwa)', chinese: '晚上好 (Wǎnshang hǎo)' },
    { english: 'Good night', french: 'Bonne nuit', german: 'Gute Nacht', japanese: 'おやすみなさい (Oyasuminasai)', chinese: '晚安 (Wǎn\'ān)' },
    { english: 'How are you?', french: 'Comment allez-vous?', german: 'Wie geht es Ihnen?', japanese: 'お元気ですか (Ogenki desu ka)', chinese: '你好吗 (Nǐ hǎo ma)' },
    { english: 'Goodbye', french: 'Au revoir', german: 'Auf Wiedersehen', japanese: 'さようなら (Sayounara)', chinese: '再见 (Zàijiàn)' },
    { english: 'See you later', french: 'À bientôt', german: 'Bis später', japanese: 'またね (Mata ne)', chinese: '回头见 (Huítóu jiàn)' },
  ],
  essentials: [
    { english: 'Thank you', french: 'Merci', german: 'Danke', japanese: 'ありがとう (Arigatou)', chinese: '谢谢 (Xièxie)' },
    { english: 'Thank you very much', french: 'Merci beaucoup', german: 'Vielen Dank', japanese: 'どうもありがとう (Dōmo arigatō)', chinese: '非常感谢 (Fēicháng gǎnxiè)' },
    { english: 'You\'re welcome', french: 'De rien', german: 'Bitte schön', japanese: 'どういたしまして (Dōitashimashite)', chinese: '不客气 (Bù kèqì)' },
    { english: 'Please', french: 'S\'il vous plaît', german: 'Bitte', japanese: 'お願いします (Onegaishimasu)', chinese: '请 (Qǐng)' },
    { english: 'Excuse me', french: 'Excusez-moi', german: 'Entschuldigung', japanese: 'すみません (Sumimasen)', chinese: '对不起 (Duìbùqǐ)' },
    { english: 'I\'m sorry', french: 'Je suis désolé', german: 'Es tut mir leid', japanese: 'ごめんなさい (Gomen nasai)', chinese: '抱歉 (Bàoqiàn)' },
    { english: 'Yes', french: 'Oui', german: 'Ja', japanese: 'はい (Hai)', chinese: '是 (Shì)' },
    { english: 'No', french: 'Non', german: 'Nein', japanese: 'いいえ (Iie)', chinese: '不是 (Bù shì)' },
    { english: 'My name is...', french: 'Je m\'appelle...', german: 'Ich heiße...', japanese: '私の名前は... (Watashi no namae wa...)', chinese: '我叫... (Wǒ jiào...)' },
    { english: 'I don\'t understand', french: 'Je ne comprends pas', german: 'Ich verstehe nicht', japanese: 'わかりません (Wakarimasen)', chinese: '我不明白 (Wǒ bù míngbái)' },
    { english: 'Can you repeat?', french: 'Pouvez-vous répéter?', german: 'Können Sie wiederholen?', japanese: 'もう一度お願いします (Mō ichido onegaishimasu)', chinese: '请再说一遍 (Qǐng zài shuō yī biàn)' },
  ],
  numbers: [
    { english: 'One (1)', french: 'Un', german: 'Eins', japanese: 'いち (Ichi)', chinese: '一 (Yī)' },
    { english: 'Two (2)', french: 'Deux', german: 'Zwei', japanese: 'に (Ni)', chinese: '二 (Èr)' },
    { english: 'Three (3)', french: 'Trois', german: 'Drei', japanese: 'さん (San)', chinese: '三 (Sān)' },
    { english: 'Four (4)', french: 'Quatre', german: 'Vier', japanese: 'よん (Yon)', chinese: '四 (Sì)' },
    { english: 'Five (5)', french: 'Cinq', german: 'Fünf', japanese: 'ご (Go)', chinese: '五 (Wǔ)' },
    { english: 'Six (6)', french: 'Six', german: 'Sechs', japanese: 'ろく (Roku)', chinese: '六 (Liù)' },
    { english: 'Seven (7)', french: 'Sept', german: 'Sieben', japanese: 'なな (Nana)', chinese: '七 (Qī)' },
    { english: 'Eight (8)', french: 'Huit', german: 'Acht', japanese: 'はち (Hachi)', chinese: '八 (Bā)' },
    { english: 'Nine (9)', french: 'Neuf', german: 'Neun', japanese: 'きゅう (Kyū)', chinese: '九 (Jiǔ)' },
    { english: 'Ten (10)', french: 'Dix', german: 'Zehn', japanese: 'じゅう (Jū)', chinese: '十 (Shí)' },
    { english: 'Hundred (100)', french: 'Cent', german: 'Hundert', japanese: 'ひゃく (Hyaku)', chinese: '百 (Bǎi)' },
    { english: 'Thousand (1000)', french: 'Mille', german: 'Tausend', japanese: 'せん (Sen)', chinese: '千 (Qiān)' },
  ],
  food: [
    { english: 'Water', french: 'Eau', german: 'Wasser', japanese: '水 (Mizu)', chinese: '水 (Shuǐ)' },
    { english: 'Coffee', french: 'Café', german: 'Kaffee', japanese: 'コーヒー (Kōhī)', chinese: '咖啡 (Kāfēi)' },
    { english: 'Tea', french: 'Thé', german: 'Tee', japanese: 'お茶 (Ocha)', chinese: '茶 (Chá)' },
    { english: 'Bread', french: 'Pain', german: 'Brot', japanese: 'パン (Pan)', chinese: '面包 (Miànbāo)' },
    { english: 'Rice', french: 'Riz', german: 'Reis', japanese: 'ごはん (Gohan)', chinese: '米饭 (Mǐfàn)' },
    { english: 'I am hungry', french: 'J\'ai faim', german: 'Ich habe Hunger', japanese: 'お腹が空きました (Onaka ga sukimashita)', chinese: '我饿了 (Wǒ è le)' },
    { english: 'It\'s delicious!', french: 'C\'est délicieux!', german: 'Es ist lecker!', japanese: '美味しい！(Oishii!)', chinese: '很好吃！(Hěn hǎo chī!)' },
    { english: 'The bill, please', french: 'L\'addition, s\'il vous plaît', german: 'Die Rechnung, bitte', japanese: 'お会計お願いします (Okaikei onegaishimasu)', chinese: '买单 (Mǎidān)' },
  ],
  travel: [
    { english: 'Where is...?', french: 'Où est...?', german: 'Wo ist...?', japanese: '...はどこですか (...wa doko desu ka)', chinese: '...在哪里？(...zài nǎlǐ?)' },
    { english: 'Train station', french: 'La gare', german: 'Der Bahnhof', japanese: '駅 (Eki)', chinese: '火车站 (Huǒchē zhàn)' },
    { english: 'Airport', french: 'L\'aéroport', german: 'Der Flughafen', japanese: '空港 (Kūkō)', chinese: '机场 (Jīchǎng)' },
    { english: 'Hotel', french: 'L\'hôtel', german: 'Das Hotel', japanese: 'ホテル (Hoteru)', chinese: '酒店 (Jiǔdiàn)' },
    { english: 'Bathroom', french: 'Les toilettes', german: 'Die Toilette', japanese: 'トイレ (Toire)', chinese: '洗手间 (Xǐshǒujiān)' },
    { english: 'Left', french: 'Gauche', german: 'Links', japanese: '左 (Hidari)', chinese: '左 (Zuǒ)' },
    { english: 'Right', french: 'Droite', german: 'Rechts', japanese: '右 (Migi)', chinese: '右 (Yòu)' },
    { english: 'How much does it cost?', french: 'Combien ça coûte?', german: 'Wie viel kostet das?', japanese: 'いくらですか (Ikura desu ka)', chinese: '多少钱？(Duōshǎo qián?)' },
    { english: 'Taxi', french: 'Taxi', german: 'Taxi', japanese: 'タクシー (Takushī)', chinese: '出租车 (Chūzū chē)' },
  ],
  work: [
    { english: 'I am a student', french: 'Je suis étudiant', german: 'Ich bin Student', japanese: '学生です (Gakusei desu)', chinese: '我是学生 (Wǒ shì xuéshēng)' },
    { english: 'I am a developer', french: 'Je suis développeur', german: 'Ich bin Entwickler', japanese: '開発者です (Kaihatsusha desu)', chinese: '我是开发者 (Wǒ shì kāifā zhě)' },
    { english: 'Nice to meet you', french: 'Enchanté', german: 'Freut mich', japanese: 'はじめまして (Hajimemashite)', chinese: '很高兴认识你 (Hěn gāoxìng rènshí nǐ)' },
    { english: 'I have experience with...', french: 'J\'ai de l\'expérience avec...', german: 'Ich habe Erfahrung mit...', japanese: '...の経験があります (...no keiken ga arimasu)', chinese: '我有...的经验 (Wǒ yǒu...de jīngyàn)' },
    { english: 'I can do that', french: 'Je peux le faire', german: 'Das kann ich machen', japanese: 'できます (Dekimasu)', chinese: '我可以做 (Wǒ kěyǐ zuò)' },
    { english: 'What is your position?', french: 'Quel est votre poste?', german: 'Was ist Ihre Position?', japanese: 'あなたの役職は？(Anata no yakushoku wa?)', chinese: '你的职位是什么？(Nǐ de zhíwèi shì shénme?)' },
  ],
  emergency: [
    { english: 'Help!', french: 'Au secours!', german: 'Hilfe!', japanese: '助けて！(Tasukete!)', chinese: '救命！(Jiùmìng!)' },
    { english: 'I need a doctor', french: 'J\'ai besoin d\'un médecin', german: 'Ich brauche einen Arzt', japanese: '医者が必要です (Isha ga hitsuyō desu)', chinese: '我需要医生 (Wǒ xūyào yīshēng)' },
    { english: 'Call the police', french: 'Appelez la police', german: 'Rufen Sie die Polizei', japanese: '警察を呼んでください (Keisatsu wo yonde kudasai)', chinese: '叫警察 (Jiào jǐngchá)' },
    { english: 'I am lost', french: 'Je suis perdu', german: 'Ich habe mich verirrt', japanese: '道に迷いました (Michi ni mayoimashita)', chinese: '我迷路了 (Wǒ mílù le)' },
    { english: 'I don\'t feel well', french: 'Je ne me sens pas bien', german: 'Mir geht es nicht gut', japanese: '気分が悪いです (Kibun ga warui desu)', chinese: '我不舒服 (Wǒ bù shūfú)' },
  ],
};

const LanguageLearning = () => {
  const [selectedLang, setSelectedLang] = useState('french');
  const [activeSection, setActiveSection] = useState('greetings'); // category key or 'alphabet'
  const [isOpen, setIsOpen] = useState(false);

  const speak = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\(.*\)/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = 0.8;
    window._activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const currentPhrases = PHRASES[activeSection] || [];

  return (
    <div className="mt-12">
      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-morphism p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Languages size={22} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-foreground">Foreign Language Corner</h3>
            <p className="text-xs text-muted-foreground">Alphabets, phrases, numbers & survival vocab in 4 languages</p>
          </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-morphism rounded-t-none p-6 space-y-5 border-t-0">
              
              {/* Feature Banner to Hub */}
              <Link to="/language" className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl hover:scale-[1.01] transition-transform">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-primary shadow-sm"><Globe size={18} /></div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm">Global Language Hub Chatbot</h4>
                        <p className="text-xs text-muted-foreground">Practice natively with our AI Chatbot roleplay & lessons</p>
                    </div>
                 </div>
                 <div className="hidden sm:block px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg shadow-sm transition-colors">Enter Hub</div>
              </Link>

              {/* Language Selector */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(LANGUAGES).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedLang(key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      selectedLang === key
                        ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                        : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-border/50'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span> {lang.name}
                  </button>
                ))}
              </div>

              {/* Category Tabs — scrollable row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                <button
                  onClick={() => setActiveSection('alphabet')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    activeSection === 'alphabet' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  🔤 Alphabet
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveSection(cat.key)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      activeSection === cat.key ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Phrases Grid */}
              {activeSection !== 'alphabet' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPhrases.map((phrase, i) => (
                    <motion.div
                      key={`${activeSection}-${i}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4 rounded-2xl bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {phrase.english}
                        </p>
                        <button
                          onClick={() => speak(phrase[selectedLang], LANGUAGES[selectedLang].code)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                          title="Listen"
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {phrase[selectedLang]}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Alphabet Table */}
              {activeSection === 'alphabet' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-3 text-left text-xs font-bold text-muted-foreground uppercase">English</th>
                        <th className="py-3 px-3 text-left text-xs font-bold text-muted-foreground uppercase">
                          {LANGUAGES[selectedLang].flag} {LANGUAGES[selectedLang].name}
                        </th>
                        <th className="py-3 px-3 text-center text-xs font-bold text-muted-foreground uppercase">🔊</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALPHABET_MAP.map((row, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-black text-lg text-primary">{row.en}</td>
                          <td className="py-2.5 px-3 font-bold text-foreground">{row[selectedLang]}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => speak(row[selectedLang], LANGUAGES[selectedLang].code)}
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Volume2 size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageLearning;
