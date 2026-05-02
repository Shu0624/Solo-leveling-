// AI Blueprint Phrase Data Database (Hardcoded for zero DB loads)

export const languagePhrases = {
  German: [
    { category: 'Greetings', script: 'Guten Morgen. Wie geht es Ihnen?', romanization: 'Guten Morgen. Wie geht es Ihnen?', english: 'Good morning. How are you? (Formal)' },
    { category: 'Greetings', script: 'Hallo. Schön, dich kennenzulernen.', romanization: 'Hallo. Schön, dich kennenzulernen.', english: 'Hello. Nice to meet you.' },
    { category: 'Work & Interview', script: 'Welche Programmiersprachen beherrschen Sie?', romanization: 'Welche Programmiersprachen beherrschen Sie?', english: 'Which programming languages do you know?' },
    { category: 'Work & Interview', script: 'Ich habe Erfahrung mit React und Node.js.', romanization: 'Ich habe Erfahrung mit React und Node.js.', english: 'I have experience with React and Node.js.' },
    { category: 'Survival & Travel', script: 'Entschuldigung, wo ist die Toilette?', romanization: 'Entschuldigung, wo ist die Toilette?', english: 'Excuse me, where is the toilet?' },
    { category: 'Survival & Travel', script: 'Können Sie das bitte wiederholen?', romanization: 'Können Sie das bitte wiederholen?', english: 'Can you please repeat that?' },
  ],
  Japanese: [
    { category: 'Greetings', script: 'おはようございます。お元気ですか？', romanization: 'Ohayō gozaimasu. O-genki desu ka?', english: 'Good morning. How are you? (Formal)' },
    { category: 'Greetings', script: 'はじめまして。', romanization: 'Hajimemashite.', english: 'Nice to meet you.' },
    { category: 'Work & Interview', script: '自己紹介をお願いします。', romanization: 'Jiko shōkai o onegai shimasu.', english: 'Please introduce yourself.' },
    { category: 'Work & Interview', script: '私はReactを使って開発できます。', romanization: 'Watashi wa React o tsukatte kaihatsu dekimasu.', english: 'I can develop using React.' },
    { category: 'Survival & Travel', script: 'すみません、駅はどこですか？', romanization: 'Sumimasen, eki wa doko desu ka?', english: 'Excuse me, where is the station?' },
    { category: 'Survival & Travel', script: 'もう一度言ってください。', romanization: 'Mō ichido itte kudasai.', english: 'Please say it again.' },
  ],
  French: [
    { category: 'Greetings', script: 'Bonjour. Comment allez-vous ?', romanization: 'Bonjour. Comment allez-vous ?', english: 'Hello. How are you? (Formal)' },
    { category: 'Greetings', script: 'Enchanté.', romanization: 'Enchanté.', english: 'Nice to meet you.' },
    { category: 'Work & Interview', script: 'Quel est votre poste actuel ?', romanization: 'Quel est votre poste actuel ?', english: 'What is your current position?' },
    { category: 'Work & Interview', script: 'J\'ai travaillé comme développeur frontend.', romanization: 'J\'ai travaillé comme développeur frontend.', english: 'I worked as a frontend developer.' },
    { category: 'Survival & Travel', script: 'L\'addition, s\'il vous plaît.', romanization: 'L\'addition, s\'il vous plaît.', english: 'The bill, please.' },
    { category: 'Survival & Travel', script: 'Où se trouve la gare ?', romanization: 'Où se trouve la gare ?', english: 'Where is the train station?' },
  ],
  Spanish: [
    { category: 'Greetings', script: 'Buenos días. ¿Cómo estás?', romanization: 'Buenos días. ¿Cómo estás?', english: 'Good morning. How are you? (Informal)' },
    { category: 'Greetings', script: 'Mucho gusto.', romanization: 'Mucho gusto.', english: 'Nice to meet you.' },
    { category: 'Work & Interview', script: '¿Por qué quieres trabajar aquí?', romanization: '¿Por qué quieres trabajar aquí?', english: 'Why do you want to work here?' },
    { category: 'Work & Interview', script: 'Tengo tres años de experiencia.', romanization: 'Tengo tres años de experiencia.', english: 'I have three years of experience.' },
    { category: 'Survival & Travel', script: '¿Dónde está el baño?', romanization: '¿Dónde está el baño?', english: 'Where is the bathroom?' },
    { category: 'Survival & Travel', script: 'Hable más despacio, por favor.', romanization: 'Hable más despacio, por favor.', english: 'Speak slower, please.' },
  ],
  Mandarin: [
    { category: 'Greetings', script: '早上好。你好吗？', romanization: 'Zǎoshang hǎo. Nǐ hǎo ma?', english: 'Good morning. How are you?' },
    { category: 'Greetings', script: '很高兴认识你。', romanization: 'Hěn gāoxìng rènshí nǐ.', english: 'Nice to meet you.' },
    { category: 'Work & Interview', script: '你有什么开发经验？', romanization: 'Nǐ yǒu shénme kāifā jīngyàn?', english: 'What development experience do you have?' },
    { category: 'Work & Interview', script: '我会写代码。', romanization: 'Wǒ huì xiě dàimǎ.', english: 'I can write code.' },
    { category: 'Survival & Travel', script: '洗手间在哪里？', romanization: 'Xǐshǒujiān zài nǎlǐ?', english: 'Where is the restroom?' },
    { category: 'Survival & Travel', script: '多少钱？', romanization: 'Duōshǎo qián?', english: 'How much does it cost?' },
  ]
};

export const LAUNGUAGE_SCENARIOS = {
  German: ['Buying a Train Ticket in Munich', 'Tech Interview in Berlin', 'Ordering Coffee in Frankfurt'],
  Japanese: ['Asking Directions in Tokyo', 'Introducing yourself at a Japanese Tech Company', 'Ordering Ramen'],
  French: ['Checking into a Paris Hotel', 'Arguing a Refund', 'Networking event in Lyon'],
  Spanish: ['Ordering Tapas in Madrid', 'Customer Support Call', 'BPO Tech Support Interview'],
  Mandarin: ['Negotiating at a Shenzhen Electronics Market', 'Asking for a hardware spec sheet', 'Ordering Dumplings'],
};
