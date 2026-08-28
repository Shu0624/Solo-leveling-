import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayCircle, Award, BookOpen, Clock, BrainCircuit, Code2, Coffee, Calculator, Activity, Search, Filter } from 'lucide-react';
import ProgressRing from '../components/dashboard/ProgressRing';

const FALLBACK_MODULES = [
  {
    _id: 'mod_java_01',
    title: 'Core Java & OOP Architecture',
    slug: 'core-java-oop',
    description: 'Master classes, interfaces, inheritance, multithreading, and JVM internals for technical product rounds.',
    category: 'programming',
    difficulty: 'intermediate',
    icon: '☕',
    lessons: [{ title: 'JVM Architecture', duration: 15 }, { title: 'OOP Principles', duration: 20 }, { title: 'Collections & Streams', duration: 25 }]
  },
  {
    _id: 'mod_python_01',
    title: 'Python for Production & Data Structures',
    slug: 'python-data-structures',
    description: 'From memory profiling to generators, decorators, and high-throughput Python patterns.',
    category: 'programming',
    difficulty: 'beginner',
    icon: '🐍',
    lessons: [{ title: 'Python Memory Model', duration: 15 }, { title: 'Built-in Data Structures', duration: 20 }, { title: 'Iterators & Decorators', duration: 20 }]
  },
  {
    _id: 'mod_genai_01',
    title: 'Generative AI & LLM Systems Engineering',
    slug: 'genai-llm-engineering',
    description: 'Architect production GenAI applications using RAG, vector embeddings, and prompt optimizations.',
    category: 'ai',
    difficulty: 'advanced',
    icon: '🤖',
    lessons: [{ title: 'Transformer Architecture', duration: 25 }, { title: 'Vector DBs & RAG', duration: 30 }, { title: 'Agentic Workflows', duration: 35 }]
  },
  {
    _id: 'mod_apt_01',
    title: 'Quantitative & Logical Problem Solving',
    slug: 'quantitative-aptitude',
    description: 'Deconstruct complex placement puzzles, probability models, series reasoning, and rapid mental math.',
    category: 'programming',
    difficulty: 'intermediate',
    icon: '🧮',
    lessons: [{ title: 'Combinatorics & Probability', duration: 20 }, { title: 'Time, Speed & Distance', duration: 20 }, { title: 'Data Sufficiency', duration: 20 }]
  }
];

const iconMap = {
  '☕': <Coffee size={24} />,
  '🐍': <Code2 size={24} />,
  '🤖': <BrainCircuit size={24} />,
  '🧮': <Calculator size={24} />
};

const Modules = () => {
  const { api } = useAuth();
  const [modules, setModules] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const [modRes, progRes] = await Promise.all([
          api.get('/modules').catch(() => ({ data: [] })),
          api.get('/modules/progress').catch(() => ({ data: { modules: [] } }))
        ]);
        const list = (modRes.data && modRes.data.length > 0) ? modRes.data : FALLBACK_MODULES;
        setModules(list);
        setProgressData(progRes.data?.modules || []);
      } catch (err) {
        console.warn('Using fallback modules:', err.message);
        setModules(FALLBACK_MODULES);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [api]);

  const getProgress = (moduleId) => {
    const p = progressData.find(p => p.moduleId === moduleId);
    if (!p) return 0;
    const mod = modules.find(m => m._id === moduleId);
    if (!mod || mod.lessons.length === 0) return 0;
    return Math.round((p.completedLessons.length / mod.lessons.length) * 100);
  };

  const getQuizScore = (moduleId) => {
    const p = progressData.find(p => p.moduleId === moduleId);
    if (!p || !p.quizScores || p.quizScores.length === 0) return null;
    return Math.max(...p.quizScores); // Best score
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || m.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Activity className="animate-pulse mb-4 text-primary" size={48} />
        <p className="animate-pulse font-medium">Loading learning hub...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-foreground">Learning Hub</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">Master technical concepts with our curated modules. Track your progress, complete lessons, and pass quizzes to earn badges.</p>
      </header>

      {/* Filter and Search Bar */}
      <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between glass-morphism p-4 rounded-2xl border border-border">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search modules..." 
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:flex-none flex items-center bg-background border border-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50">
             <Filter size={16} className="text-muted-foreground mr-2" />
             <select 
               className="bg-transparent border-none outline-none text-sm text-foreground w-full appearance-none cursor-pointer"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
             >
               <option value="all">All Categories</option>
               <option value="programming">Programming</option>
               <option value="ai">AI / GenAI</option>
             </select>
          </div>

          <div className="relative flex-1 md:flex-none flex items-center bg-background border border-border rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50">
             <select 
               className="bg-transparent border-none outline-none text-sm text-foreground w-full appearance-none cursor-pointer"
               value={difficultyFilter}
               onChange={(e) => setDifficultyFilter(e.target.value)}
             >
               <option value="all">Any Difficulty</option>
               <option value="beginner">Beginner</option>
               <option value="intermediate">Intermediate</option>
               <option value="advanced">Advanced</option>
             </select>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {filteredModules.length === 0 ? (
          <div className="col-span-full py-12 text-center">
             <p className="text-muted-foreground mb-4">No modules match your filters.</p>
             <button 
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDifficultyFilter('all'); }}
                className="btn btn-outline"
             >
                Clear Filters
             </button>
          </div>
        ) : filteredModules.map((module) => {
          const progress = getProgress(module._id);
          const score = getQuizScore(module._id);
          const totalDuration = module.lessons.reduce((acc, l) => acc + (l.duration || 10), 0);

          return (
            <motion.div 
              key={module._id}
              variants={itemVariants}
              className="group glass-morphism rounded-3xl p-6 relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 shadow-lg hover:shadow-primary/10"
            >
              {/* Top Section */}
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 rounded-2xl transition-transform duration-500 ease-out origin-center"></div>
                  <span className="relative z-10">{iconMap[module.icon] || <BookOpen size={24} />}</span>
                </div>
                {progress > 0 && <ProgressRing progress={progress} color={progress === 100 ? "hsl(var(--success))" : "hsl(var(--primary))"} />}
              </div>

              {/* Content Information */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground`}>
                    {module.category}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border
                    ${module.difficulty === 'beginner' ? 'bg-success/10 text-success border-success/20' : 
                      module.difficulty === 'intermediate' ? 'bg-warning/10 text-warning border-warning/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20'}
                  `}>
                    {module.difficulty}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 leading-tight text-foreground group-hover:text-primary transition-colors">{module.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{module.description}</p>
              </div>

              {/* Meta stats */}
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5"><BookOpen size={14} className="text-foreground/50"/> {module.lessons.length} Lessons</div>
                <div className="flex items-center gap-1.5"><Clock size={14} className="text-foreground/50"/> {totalDuration}m</div>
              </div>

              {/* Footer / CTA */}
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                {score !== null ? (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quiz Score</span>
                    <div className="flex items-center gap-1.5 font-bold text-lg" style={{ color: score >= 70 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                      <Award size={18} /> {score}%
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                    <span className="font-semibold text-sm text-foreground">{progress > 0 ? 'In Progress' : 'Not Started'}</span>
                  </div>
                )}
                
                <Link 
                  to={`/modules/${module.slug}`}
                  className="w-12 h-12 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors duration-300"
                >
                  <PlayCircle size={22} className={progress > 0 ? "" : "ml-1"} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Modules;
