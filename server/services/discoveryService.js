import { getGroqChatCompletion } from './groqService.js';
import ProgramListing from '../models/ProgramListing.js';
import BenefitListing from '../models/BenefitListing.js';

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
    link: 'https://buildyourfuture.withgoogle.com/programs/step',
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
    link: 'https://careers.microsoft.com/students/',
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
    link: 'https://rsvp.withgoogle.com/events/aicte',
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

/**
 * Discover new programs using AI
 */
export const discoverNewPrograms = async () => {
  console.log('[DISCOVERY] 🔍 Discovering new student programs via AI...');
  
  const prompt = `You are an AI agent that curates **currently active** student programs, internships, fellowships, and opportunities for B.Tech computer science students in India.

Today's date: ${todayStr()}

Generate exactly 5 NEW and CURRENTLY ACTIVE programs/opportunities. Focus on:
- 🏢 MNC ambassador/campus programs (Google, Microsoft, Amazon, Meta, etc.)
- 💼 Internship opportunities (tech companies hiring right now)
- 🎓 Free AI/ML courses from MNCs
- 🏆 Hackathons and coding competitions happening now
- 🌟 Open source fellowship programs

CRITICAL RULES:
1. Only include programs that are REAL and CURRENTLY ACTIVE in ${new Date().getFullYear()}
2. Provide REAL, working URLs (not made-up links)
3. Do NOT repeat these existing programs: Google GDSC Lead, Microsoft Learn Student Ambassador, GSoC, MLH Fellowship, GitHub Campus Expert, AWS Educate, Google Cloud Arcade
4. Focus on programs with upcoming deadlines or rolling applications
5. Include specific Indian programs (AICTE, NPTEL, TCS, Infosys, Wipro, etc.)

Return a JSON array of objects with these fields:
{
  "programs": [
    {
      "title": "Program Name",
      "company": "Company Name",
      "logo": "emoji",
      "color": "#hex_color",
      "category": "ambassador|fellowship|open-source|internship|placement|ai-course|hackathon|other",
      "description": "2-3 sentence description",
      "deadline": "Deadline info string",
      "duration": "Duration string",
      "link": "https://real-url.com",
      "tags": ["Free", "Certificate", "Stipend", "Networking", "Leadership", "Swag", "Open Source", "AI/ML", "Internship"],
      "eligibility": "Who can apply",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"]
    }
  ]
}`;

  try {
    const raw = await getGroqChatCompletion([
      { role: 'system', content: 'You are a student career advisor AI. Return ONLY valid JSON, no markdown.' },
      { role: 'user', content: prompt }
    ], true, 0.7);

    const parsed = JSON.parse(raw);
    const programs = parsed.programs || parsed;

    let insertedCount = 0;
    for (const program of programs) {
      try {
        await ProgramListing.findOneAndUpdate(
          { title: program.title, company: program.company },
          {
            ...program,
            source: 'ai-generated',
            status: 'active',
            addedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        insertedCount++;
      } catch (e) {
        // Duplicate key or validation error — skip
        if (e.code !== 11000) console.warn('[DISCOVERY] Program insert error:', e.message);
      }
    }

    console.log(`[DISCOVERY] ✅ Inserted/updated ${insertedCount} programs`);
    return insertedCount;
  } catch (e) {
    console.error('[DISCOVERY] ❌ Program discovery failed:', e.message);
    return 0;
  }
};

/**
 * Discover new benefits using AI
 */
export const discoverNewBenefits = async () => {
  console.log('[DISCOVERY] 🔍 Discovering new student benefits via AI...');

  const prompt = `You are an AI agent that curates the best FREE student benefits, tools, discounts, internship portals, and AI courses for B.Tech computer science students in India.

Today's date: ${todayStr()}

Generate exactly 5 NEW and CURRENTLY AVAILABLE benefits/resources. Focus on:
- 🤖 Free AI/ML courses from MNCs (Google, Microsoft, Meta, Amazon, NVIDIA, IBM, etc.)
- 💼 Internship & placement portals with active hiring
- 🎁 New student discount programs or free tools
- 💰 Earning opportunities through coding/freelancing
- 📚 Free certification programs

CRITICAL RULES:
1. Only include benefits that are REAL and ACTIVE in ${new Date().getFullYear()}
2. Provide REAL, working URLs
3. Do NOT repeat: GitHub Student Pack, JetBrains, Figma, Azure Students, Notion, Canva, LeetCode, Coursera, freeCodeCamp
4. Include Indian-specific platforms (Coding Ninjas, Scaler, PrepInsta, etc.)

Return a JSON array:
{
  "benefits": [
    {
      "name": "Benefit Name",
      "provider": "Company Name",
      "emoji": "emoji",
      "category": "discounts|coding|ai-courses|internship|placement|earning",
      "description": "2-3 sentence description",
      "value": "Worth/Price string",
      "link": "https://real-url.com",
      "highlights": ["Point 1", "Point 2", "Point 3", "Point 4"]
    }
  ]
}`;

  try {
    const raw = await getGroqChatCompletion([
      { role: 'system', content: 'You are a student career advisor AI. Return ONLY valid JSON, no markdown.' },
      { role: 'user', content: prompt }
    ], true, 0.7);

    const parsed = JSON.parse(raw);
    const benefits = parsed.benefits || parsed;

    let insertedCount = 0;
    for (const benefit of benefits) {
      try {
        await BenefitListing.findOneAndUpdate(
          { name: benefit.name, provider: benefit.provider },
          {
            ...benefit,
            source: 'ai-generated',
            status: 'active',
            addedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        insertedCount++;
      } catch (e) {
        if (e.code !== 11000) console.warn('[DISCOVERY] Benefit insert error:', e.message);
      }
    }

    console.log(`[DISCOVERY] ✅ Inserted/updated ${insertedCount} benefits`);
    return insertedCount;
  } catch (e) {
    console.error('[DISCOVERY] ❌ Benefit discovery failed:', e.message);
    return 0;
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
  const total = (pResult.modifiedCount || 0) + (bResult.modifiedCount || 0);
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
 * Full daily run: seed → expire → discover
 */
export const runDailyDiscovery = async () => {
  console.log('[DISCOVERY] 🚀 Starting daily discovery run...');
  await seedIfEmpty();
  await markExpired();
  await discoverNewPrograms();
  await discoverNewBenefits();
  console.log('[DISCOVERY] ✅ Daily discovery complete');
};
