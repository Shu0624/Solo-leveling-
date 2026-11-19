import { getGroqChatCompletion } from './groqService.js';
import ProgramListing from '../models/ProgramListing.js';
import BenefitListing from '../models/BenefitListing.js';
import DiscoveryState from '../models/DiscoveryState.js';

// =====================================================================
// VERIFIED SEED DATA — Static fallback + initial DB seed
// =====================================================================
const SEED_PROGRAMS = [
  {
    title: 'Google Student Developer Club Lead',
    company: 'Google',
    logo: '🟢',
    color: '#4285f4',
    category: 'ambassador',
    description: 'Lead a university-based community of developers. Get training, mentorship, and swag from Google. Organize workshops, study jams, and hackathons for your campus.',
    deadline: 'Applications open annually (Aug–Sep)',
    duration: '1 Academic Year',
    link: 'https://developers.google.com/community/gdsc',
    tags: ['Free', 'Certificate', 'Networking', 'Leadership'],
    eligibility: 'Enrolled university students passionate about technology',
    benefits: ['Google swag & resources', 'Direct mentorship from Google', 'Global community access', 'Conference invites'],
    source: 'verified',
  },
  {
    title: 'Microsoft Learn Student Ambassador',
    company: 'Microsoft',
    logo: '🔵',
    color: '#00a4ef',
    category: 'ambassador',
    description: 'Amplify your impact and bring your peers along by volunteering as a Microsoft Learn Student Ambassador. Learn new skills, build community, and unlock exclusive resources.',
    deadline: 'Rolling applications',
    duration: 'Ongoing (milestone-based tiers)',
    link: 'https://mvp.microsoft.com/studentambassadors',
    tags: ['Free', 'Certificate', 'Stipend', 'Swag'],
    eligibility: 'Enrolled in accredited higher education institution, 16+ years',
    benefits: ['Free Azure credits ($150/mo)', 'LinkedIn Premium', 'Visual Studio Enterprise', 'Conference tickets & exclusive events'],
    source: 'verified',
  },
  {
    title: 'Google Summer of Code (GSoC)',
    company: 'Google',
    logo: '☀️',
    color: '#4285f4',
    category: 'open-source',
    description: 'Get paid to contribute to open source projects during summer. Work with mentors from top open source organizations worldwide.',
    deadline: 'Applications open in March annually',
    duration: '10–22 weeks (summer)',
    link: 'https://summerofcode.withgoogle.com/',
    tags: ['Stipend', 'Certificate', 'Open Source'],
    eligibility: 'Open to anyone 18+, students and non-students',
    benefits: ['$1500–$6600 stipend', 'Mentorship from industry experts', 'Google certificate', 'Global recognition'],
    source: 'verified',
  },
  {
    title: 'MLH Fellowship',
    company: 'Major League Hacking',
    logo: '🏆',
    color: '#e73427',
    category: 'fellowship',
    description: 'A 12-week internship alternative where you contribute to open source projects, build portfolio-worthy projects, and learn from experienced mentors.',
    deadline: 'Multiple cohorts (Spring, Summer, Fall)',
    duration: '12 weeks',
    link: 'https://fellowship.mlh.io/',
    tags: ['Stipend', 'Certificate', 'Open Source', 'Networking'],
    eligibility: '18+ currently enrolled or recently graduated',
    benefits: ['$5,000 stipend', 'Portfolio projects', 'Career coaching', 'Alumni network'],
    source: 'verified',
  },
  {
    title: 'GitHub Campus Expert',
    company: 'GitHub',
    logo: '🐙',
    color: '#333',
    category: 'ambassador',
    description: 'Get trained by GitHub to become a campus expert. Build and lead developer communities, host events, and inspire the next generation of developers.',
    deadline: 'Biannual cohorts (Jan & Jul)',
    duration: 'Ongoing after acceptance',
    link: 'https://education.github.com/experts',
    tags: ['Free', 'Certificate', 'Networking', 'Leadership'],
    eligibility: '18+ university/college student, active in tech community',
    benefits: ['GitHub Pro', 'Travel grants for conferences', 'Expert training program', 'GitHub merchandise'],
    source: 'verified',
  },
  {
    title: 'Amazon Student Partner',
    company: 'Amazon',
    logo: '🟠',
    color: '#ff9900',
    category: 'ambassador',
    description: 'Join Amazon\'s campus ambassador program to promote AWS, organize tech events, and earn rewards while building cloud computing skills.',
    deadline: 'Semester-based recruitment',
    duration: '6 months per cohort',
    link: 'https://aws.amazon.com/education/',
    tags: ['Free', 'Certificate', 'Stipend'],
    eligibility: 'University students with interest in cloud and technology',
    benefits: ['AWS credits', 'Amazon swag', 'Priority internship consideration', 'AWS certification vouchers'],
    source: 'verified',
  },
  {
    title: 'Google Cloud Arcade',
    company: 'Google Cloud',
    logo: '☁️',
    color: '#4285f4',
    category: 'ai-course',
    description: 'Complete hands-on labs and challenges in Google Cloud Platform to earn badges, points, and prizes. Covers AI/ML, data engineering, and cloud architecture.',
    deadline: 'Multiple cohorts per year',
    duration: '1–3 months per arcade',
    link: 'https://cloud.google.com/arcade',
    tags: ['Free', 'Certificate', 'Swag'],
    eligibility: 'Anyone with a Google account',
    benefits: ['Google Cloud badges', 'Free cloud credits', 'Exclusive swag & prizes', 'Cloud certification readiness'],
    source: 'verified',
  },
  {
    title: 'AWS Educate',
    company: 'Amazon Web Services',
    logo: '☁️',
    color: '#ff9900',
    category: 'ai-course',
    description: 'Access free cloud computing learning resources, hands-on labs, and AWS credits through an academic gateway designed for students.',
    deadline: 'Always open',
    duration: 'Self-paced',
    link: 'https://aws.amazon.com/education/awseducate/',
    tags: ['Free', 'Certificate'],
    eligibility: 'Students 14+ with a valid institution email',
    benefits: ['Free AWS credits', 'Cloud career pathways', 'Hands-on labs', 'Job board access'],
    source: 'verified',
  },
  {
    title: 'GeeksforGeeks Campus Ambassador',
    company: 'GeeksforGeeks',
    logo: '🟩',
    color: '#2f8d46',
    category: 'ambassador',
    description: 'Represent GeeksforGeeks at your campus. Organize coding contests, workshops, and build a community of competitive programmers.',
    deadline: 'Rolling applications',
    duration: '6 months',
    link: 'https://www.geeksforgeeks.org/campus-ambassador-program/',
    tags: ['Free', 'Certificate', 'Stipend', 'Networking'],
    eligibility: 'Students in any year of engineering or equivalent',
    benefits: ['Monthly stipend', 'GFG Premium access', 'Exclusive merchandise', 'Letter of recommendation'],
    source: 'verified',
  },
  {
    title: 'Meta Developer Circles',
    company: 'Meta',
    logo: '🔷',
    color: '#0668E1',
    category: 'other',
    description: 'Join a global community of developers who explore the latest in AI, VR, and web technologies. Participate in hackathons and grow your network.',
    deadline: 'Always open',
    duration: 'Ongoing community',
    link: 'https://developers.facebook.com/developercircles/',
    tags: ['Free', 'Networking'],
    eligibility: 'Any developer or aspiring developer',
    benefits: ['Meta API access', 'Community events', 'Hackathon opportunities', 'Developer resources'],
    source: 'verified',
  },
  // --- Internship & Placement Seed ---
  {
    title: 'Google STEP Internship',
    company: 'Google',
    logo: '🟢',
    color: '#4285f4',
    category: 'internship',
    description: 'Google\'s Student Training in Engineering Program for first and second-year undergrads. Get real-world engineering experience with Google mentors.',
    deadline: 'Applications open Sep–Oct annually',
    duration: '12 weeks (summer)',
    link: 'https://buildyourfuture.withgoogle.com/internships',
    tags: ['Stipend', 'Internship', 'Networking'],
    eligibility: 'First/second-year undergraduate students in CS or related fields',
    benefits: ['Competitive stipend', 'Google mentorship', 'Real project work', 'Full-time conversion path'],
    source: 'verified',
  },
  {
    title: 'Microsoft Engage Internship',
    company: 'Microsoft',
    logo: '🔵',
    color: '#00a4ef',
    category: 'internship',
    description: 'Microsoft\'s mentorship-driven internship program for pre-final year students in India. Build real products and get mentored by Microsoft engineers.',
    deadline: 'Applications open May–Jun annually',
    duration: '4–6 weeks (summer)',
    link: 'https://careers.microsoft.com/v2/global/en/students',
    tags: ['Stipend', 'Internship', 'Certificate'],
    eligibility: 'Pre-final year B.Tech/BE students in India',
    benefits: ['Stipend', 'Microsoft mentorship', 'PPO opportunity', 'Certificate of completion'],
    source: 'verified',
  },
  {
    title: 'Amazon ML Summer School',
    company: 'Amazon',
    logo: '🟠',
    color: '#ff9900',
    category: 'ai-course',
    description: 'Free virtual ML program by Amazon scientists. Learn supervised learning, deep learning, NLP, CV, and reinforcement learning with hands-on projects.',
    deadline: 'Applications open Apr–May annually',
    duration: '4 weeks (summer)',
    link: 'https://amazonmlsummerschool.com/',
    tags: ['Free', 'Certificate', 'AI/ML'],
    eligibility: 'Engineering students (any year) from recognized institutions',
    benefits: ['Free ML training', 'Amazon certificate', 'Taught by Amazon scientists', 'Priority for Amazon roles'],
    source: 'verified',
  },
  {
    title: 'Google AI/ML Virtual Internship (AICTE)',
    company: 'Google + AICTE',
    logo: '🤖',
    color: '#4285f4',
    category: 'ai-course',
    description: 'Free virtual internship covering AI/ML fundamentals, TensorFlow, and Google Cloud AI tools. Includes hands-on projects and Google certification.',
    deadline: 'Multiple batches per year',
    duration: '8–10 weeks',
    link: 'https://grow.google/intl/en_in/ai-ml/',
    tags: ['Free', 'Certificate', 'AI/ML'],
    eligibility: 'AICTE-approved engineering college students in India',
    benefits: ['Google certificate', 'Hands-on AI/ML projects', 'Free Coursera access', 'LinkedIn badge'],
    source: 'verified',
  },
  {
    title: 'IBM SkillsBuild AI Courses',
    company: 'IBM',
    logo: '🔷',
    color: '#0f62fe',
    category: 'ai-course',
    description: 'Free AI, cybersecurity, data science, and cloud computing courses with IBM digital credentials. Self-paced learning with industry-recognized badges.',
    deadline: 'Always open',
    duration: 'Self-paced (10–40 hours per course)',
    link: 'https://skillsbuild.org/',
    tags: ['Free', 'Certificate', 'AI/ML'],
    eligibility: 'Open to all students worldwide',
    benefits: ['IBM digital badges', 'Free courses', 'Career readiness tools', 'LinkedIn credential'],
    source: 'verified',
  },
];

const SEED_BENEFITS = [
  {
    name: 'GitHub Student Developer Pack',
    provider: 'GitHub',
    emoji: '🐙',
    category: 'discounts',
    description: 'Get 100+ free developer tools including domains, cloud credits, CI/CD, design tools, and more.',
    value: 'Worth $200K+ in tools',
    link: 'https://education.github.com/pack',
    highlights: ['Free .me domain', 'Azure $100 credits', 'JetBrains IDEs', 'Canva Pro', 'Namecheap domains'],
    source: 'verified',
  },
  {
    name: 'JetBrains All Products Pack',
    provider: 'JetBrains',
    emoji: '🧠',
    category: 'discounts',
    description: 'Full access to IntelliJ IDEA, PyCharm, WebStorm, and all JetBrains professional IDEs.',
    value: 'Free (normally ₹50K+/year)',
    link: 'https://www.jetbrains.com/community/education/',
    highlights: ['IntelliJ IDEA Ultimate', 'PyCharm Professional', 'WebStorm', 'DataGrip'],
    source: 'verified',
  },
  {
    name: 'Figma Education',
    provider: 'Figma',
    emoji: '🎨',
    category: 'discounts',
    description: 'Full Figma Professional plan free for students and educators.',
    value: 'Free (normally $12/mo)',
    link: 'https://www.figma.com/education/',
    highlights: ['Unlimited files', 'Professional features', 'Team collaboration', 'Dev mode'],
    source: 'verified',
  },
  {
    name: 'Azure for Students',
    provider: 'Microsoft',
    emoji: '☁️',
    category: 'discounts',
    description: 'Get $100 in Azure credits, free services for 12 months, and 25+ always-free services.',
    value: '$100 Azure credits',
    link: 'https://azure.microsoft.com/en-us/free/students/',
    highlights: ['$100 credits', 'No credit card needed', '25+ free services', 'AI & ML services'],
    source: 'verified',
  },
  {
    name: 'Notion for Education',
    provider: 'Notion',
    emoji: '📓',
    category: 'discounts',
    description: 'Free Notion Plus plan — unlimited blocks, file uploads, and collaboration.',
    value: 'Free (normally $8/mo)',
    link: 'https://www.notion.so/students',
    highlights: ['Unlimited blocks', 'Collaboration', 'AI assistant', 'Templates'],
    source: 'verified',
  },
  {
    name: 'Canva Pro for Students',
    provider: 'Canva',
    emoji: '🖌️',
    category: 'discounts',
    description: 'Premium design tool with 100M+ graphics, brand kits, Magic Resize, and more.',
    value: 'Free (normally ₹4K/year)',
    link: 'https://www.canva.com/education/',
    highlights: ['100M+ graphics', 'Brand kit', 'Background remover', 'AI tools'],
    source: 'verified',
  },
  {
    name: 'LeetCode Premium',
    provider: 'LeetCode',
    emoji: '💻',
    category: 'coding',
    description: 'Premium access to 3000+ problems with solutions, company-wise questions, and mock interviews.',
    value: 'Student pricing available',
    link: 'https://leetcode.com/subscribe/',
    highlights: ['Company-wise problems', 'Video solutions', 'Mock interviews', 'Contest rankings'],
    source: 'verified',
  },
  {
    name: 'Coursera Financial Aid',
    provider: 'Coursera',
    emoji: '📚',
    category: 'coding',
    description: '100% financial aid available for all courses and specializations.',
    value: 'Free (with financial aid)',
    link: 'https://www.coursera.org/financial-aid',
    highlights: ['100% fee waiver', 'Verified certificates', 'All courses eligible', 'Takes 15 days to approve'],
    source: 'verified',
  },
  {
    name: 'freeCodeCamp',
    provider: 'freeCodeCamp',
    emoji: '🏕️',
    category: 'coding',
    description: 'Completely free, full-stack web development curriculum with certifications.',
    value: 'Completely Free',
    link: 'https://www.freecodecamp.org/',
    highlights: ['10+ certifications free', 'Full-stack curriculum', 'Active community', 'Real-world projects'],
    source: 'verified',
  },
  // --- AI Courses ---
  {
    name: 'Google AI Essentials (Coursera)',
    provider: 'Google',
    emoji: '🤖',
    category: 'ai-courses',
    description: 'Free Google course on AI fundamentals — prompt engineering, AI tools for productivity, and responsible AI. Includes Google career certificate.',
    value: 'Free with financial aid',
    link: 'https://www.coursera.org/learn/google-ai-essentials',
    highlights: ['Google certificate', 'Prompt engineering', 'AI for productivity', 'No coding required'],
    source: 'verified',
  },
  {
    name: 'Microsoft AI Skills Navigator',
    provider: 'Microsoft',
    emoji: '🔵',
    category: 'ai-courses',
    description: 'Free AI learning paths on Microsoft Learn covering Azure AI, responsible AI, and generative AI with hands-on labs.',
    value: 'Completely Free',
    link: 'https://learn.microsoft.com/en-us/ai/',
    highlights: ['Azure AI badges', 'Hands-on labs', 'Certification prep', 'Free cloud sandbox'],
    source: 'verified',
  },
  {
    name: 'AWS Machine Learning University',
    provider: 'Amazon',
    emoji: '🟠',
    category: 'ai-courses',
    description: 'Free ML courses from Amazon\'s internal training program. Covers NLP, computer vision, tabular data, and generative AI.',
    value: 'Completely Free',
    link: 'https://aws.amazon.com/machine-learning/mlu/',
    highlights: ['Amazon internal training', 'Hands-on notebooks', 'NLP & CV tracks', 'Free forever'],
    source: 'verified',
  },
  {
    name: 'NVIDIA Deep Learning Institute (Free Courses)',
    provider: 'NVIDIA',
    emoji: '🟩',
    category: 'ai-courses',
    description: 'Free self-paced courses on deep learning, computer vision, NLP, and accelerated computing from NVIDIA.',
    value: 'Free tier available',
    link: 'https://www.nvidia.com/en-us/training/',
    highlights: ['GPU-powered labs', 'DL fundamentals', 'Certificate of competency', 'Industry standard'],
    source: 'verified',
  },
  {
    name: 'Meta AI & PyTorch Courses',
    provider: 'Meta',
    emoji: '🔷',
    category: 'ai-courses',
    description: 'Free PyTorch tutorials and AI courses from Meta. Learn deep learning with the framework used at Meta, Tesla, and OpenAI.',
    value: 'Completely Free',
    link: 'https://pytorch.org/tutorials/',
    highlights: ['Official PyTorch docs', 'Industry standard', 'Transfer learning', 'Production deployment'],
    source: 'verified',
  },
  // --- Internship & Placement Benefits ---
  {
    name: 'Internshala Internships',
    provider: 'Internshala',
    emoji: '💼',
    category: 'internship',
    description: 'India\'s largest internship platform. Filter by stipend, duration, work-from-home, and tech stack. Many offer PPO.',
    value: 'Free to apply',
    link: 'https://internshala.com/',
    highlights: ['50K+ internships', 'WFH options', 'PPO opportunities', 'Stipend filters'],
    source: 'verified',
  },
  {
    name: 'LinkedIn Early Talent Jobs',
    provider: 'LinkedIn',
    emoji: '🔗',
    category: 'placement',
    description: 'Use LinkedIn\'s "Entry Level" and "Internship" filters to find MNC opportunities. Set job alerts for your target companies.',
    value: 'Free',
    link: 'https://www.linkedin.com/jobs/',
    highlights: ['Job alerts', 'Easy Apply', 'MNC listings', 'Referral connections'],
    source: 'verified',
  },
  {
    name: 'Unstop (formerly D2C) Hiring Challenges',
    provider: 'Unstop',
    emoji: '🏅',
    category: 'placement',
    description: 'Compete in hiring challenges, hackathons, and quizzes from top companies. Winners get direct interview opportunities and prizes.',
    value: 'Free to participate',
    link: 'https://unstop.com/',
    highlights: ['Direct hire challenges', 'Cash prizes', 'MNC hackathons', 'Resume builder'],
    source: 'verified',
  },
  // --- Earning ---
  {
    name: 'Freelancing Platforms',
    provider: 'Multiple',
    emoji: '💼',
    category: 'earning',
    description: 'Build websites, apps, and scripts for clients worldwide on Fiverr, Upwork, and Toptal.',
    highlights: ['Fiverr — Start from ₹500/gig', 'Upwork — Hourly or fixed-price', 'Toptal — $60-200/hr premium', '💡 Start: WordPress sites, React apps'],
    source: 'verified',
  },
  {
    name: 'Technical Writing',
    provider: 'Multiple',
    emoji: '✍️',
    category: 'earning',
    description: 'Write technical articles and tutorials for money. Many platforms pay per article.',
    highlights: ['DigitalOcean — $300-400 per tutorial', 'Medium Partner Program — Earn per read', 'freeCodeCamp — 1M+ readers exposure', 'Dev.to — Build audience'],
    source: 'verified',
  },
];

// =====================================================================
// AI DISCOVERY — Uses Groq LLM to find fresh opportunities
// =====================================================================

const todayStr = () => new Date().toISOString().split('T')[0];

const CORRECT_LINKS = [
  { company: 'infosys', contains: 'instep', link: 'https://www.infosys.com/instep.html' },
  { company: 'tcs', contains: 'codevita', link: 'https://www.tcs.com/careers/tcs-codevita' },
  { company: 'tcs', contains: 'ignite', link: 'https://www.tcs.com/careers/entry-level-programs' },
  { company: 'tcs', contains: 'commune', link: 'https://www.tcs.com/careers/entry-level-programs' },
  { company: 'google', contains: 'step', link: 'https://buildyourfuture.withgoogle.com/internships' },
  { company: 'google', contains: 'gdsc', link: 'https://developers.google.com/community/gdsc' },
  { company: 'google', contains: 'developer student club', link: 'https://developers.google.com/community/gdsc' },
  { company: 'microsoft', contains: 'ambassador', link: 'https://mvp.microsoft.com/studentambassadors' },
  { company: 'microsoft', contains: 'engage', link: 'https://careers.microsoft.com/v2/global/en/students' },
  { company: 'microsoft', contains: 'msidc', link: 'https://careers.microsoft.com/students' },
  { company: 'microsoft', contains: 'azure fellowship', link: 'https://careers.microsoft.com/students' },
  { company: 'microsoft', contains: 'azure internship', link: 'https://careers.microsoft.com/students' },
  { company: 'amazon', contains: 'sde internship', link: 'https://www.amazon.jobs/en/teams/internships-for-students' },
  { company: 'amazon', contains: 'ml summer', link: 'https://amazonmlsummerschool.com/' },
  { company: 'aicte', contains: 'virtual labs', link: 'https://internship.aicte-india.org/' },
  { company: 'aicte', contains: 'ai/ml', link: 'https://internship.aicte-india.org/' },
  { company: 'wipro', contains: 'earthian', link: 'https://www.wipro.com/sustainability/earthian/' }
];

const sanitizeLink = (link, company, title) => {
  if (!link) return '';
  let cleanUrl = link.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  const companyNorm = company.toLowerCase();
  const titleNorm = title.toLowerCase();
  for (const rule of CORRECT_LINKS) {
    if (companyNorm.includes(rule.company) && titleNorm.includes(rule.contains)) {
      return rule.link;
    }
  }
  return cleanUrl;
};

// =====================================================================
// DEDUP + LINK TRUST — makes listings safe to show students
// =====================================================================

// Companies the AI refers to under multiple names.
const COMPANY_ALIASES = {
  'tata consultancy services': 'tcs',
  'tata consultancy service': 'tcs',
  'google llc': 'google',
  'google cloud': 'google',
  'alphabet': 'google',
  'meta platforms': 'meta',
  'facebook': 'meta',
  'amazon web services': 'amazon',
  'aws': 'amazon',
  'microsoft corporation': 'microsoft',
  'international business machines': 'ibm',
  'all india council for technical education': 'aicte',
};

const normCompany = (c) => {
  const n = String(c || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return COMPANY_ALIASES[n] || n;
};

// Words that don't distinguish one program from another.
const TITLE_STOPWORDS = new Set([
  'program', 'programme', 'the', 'for', 'students', 'student', 'course', 'courses',
  'by', 'and', 'of', 'india', 'indian', 'free', 'online', 'virtual', 'scheme',
  'challenge', 'fellowship', 'internship', 'a', 'an', 'to', 'in', 'with', 's',
]);

// Canonical token set for a title, so "Free AI/ML Course" == "AI and ML Course".
const titleTokens = (t) => {
  const tokens = String(t || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && w.length > 1 && !TITLE_STOPWORDS.has(w) && !/^20\d\d$/.test(w));
  return [...new Set(tokens)].sort();
};

// Stable dedup key: normalized company + canonical title token set.
export const dedupKey = (company, title) => `${normCompany(company)}|${titleTokens(title).join(' ')}`;

// Return a link we can TRUST, else a Google search that always resolves.
// We only trust: (a) verified seed entries, and (b) links matching the
// hand-maintained CORRECT_LINKS whitelist. Every other AI-supplied URL is
// replaced with a search query — a hallucinated URL can 404 and damage
// trust, whereas a search always lands the student on the real program.
const trustedLink = (item, type) => {
  const name = type === 'program' ? item.title : item.name;
  const company = type === 'program' ? item.company : item.provider;
  const link = String(item.link || '').trim();

  // 'web-verified' links came from a live web search and answered an HTTP check.
  if (link && (item.source === 'verified' || item.source === 'web-verified')) return link;

  const cN = String(company || '').toLowerCase();
  const tN = String(name || '').toLowerCase();
  for (const rule of CORRECT_LINKS) {
    if (cN.includes(rule.company) && tN.includes(rule.contains)) return rule.link;
  }

  const q = encodeURIComponent([company, name].filter(Boolean).join(' '));
  return `https://www.google.com/search?q=${q}`;
};

/**
 * Dedupe a list of listings and repair their links before sending to clients.
 * Keeps verified entries over ai-generated ones on collision, then the oldest.
 * `type` is 'program' or 'benefit'.
 */
export const sanitizeListingsForDisplay = (items, type) => {
  const keyOf = (it) => type === 'program'
    ? dedupKey(it.company, it.title)
    : dedupKey(it.provider, it.name);

  const byKey = new Map();
  for (const it of items) {
    const key = keyOf(it);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, it);
      continue;
    }
    // Prefer verified; then the earliest-added (stable, avoids churn).
    const better =
      (it.source === 'verified' && existing.source !== 'verified') ? it :
      (existing.source === 'verified' && it.source !== 'verified') ? existing :
      (new Date(it.addedAt || 0) < new Date(existing.addedAt || 0) ? it : existing);
    byKey.set(key, better);
  }

  return [...byKey.values()].map((it) => ({ ...it, link: trustedLink(it, type) }));
};

// =====================================================================
// GROUNDED DISCOVERY — web search, live link checks, real deadlines
// =====================================================================
// The old discovery asked the model to *remember* "current" programs, which it
// can't: it invented listings and URLs, so its links were swapped for Google
// searches and its text-only deadlines never expired anything. Discovery now
// runs Groq's browser_search tool, keeps only links that actually resolve, and
// reads deadlines into expiresAt.

const WEB_SEARCH_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const DISCOVERY_COOLDOWN_MS = 30 * 60 * 1000;
const LINK_CHECK_TIMEOUT_MS = 5000;
const PROGRAM_CATEGORIES = ['ambassador', 'fellowship', 'open-source', 'internship', 'placement', 'ai-course', 'hackathon', 'other'];

const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthIndex = (m) => MONTHS.indexOf(String(m).slice(0, 3).toLowerCase());
const endOfDay = (y, m, d) => new Date(Date.UTC(y, m, d, 23, 59, 59));

/**
 * The latest full date written in a free-text deadline, e.g. "Apply by July 15,
 * 2026", "15 Aug 2026", "2026-09-30" or "May 2026" (end of month). Null when
 * there is no dated year in it ("Rolling", "Self-paced", "15 July").
 */
export const parseDeadline = (text) => {
  let rest = String(text || '');
  const dates = [];
  const take = (re, toDate) => {
    rest = rest.replace(re, (...m) => {
      dates.push(toDate(m));
      return ' ';
    });
  };
  take(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/g, (m) => endOfDay(+m[1], +m[2] - 1, +m[3]));
  take(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d\\d)\\b`, 'gi'), (m) => endOfDay(+m[3], monthIndex(m[1]), +m[2]));
  take(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?,?\\s+(20\\d\\d)\\b`, 'gi'), (m) => endOfDay(+m[3], monthIndex(m[2]), +m[1]));
  take(new RegExp(`\\b${MONTH_RE}\\.?,?\\s+(20\\d\\d)\\b`, 'gi'), (m) => endOfDay(+m[2], monthIndex(m[1]) + 1, 0));
  const valid = dates.filter((d) => !Number.isNaN(d.getTime()));
  return valid.length ? new Date(Math.max(...valid)) : null;
};

// The JSON object in a model reply, which may come wrapped in prose or fences.
const extractJson = (text) => {
  const s = String(text || '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object in model reply');
  return JSON.parse(s.slice(start, end + 1));
};

/**
 * True when a URL really answers. Sites that turn away bots (401/403/429) still
 * exist, so they pass; 404s, dead hosts, timeouts and search-result URLs don't.
 */
export const verifyLink = async (url) => {
  let parsed;
  try {
    parsed = new URL(String(url || '').trim());
  } catch {
    return false;
  }
  if (!/^https?:$/.test(parsed.protocol)) return false;
  if (/(^|\.)google\.[a-z.]+$/.test(parsed.hostname) && parsed.pathname.startsWith('/search')) return false;
  try {
    const res = await fetch(parsed, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LevelUpLinkCheck/1.0)', Accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
    });
    res.body?.cancel().catch(() => {});
    return res.status < 400 || [401, 403, 429].includes(res.status);
  } catch {
    return false;
  }
};

const searchWeb = async (prompt) => {
  const raw = await getGroqChatCompletion(
    [
      {
        role: 'system',
        content: 'You research opportunities for Indian engineering students. Use the browser_search tool and report only opportunities and URLs you actually found in search results. When you are done, write your answer as a single JSON object in the message text.',
      },
      { role: 'user', content: prompt },
    ],
    false,
    0.2,
    { tools: [{ type: 'browser_search' }], models: WEB_SEARCH_MODELS, timeoutMs: 25000, totalTimeoutMs: 45000, maxRetries: 0 },
  );
  return extractJson(raw);
};

// Hand-checked links are trusted as-is: some of those sites (tcs.com) answer
// automated requests with 404s, which would wrongly fail the live check.
const WHITELISTED_LINKS = new Set(CORRECT_LINKS.map((r) => r.link));

// Keep candidates whose link resolves; checks run in parallel.
const withWorkingLinks = async (items) => {
  const results = await Promise.all(items.map(async (it) =>
    (WHITELISTED_LINKS.has(it.link) || (await verifyLink(it.link)) ? it : null)));
  return results.filter(Boolean);
};

// Claim the next web-discovery run. False while another run is inside the
// cooldown, so many students pressing Refresh cost one search, not dozens.
const claimDiscoveryRun = async () => {
  const now = new Date();
  try {
    await DiscoveryState.findOneAndUpdate(
      { _id: 'discovery', $or: [{ lastRunAt: null }, { lastRunAt: { $lt: new Date(now.getTime() - DISCOVERY_COOLDOWN_MS) } }] },
      { $set: { lastRunAt: now } },
      { upsert: true },
    );
    return true;
  } catch (e) {
    if (e.code === 11000) return false; // the doc exists and was run recently
    throw e;
  }
};

/** When listings were last refreshed: the later of the last run and the newest listing. */
export const getLastUpdated = async (newestListing) => {
  const state = await DiscoveryState.findById('discovery').lean().catch(() => null);
  const times = [state?.lastCompletedAt, newestListing?.updatedAt]
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  return times.length ? new Date(Math.max(...times)) : null;
};

/**
 * Find programs open right now via web search. Returns how many were added,
 * or null when the search itself failed.
 */
export const discoverNewPrograms = async () => {
  console.log('[DISCOVERY] 🔍 Searching the web for current student programs...');
  const today = todayStr();

  try {
    const existing = await ProgramListing.find({}, { title: 1, company: 1 }).lean();
    const known = new Set(existing.map((p) => dedupKey(p.company, p.title)));
    const skip = existing.map((p) => `${p.company}: ${p.title}`).join('; ').slice(0, 2500);

    const parsed = await searchWeb(`Today is ${today}. Search the web for up to 6 opportunities that B.Tech computer science students in India can apply to now: internships, hackathons, coding contests, fellowships, campus ambassador or open-source programs, and free AI/ML courses with certificates.

Rules:
- Only include opportunities whose application deadline is after ${today}, or that accept applications on a rolling basis.
- "link" must be the official page you found (the company's or organiser's site), not a news article or aggregator.
- Skip anything already listed here: ${skip}

Answer with JSON only, shaped like:
{"programs":[{"title":"","company":"","logo":"one emoji","color":"#hex","category":"${PROGRAM_CATEGORIES.join('|')}","description":"2 sentences","deadline":"human-readable deadline","deadlineDate":"YYYY-MM-DD or null","duration":"","link":"https://...","tags":["Free","Certificate","Stipend","Internship"],"eligibility":"","benefits":["",""]}]}`);

    const now = Date.now();
    const candidates = [];
    for (const p of Array.isArray(parsed.programs) ? parsed.programs : []) {
      if (!p?.company || !p?.title || !p?.link) continue;
      const key = dedupKey(p.company, p.title);
      if (known.has(key)) continue;
      const expiresAt = parseDeadline(`${p.deadlineDate || ''} ${p.deadline || ''}`);
      if (expiresAt && expiresAt.getTime() < now) continue; // already closed
      known.add(key);
      const { deadlineDate, ...fields } = p;
      candidates.push({
        ...fields,
        link: sanitizeLink(p.link, p.company, p.title),
        category: PROGRAM_CATEGORIES.includes(p.category) ? p.category : 'other',
        expiresAt,
      });
    }

    let insertedCount = 0;
    for (const program of await withWorkingLinks(candidates)) {
      try {
        await ProgramListing.findOneAndUpdate(
          { title: program.title, company: program.company },
          { ...program, source: 'web-verified', status: 'active', addedAt: new Date() },
          { upsert: true, new: true },
        );
        insertedCount++;
      } catch (e) {
        if (e.code !== 11000) console.warn('[DISCOVERY] Program insert error:', e.message);
      }
    }

    console.log(`[DISCOVERY] ✅ Added ${insertedCount} of ${candidates.length} new programs (the rest had dead links)`);
    return insertedCount;
  } catch (e) {
    console.error('[DISCOVERY] ❌ Program discovery failed:', e.message);
    return null;
  }
};

const VALID_BENEFIT_CATEGORIES = ['discounts', 'coding', 'laptops', 'earning', 'email', 'internship', 'ai-courses', 'placement'];

const mapBenefitCategory = (cat) => {
  if (!cat) return 'discounts';
  const c = cat.toLowerCase().trim();
  if (VALID_BENEFIT_CATEGORIES.includes(c)) return c;
  if (c.includes('course') || c.includes('certif') || c.includes('learn')) return 'ai-courses';
  if (c.includes('job') || c.includes('career') || c.includes('hiring') || c.includes('placement')) return 'placement';
  if (c.includes('intern')) return 'internship';
  if (c.includes('deal') || c.includes('free') || c.includes('tool') || c.includes('discount')) return 'discounts';
  if (c.includes('laptop') || c.includes('hardware')) return 'laptops';
  if (c.includes('earn') || c.includes('money') || c.includes('work') || c.includes('write')) return 'earning';
  return 'discounts';
};

/**
 * Find student benefits live right now via web search. Returns how many were
 * added, or null when the search itself failed.
 */
export const discoverNewBenefits = async () => {
  console.log('[DISCOVERY] 🔍 Searching the web for current student benefits...');
  const today = todayStr();

  try {
    const existing = await BenefitListing.find({}, { name: 1, provider: 1 }).lean();
    const known = new Set(existing.map((b) => dedupKey(b.provider, b.name)));
    const skip = existing.map((b) => `${b.provider}: ${b.name}`).join('; ').slice(0, 2500);

    const parsed = await searchWeb(`Today is ${today}. Search the web for up to 6 free benefits available now to B.Tech computer science students in India: student developer packs and discounts, free AI/ML courses or certifications from tech companies, internship and placement portals, and coding or freelancing earning programs.

Rules:
- Only include offers that are live today.
- "link" must be the official page you found, not a news article or aggregator.
- Skip anything already listed here: ${skip}

Answer with JSON only, shaped like:
{"benefits":[{"name":"","provider":"","emoji":"one emoji","category":"${VALID_BENEFIT_CATEGORIES.join('|')}","description":"2 sentences","value":"what it is worth","link":"https://...","highlights":["",""]}]}`);

    const candidates = [];
    for (const b of Array.isArray(parsed.benefits) ? parsed.benefits : []) {
      if (!b?.name || !b?.provider || !b?.link) continue;
      const key = dedupKey(b.provider, b.name);
      if (known.has(key)) continue;
      known.add(key);
      candidates.push({ ...b, link: String(b.link).trim(), category: mapBenefitCategory(b.category) });
    }

    let insertedCount = 0;
    for (const benefit of await withWorkingLinks(candidates)) {
      try {
        await BenefitListing.findOneAndUpdate(
          { name: benefit.name, provider: benefit.provider },
          { ...benefit, source: 'web-verified', status: 'active', addedAt: new Date() },
          { upsert: true, new: true },
        );
        insertedCount++;
      } catch (e) {
        if (e.code !== 11000) console.warn('[DISCOVERY] Benefit insert error:', e.message);
      }
    }

    console.log(`[DISCOVERY] ✅ Added ${insertedCount} of ${candidates.length} new benefits (the rest had dead links)`);
    return insertedCount;
  } catch (e) {
    console.error('[DISCOVERY] ❌ Benefit discovery failed:', e.message);
    return null;
  }
};

/**
 * Mark expired entries
 */
export const markExpired = async () => {
  const now = new Date();
  const pResult = await ProgramListing.updateMany(
    { expiresAt: { $lte: now }, status: 'active' },
    { $set: { status: 'expired' } }
  );
  const bResult = await BenefitListing.updateMany(
    { expiresAt: { $lte: now }, status: 'active' },
    { $set: { status: 'expired' } }
  );

  // Older AI listings carry their deadline only as text ("Apply by July 15,
  // 2026"), so expiresAt was never set and they stayed "active" for good. Read
  // the date out of the text: past -> expire now, future -> set expiresAt so the
  // listing lapses on time. Curated (verified) entries recur yearly; skip them.
  const undated = await ProgramListing.find(
    { status: 'active', expiresAt: null, source: { $ne: 'verified' } },
    { deadline: 1 },
  ).lean();
  const ops = [];
  let fromText = 0;
  for (const p of undated) {
    const due = parseDeadline(p.deadline);
    if (!due) continue;
    const lapsed = due <= now;
    if (lapsed) fromText++;
    ops.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: lapsed ? { status: 'expired', expiresAt: due } : { expiresAt: due } },
      },
    });
  }
  if (ops.length) await ProgramListing.bulkWrite(ops);

  const total = (pResult.modifiedCount || 0) + (bResult.modifiedCount || 0) + fromText;
  if (total > 0) console.log(`[DISCOVERY] 🗑️ Marked ${total} entries as expired`);
  return total;
};

/**
 * Seed initial data if collections are empty
 */
export const seedIfEmpty = async () => {
  const programCount = await ProgramListing.countDocuments();
  const benefitCount = await BenefitListing.countDocuments();

  if (programCount === 0) {
    console.log('[DISCOVERY] 📦 Seeding initial programs...');
    for (const p of SEED_PROGRAMS) {
      try {
        await ProgramListing.create({ ...p, addedAt: new Date() });
      } catch (e) {
        if (e.code !== 11000) console.warn('[SEED] Program:', e.message);
      }
    }
    console.log(`[DISCOVERY] ✅ Seeded ${SEED_PROGRAMS.length} programs`);
  }

  if (benefitCount === 0) {
    console.log('[DISCOVERY] 📦 Seeding initial benefits...');
    for (const b of SEED_BENEFITS) {
      try {
        await BenefitListing.create({ ...b, addedAt: new Date() });
      } catch (e) {
        if (e.code !== 11000) console.warn('[SEED] Benefit:', e.message);
      }
    }
    console.log(`[DISCOVERY] ✅ Seeded ${SEED_BENEFITS.length} benefits`);
  }
};

/**
 * Full run: seed -> expire -> web discovery (at most once per cooldown).
 * Resolves to { expired, programs, benefits, searched, cooldown, failed }.
 */
export const runDailyDiscovery = async ({ force = false } = {}) => {
  console.log('[DISCOVERY] 🚀 Starting discovery run...');
  await seedIfEmpty();
  const result = { expired: await markExpired(), programs: 0, benefits: 0, searched: false, cooldown: false, failed: false };

  // Grounded web discovery is on by default; ENABLE_AI_DISCOVERY=false turns it off.
  if (process.env.ENABLE_AI_DISCOVERY === 'false') {
    console.log('[DISCOVERY] ⏸️  Web discovery disabled (ENABLE_AI_DISCOVERY=false)');
    return result;
  }
  if (!force && !(await claimDiscoveryRun())) {
    console.log('[DISCOVERY] ⏳ Searched within the cooldown; skipping web discovery');
    result.cooldown = true;
    return result;
  }

  const [programs, benefits] = await Promise.all([discoverNewPrograms(), discoverNewBenefits()]);
  Object.assign(result, {
    programs: programs ?? 0,
    benefits: benefits ?? 0,
    searched: true,
    failed: programs === null || benefits === null,
  });

  // A failed search releases the cooldown so the next Refresh can retry, and
  // doesn't move "last updated", which would claim a refresh that didn't happen.
  await DiscoveryState.updateOne(
    { _id: 'discovery' },
    result.failed
      ? { $set: { lastRunAt: null, lastResult: result } }
      : { $set: { lastCompletedAt: new Date(), lastResult: result } },
    { upsert: true },
  );
  console.log('[DISCOVERY] ✅ Discovery run finished', result);
  return result;
};
