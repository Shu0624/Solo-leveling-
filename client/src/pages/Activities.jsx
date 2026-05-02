import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, ExternalLink, Calendar, Search,
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Clock, Zap, BrainCircuit, Briefcase, GraduationCap,
  Award, Code2, Users, Star, AlertCircle, CheckCircle2
} from 'lucide-react';

// =====================================================================
// STATIC FALLBACK — Used if API fails or DB is empty
// =====================================================================
const FALLBACK_PROGRAMS = [
  { id: 'f1', title: 'Google Student Developer Club Lead', company: 'Google', logo: '🟢', color: '#4285f4', category: 'ambassador', description: 'Lead a university-based community of developers. Get training, mentorship, and swag from Google.', deadline: 'Applications open annually (Aug–Sep)', duration: '1 Academic Year', link: 'https://developers.google.com/community/gdsc', tags: ['Free', 'Certificate', 'Networking', 'Leadership'], eligibility: 'Enrolled university students passionate about technology', benefits: ['Google swag & resources', 'Direct mentorship from Google', 'Global community access', 'Conference invites'], source: 'verified' },
  { id: 'f2', title: 'Microsoft Learn Student Ambassador', company: 'Microsoft', logo: '🔵', color: '#00a4ef', category: 'ambassador', description: 'Amplify your impact by volunteering as a Microsoft Learn Student Ambassador.', deadline: 'Rolling applications', duration: 'Ongoing', link: 'https://mvp.microsoft.com/studentambassadors', tags: ['Free', 'Certificate', 'Stipend', 'Swag'], eligibility: 'Enrolled in accredited higher education institution', benefits: ['Free Azure credits ($150/mo)', 'LinkedIn Premium', 'Visual Studio Enterprise', 'Conference tickets'], source: 'verified' },
  { id: 'f3', title: 'Google Summer of Code (GSoC)', company: 'Google', logo: '☀️', color: '#4285f4', category: 'open-source', description: 'Get paid to contribute to open source projects during summer.', deadline: 'March annually', duration: '10–22 weeks', link: 'https://summerofcode.withgoogle.com/', tags: ['Stipend', 'Certificate', 'Open Source'], eligibility: 'Open to anyone 18+', benefits: ['$1500–$6600 stipend', 'Mentorship from experts', 'Google certificate', 'Global recognition'], source: 'verified' },
  { id: 'f4', title: 'MLH Fellowship', company: 'Major League Hacking', logo: '🏆', color: '#e73427', category: 'fellowship', description: 'A 12-week internship alternative — contribute to open source and build portfolio projects.', deadline: 'Multiple cohorts', duration: '12 weeks', link: 'https://fellowship.mlh.io/', tags: ['Stipend', 'Certificate', 'Open Source', 'Networking'], eligibility: '18+ enrolled or recently graduated', benefits: ['$5,000 stipend', 'Portfolio projects', 'Career coaching', 'Alumni network'], source: 'verified' },
  { id: 'f5', title: 'Amazon ML Summer School', company: 'Amazon', logo: '🟠', color: '#ff9900', category: 'ai-course', description: 'Free virtual ML program by Amazon scientists covering deep learning, NLP, CV, and more.', deadline: 'Apr–May annually', duration: '4 weeks', link: 'https://amazonmlsummerschool.com/', tags: ['Free', 'Certificate', 'AI/ML'], eligibility: 'Engineering students from recognized institutions', benefits: ['Free ML training', 'Amazon certificate', 'Taught by Amazon scientists', 'Priority for Amazon roles'], source: 'verified' },
];

const TAG_COLORS = {
  'Free': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Certificate': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Stipend': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Networking': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Leadership': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Swag': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Open Source': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'AI/ML': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Internship': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const CATEGORY_META = {
  'all': { label: 'All Programs', icon: Globe, color: '#6366f1' },
  'ambassador': { label: 'Ambassador', icon: Users, color: '#4285f4' },
  'fellowship': { label: 'Fellowship', icon: Award, color: '#e73427' },
  'open-source': { label: 'Open Source', icon: Code2, color: '#f97316' },
  'internship': { label: 'Internship', icon: Briefcase, color: '#22c55e' },
  'placement': { label: 'Placement', icon: Star, color: '#8b5cf6' },
  'ai-course': { label: 'AI / ML Courses', icon: BrainCircuit, color: '#06b6d4' },
  'hackathon': { label: 'Hackathon', icon: Zap, color: '#f59e0b' },
  'other': { label: 'Other', icon: Sparkles, color: '#64748b' },
};

const Activities = () => {
  const { api } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [expiredPrograms, setExpiredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [showExpired, setShowExpired] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/discover/programs');
      setPrograms(res.data.active || []);
      setExpiredPrograms(res.data.expired || []);
      setLastUpdated(res.data.lastUpdated);
    } catch (e) {
      console.error('Failed to fetch programs, using fallback:', e);
      setPrograms(FALLBACK_PROGRAMS);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/discover/refresh');
      await fetchPrograms();
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const allTags = ['All', ...new Set(programs.flatMap(p => p.tags || []))];
  const categories = Object.keys(CATEGORY_META);

  const filtered = programs.filter(p => {
    const matchSearch = !search || 
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchTag = activeTag === 'All' || (p.tags || []).includes(activeTag);
    return matchSearch && matchCategory && matchTag;
  });

  const filteredExpired = expiredPrograms.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchCategory;
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Globe className="text-primary animate-pulse mx-auto mb-4" size={48} />
          <p className="text-muted-foreground font-medium">Discovering programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in relative">
      {/* BG blur */}
      <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="mb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Programs & Opportunities
        </h1>
        <p className="text-muted-foreground text-base mb-4">
          Ambassador programs, internships, fellowships, free courses, and placement opportunities for engineering students.
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
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
            {programs.length} active
          </span>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {categories.map(catKey => {
          const meta = CATEGORY_META[catKey];
          const Icon = meta.icon;
          const count = catKey === 'all' ? programs.length : programs.filter(p => p.category === catKey).length;
          if (catKey !== 'all' && count === 0) return null;
          return (
            <button
              key={catKey}
              onClick={() => { setActiveCategory(catKey); setExpandedId(null); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                activeCategory === catKey
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary/60'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{meta.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search & Tag Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs, companies, keywords..."
            className="w-full pl-12 pr-5 py-3.5 bg-secondary/30 border border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border uppercase tracking-wider ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground border-primary'
                  : TAG_COLORS[tag] || 'bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((program, i) => (
            <motion.div
              key={program._id || program.id || i}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="glass-morphism group hover:scale-[1.01] transition-transform cursor-pointer relative overflow-hidden"
              onClick={() => setExpandedId(expandedId === (program._id || i) ? null : (program._id || i))}
            >
              {/* Card Content */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0"
                      style={{ backgroundColor: `${program.color || '#6366f1'}15` }}
                    >
                      {program.logo || '🏢'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{program.company}</p>
                        {program.isNew && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                            <Sparkles size={8} /> New
                          </span>
                        )}
                        {program.isExpiringSoon && !program.isNew && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
                            <AlertCircle size={8} /> Expiring Soon
                          </span>
                        )}

                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug">{program.title}</h3>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {program.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(program.tags || []).map(tag => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${TAG_COLORS[tag] || 'bg-secondary text-muted-foreground border-border/50'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {program.deadline}</span>
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {expandedId === (program._id || i) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-border/30 space-y-4">
                      {program.duration && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-sm text-foreground">{program.duration}</p>
                        </div>
                      )}
                      {program.eligibility && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Eligibility</p>
                          <p className="text-sm text-foreground">{program.eligibility}</p>
                        </div>
                      )}
                      {program.benefits && program.benefits.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Benefits</p>
                          <div className="grid grid-cols-2 gap-2">
                            {program.benefits.map((b, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm text-foreground">
                                <Sparkles size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {program.link && (
                        <a
                          href={program.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-2"
                        >
                          <ExternalLink size={16} /> Apply / Learn More
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Globe size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium">No programs match your search.</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Expired / Previous Programs */}
      {filteredExpired.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="w-full glass-morphism p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <Clock size={18} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground text-sm">Previous Programs</h3>
                <p className="text-xs text-muted-foreground">{filteredExpired.length} expired or past deadline programs</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 opacity-60">
                  {filteredExpired.map((program, i) => (
                    <div key={program._id || `exp-${i}`} className="glass-morphism p-5 relative">
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                        Expired
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${program.color || '#6366f1'}10` }}
                        >
                          {program.logo || '🏢'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{program.company}</p>
                          <h4 className="text-sm font-bold text-foreground">{program.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{program.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center text-sm text-muted-foreground"
      >
        <p className="flex items-center justify-center gap-2">
          <Globe size={14} className="text-primary" />
          Showing {filtered.length} of {programs.length} active programs · Updated daily
        </p>
      </motion.div>
    </div>
  );
};

export default Activities;
