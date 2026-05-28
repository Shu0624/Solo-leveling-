import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Play, Award, BookOpen, Clock, AlertCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import CodePlayground from '../components/learning/CodePlayground';
import CourseChat from '../components/learning/CourseChat';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-[#1e1e2e]/80 hover:bg-[#1e1e2e] border border-white/10 text-white/50 hover:text-white transition-all duration-200 shadow-lg"
      title="Copy code"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
};

const ModuleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const [modRes, progRes] = await Promise.all([
          api.get(`/modules/${slug}`),
          api.get('/modules/progress')
        ]);
        setModule(modRes.data.module);
        
        const modProgress = progRes.data.modules?.find(p => p.moduleId === modRes.data.module._id);
        setProgress(modProgress || { completedLessons: [] });

        // Auto-select last uncompleted lesson
        if (modProgress?.completedLessons?.length > 0) {
          const firstUncompleted = modRes.data.module.lessons.findIndex(l => !modProgress.completedLessons.includes(l._id));
          setCurrentLessonIndex(firstUncompleted === -1 ? 0 : firstUncompleted);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        navigate('/modules');
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [slug, navigate, api]);

  const markCompleted = async () => {
    if (markingComplete) return;
    setMarkingComplete(true);
    const lessonId = module.lessons[currentLessonIndex]._id;
    try {
      await api.post(`/modules/${slug}/lessons/${lessonId}/complete`);
      setProgress(prev => ({
        ...prev,
        completedLessons: [...(prev.completedLessons || []), lessonId]
      }));
      // Auto advance
      if (currentLessonIndex < module.lessons.length - 1) {
        setTimeout(() => setCurrentLessonIndex(c => c + 1), 600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-100px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!module) return null;

  const currentLesson = module.lessons[currentLessonIndex];
  const isCompleted = progress.completedLessons?.includes(currentLesson._id);
  const allCompleted = module.lessons.every(l => progress.completedLessons?.includes(l._id));


  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col md:flex-row max-w-[1600px] mx-auto animate-fade-in bg-background">
      
      {/* Sidebar Focus Track */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border shrink-0 bg-background/50 md:sticky md:top-24 md:h-[calc(100vh-120px)] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <Link to="/modules" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
            <ChevronLeft size={16} /> Back to Hub
          </Link>
          <h2 className="text-xl font-bold leading-tight mb-2 text-foreground">{module.title}</h2>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-primary h-full transition-all duration-1000 ease-out" 
              style={{ width: `${(progress.completedLessons?.length / module.lessons.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
            <span>Progress</span>
            <span>{Math.round((progress.completedLessons?.length / module.lessons.length) * 100)}%</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {module.lessons.map((lesson, idx) => {
            const completed = progress.completedLessons?.includes(lesson._id);
            const active = currentLessonIndex === idx;
            
            return (
              <button 
                key={lesson._id}
                onClick={() => setCurrentLessonIndex(idx)}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all duration-200 ${
                  active 
                    ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary/50'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {completed ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : active ? (
                    <Play size={18} fill="currentColor" stroke="none" className="text-primary"/>
                  ) : (
                    <Circle size={18} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className={`text-sm truncate ${active ? 'text-foreground font-semibold' : ''}`}>
                    {idx + 1}. {lesson.title}
                  </div>
                  <div className="text-[10px] mt-1 flex items-center gap-1 opacity-70">
                    <Clock size={10} /> {lesson.duration} min
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Challenge Action */}
        <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Award className={allCompleted ? 'text-warning' : 'text-muted-foreground'} size={18}/>
              Final Challenge
            </div>
            <Link 
              to={`/quiz/${module.slug}`}
              className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${
                allCompleted 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90' 
                  : 'bg-secondary text-muted-foreground pointer-events-none opacity-50'
              }`}
            >
              {allCompleted ? 'Take Module Quiz' : 'Complete lessons first'}
            </Link>
          </div>
        </div>
      </div>

      {/* Notion-style Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full md:w-auto relative scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 md:py-16">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLesson._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 text-primary font-medium text-sm mb-6">
                 <BookOpen size={16} /> Lesson {currentLessonIndex + 1}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8 leading-tight">
                {currentLesson.title}
              </h1>

              <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:border prose-pre:border-border/50 font-sans">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold mt-12 mb-6 tracking-tight text-foreground" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-5 text-foreground" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-8 mb-4 text-foreground" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-base leading-relaxed text-muted-foreground" {...props} />,
                    ul: ({node, ...props}) => <ul className="ml-6 mb-2 list-disc list-outside text-muted-foreground" {...props} />,
                    li: ({node, ...props}) => <li className="mb-2" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-6 bg-primary/5 italic text-muted-foreground rounded-r-lg" {...props} />,
                    code({node, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');

                      if (match) {
                        return (
                          <div className="relative group my-6">
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <CopyButton text={codeString} />
                            </div>
                            <code className="bg-secondary text-secondary-foreground font-mono text-sm p-4 pr-12 rounded-xl overflow-x-auto shadow-inner border border-border/50 block" {...props}>
                              {children}
                            </code>
                          </div>
                        );
                      }

                      return (
                        <code className="bg-secondary/50 text-foreground font-mono text-sm px-1.5 py-0.5 rounded-md" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {currentLesson.content}
                </ReactMarkdown>
              </div>

              {/* Code Playground */}
              <CodePlayground />

              {/* Action Bar */}
              <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  onClick={() => setCurrentLessonIndex(c => Math.max(0, c - 1))}
                  disabled={currentLessonIndex === 0}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-foreground bg-secondary hover:bg-secondary/80 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  {!isCompleted ? (
                    <button 
                      onClick={markCompleted}
                      disabled={markingComplete}
                      className="w-full sm:w-auto flex flex-1 items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-success text-success-foreground shadow-lg shadow-success/20 hover:opacity-90 transition-all"
                    >
                      <CheckCircle2 size={18} /> {markingComplete ? 'Marking...' : 'Mark as Complete'}
                    </button>
                  ) : (
                    currentLessonIndex < module.lessons.length - 1 ? (
                      <button 
                        onClick={() => setCurrentLessonIndex(c => c + 1)}
                        className="w-full sm:w-auto flex flex-1 items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                      >
                        Next Lesson <ChevronRight size={18} />
                      </button>
                    ) : (
                      <div className="px-6 py-3 rounded-xl font-medium text-sm bg-success/10 text-success flex items-center gap-2 border border-success/20">
                        <CheckCircle2 size={18} /> You've finished this module!
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* Course Group Discussion Chat */}
      <CourseChat 
        slug={slug} 
        moduleTitle={module.title}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.content}
      />
    </div>
  );
};

export default ModuleDetail;
