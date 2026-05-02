import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ExternalLink, ChevronDown, ChevronUp,
  GraduationCap, Code2, Laptop, Wallet, Mail,
  Sparkles, CheckCircle2, RefreshCw, Clock,
  BrainCircuit, Briefcase, Star, AlertCircle, Globe
} from 'lucide-react';

// =====================================================================
// STATIC FALLBACK
// =====================================================================
const FALLBACK_SECTIONS = {
  discounts: [
    { name: 'GitHub Student Developer Pack', provider: 'GitHub', emoji: '🐙', description: 'Get 100+ free developer tools.', value: 'Worth $200K+ in tools', link: 'https://education.github.com/pack', highlights: ['Free .me domain', 'Azure $100 credits', 'JetBrains IDEs', 'Canva Pro'] },
    { name: 'JetBrains All Products Pack', provider: 'JetBrains', emoji: '🧠', description: 'Full access to all JetBrains professional IDEs.', value: 'Free (normally ₹50K+/year)', link: 'https://www.jetbrains.com/community/education/', highlights: ['IntelliJ IDEA Ultimate', 'PyCharm Professional', 'WebStorm', 'DataGrip'] },
    { name: 'Figma Education', provider: 'Figma', emoji: '🎨', description: 'Full Figma Professional plan free for students.', value: 'Free (normally $12/mo)', link: 'https://www.figma.com/education/', highlights: ['Unlimited files', 'Professional features', 'Team collaboration', 'Dev mode'] },
  ],
  coding: [
    { name: 'LeetCode Premium', provider: 'LeetCode', emoji: '💻', description: 'Premium access to 3000+ problems.', value: 'Student pricing', link: 'https://leetcode.com/subscribe/', highlights: ['Company-wise problems', 'Video solutions', 'Mock interviews'] },
    { name: 'freeCodeCamp', provider: 'freeCodeCamp', emoji: '🏕️', description: 'Completely free, full-stack curriculum with certs.', value: 'Free', link: 'https://www.freecodecamp.org/', highlights: ['10+ free certs', 'Full-stack', 'Active community'] },
  ],
  'ai-courses': [
    { name: 'Google AI Essentials', provider: 'Google', emoji: '🤖', description: 'Free Google course on AI fundamentals.', value: 'Free', link: 'https://www.coursera.org/learn/google-ai-essentials', highlights: ['Google certificate', 'Prompt engineering', 'AI for productivity'] },
    { name: 'AWS ML University', provider: 'Amazon', emoji: '🟠', description: 'Free ML courses from Amazon\'s internal training.', value: 'Free', link: 'https://aws.amazon.com/machine-learning/mlu/', highlights: ['Amazon internal training', 'Hands-on notebooks', 'NLP & CV tracks'] },
  ],
};

const SECTION_META = [
  { key: 'discounts', title: 'Student Discounts & Free Tools', icon: Gift, color: '#6366f1', desc: 'Free premium tools with your student email.' },
  { key: 'ai-courses', title: 'Free AI & ML Courses', icon: BrainCircuit, color: '#06b6d4', desc: 'Learn AI/ML from Google, Microsoft, Amazon, NVIDIA & more — completely free.' },
  { key: 'internship', title: 'Internship Portals', icon: Briefcase, color: '#22c55e', desc: 'Find paid internships with PPO opportunities at top companies.' },
  { key: 'placement', title: 'Placement & Hiring Platforms', icon: Star, color: '#8b5cf6', desc: 'Direct hire challenges, job boards, and referral platforms.' },
  { key: 'coding', title: 'Coding Platform Deals', icon: Code2, color: '#f59e0b', desc: 'Maximize your DSA prep while minimizing costs.' },
  { key: 'earning', title: 'Student Earning Opportunities', icon: Wallet, color: '#f43f5e', desc: 'Start earning while in college — no degree required.' },
  { key: 'laptops', title: 'Best Laptops for Students', icon: Laptop, color: '#8b5cf6', desc: 'Curated picks by budget and use case.' },
  { key: 'email', title: 'How to Get a Student Email', icon: Mail, color: '#22c55e', desc: 'Your gateway to all student benefits.' },
];

const Benefits = () => {
  const { api } = useAuth();
  const [openSection, setOpenSection] = useState('discounts');
  const [expandedItem, setExpandedItem] = useState(null);
  const [benefits, setBenefits] = useState({});
  const [expiredBenefits, setExpiredBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    try {
      const res = await api.get('/discover/benefits');
      setBenefits(res.data.grouped || {});
      setExpiredBenefits(res.data.expired || []);
      setLastUpdated(res.data.lastUpdated);
    } catch (e) {
      console.error('Failed to fetch benefits, using fallback:', e);
      setBenefits(FALLBACK_SECTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/discover/refresh');
      await fetchBenefits();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter sections that actually have data
  const availableSections = SECTION_META.filter(s => {
    const items = benefits[s.key];
    return items && items.length > 0;
  });

  // Also include sections without API data but that exist in SECTION_META (for static fallback categories)
  const currentItems = benefits[openSection] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Gift className="text-primary animate-pulse mx-auto mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Loading benefits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      {/* BG */}
      <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="mb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Student Discounts, Free Courses & Opportunities
        </h1>
        <p className="text-muted-foreground text-base mb-4">
          Free tools, internship portals, placement platforms, courses, and earning guides — curated for engineering students.
        </p>

        {/* Last Updated + Refresh */}
        <div className="flex items-center justify-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} /> Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {SECTION_META.map(section => {
          const Icon = section.icon;
          const count = (benefits[section.key] || []).length;
          return (
            <button
              key={section.key}
              onClick={() => { setOpenSection(section.key); setExpandedItem(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                openSection === section.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 border-border/50'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{section.title.split('(')[0].split('&')[0].trim()}</span>
              <span className="sm:hidden">{section.title.split(' ').slice(0, 2).join(' ')}</span>
              {count > 0 && (
                <span className={`text-[10px] ml-0.5 ${openSection === section.key ? 'opacity-70' : 'opacity-50'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      {SECTION_META.filter(s => s.key === openSection).map(section => {
        const Icon = section.icon;
        const items = currentItems;

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Section Header */}
            <div className="glass-morphism p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${section.color}15`, color: section.color }}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.desc}</p>
                </div>
              </div>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-lg font-bold">
                  {items.length} items
                </span>
              )}
            </div>

            {/* Items */}
            {items.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {items.map((item, i) => (
                  <motion.div
                    key={item._id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass-morphism overflow-hidden relative"
                  >
                    <button
                      onClick={() => setExpandedItem(expandedItem === `${section.key}-${i}` ? null : `${section.key}-${i}`)}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl shrink-0">{item.emoji}</span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-foreground text-sm">{item.name}</h3>
                            {item.isNew && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                <Sparkles size={8} /> New
                              </span>
                            )}

                          </div>
                          {item.provider && (
                            <p className="text-xs text-muted-foreground">{item.provider}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.value && (
                          <span className="hidden sm:block px-3 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20 whitespace-nowrap">
                            {item.value}
                          </span>
                        )}
                        {expandedItem === `${section.key}-${i}` ? (
                          <ChevronUp size={18} className="text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedItem === `${section.key}-${i}` && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-border/30 space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>

                            {item.highlights && item.highlights.length > 0 && (
                              <div className="space-y-2">
                                {item.highlights.map((h, j) => (
                                  <div key={j} className="flex items-start gap-2 text-sm text-foreground">
                                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                    <span>{h}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                              >
                                <ExternalLink size={14} /> Visit Website
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-morphism p-10 text-center">
                <Globe size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground font-medium">No items in this category yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Refresh" to discover new benefits.</p>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Expired / Previous */}
      {expiredBenefits.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="w-full glass-morphism p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Clock size={18} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">Previous Benefits</h3>
                <p className="text-xs text-muted-foreground">{expiredBenefits.length} expired or discontinued benefits</p>
              </div>
            </div>
            {showExpired ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showExpired && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 opacity-60">
                  {expiredBenefits.map((item, i) => (
                    <div key={item._id || `exp-${i}`} className="glass-morphism p-4 relative">
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                        Expired
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{item.emoji}</span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                          {item.provider && <p className="text-[10px] text-muted-foreground">{item.provider}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center text-sm text-muted-foreground"
      >
        <p className="flex items-center justify-center gap-2">
          <Gift size={14} className="text-primary" />
          New benefits and tools added regularly · Verified items marked with ✓
        </p>
      </motion.div>
    </div>
  );
};

export default Benefits;
