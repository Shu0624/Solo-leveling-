import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Bot, Video, Route, ArrowRight, CheckCircle2 } from 'lucide-react';

const Landing = () => {
  return (
    <div className="relative overflow-hidden bg-background">
      
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-hero-gradient blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            The Elite Career Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-foreground leading-[1.1]">
            Transform Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Career Trajectory</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Bridge the gap between academics and industry. Build your skills, optimize your resume, and prepare for technical interviews — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row shadow-sm shadow-primary/20 items-center justify-center gap-4 max-w-md mx-auto rounded-3xl p-2 bg-background/50 backdrop-blur-xl border border-border/50">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 flex-grow">
              Start Free Trial <ArrowRight size={18} />
            </Link>
          </div>
          
          <div className="mt-8 flex justify-center gap-6 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="text-success" size={16}/> Instant Access</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="text-success" size={16}/> No Credit Card</div>
          </div>
        </motion.div>
      </section>

      {/* Visual Separation */}
      <div className="relative max-w-7xl mx-auto px-4"><div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div></div>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32" id="features">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">All the tools you need to land top engineering roles, built into a single distraction-free platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {[
            { 
              icon: <GraduationCap size={28} />, 
              title: 'Curated Technical Hub', 
              desc: 'Deep-dive interactive modules focusing on high-signal skills like Java, Python, and full-stack engineering with real-time feedback.',
              color: 'text-primary bg-primary/10 border-primary/20'
            },
            { 
              icon: <Bot size={28} />, 
              title: 'AI Resume Optimization', 
              desc: 'Our resume scoring system evaluates your PDF against live job descriptions, delivering actionable keyword improvement suggestions.',
              color: 'text-accent bg-accent/10 border-accent/20'
            },
            { 
              icon: <Video size={28} />, 
              title: 'Live Technical Rounds', 
              desc: 'P2P WebRTC rooms let you practice system design and coding collaboratively, while our AI bot handles behavioral mocks dynamically.',
              color: 'text-success bg-success/10 border-success/20'
            },
            { 
              icon: <Route size={28} />, 
              title: 'Algorithmic Roadmaps', 
              desc: 'Stop guessing. Get an exact day-by-day study plan personalized to your current skill level and target role.',
              color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
            }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group glass-morphism p-10 rounded-[2.5rem] border border-border/50 hover:border-border transition-colors duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-transform group-hover:scale-110 duration-300 ${feat.color}`}>
                {feat.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">{feat.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-border/50 text-center text-muted-foreground mt-20">
        <p className="font-medium">&copy; {new Date().getFullYear()} LevelUp. Built for engineering students.</p>
      </footer>
    </div>
  );
};

export default Landing;
