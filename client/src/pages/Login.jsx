import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const handleDemoLogin = (role) => {
    demoLogin(role);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      // Let animation play before redirecting
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden noise-overlay" style={{ background: '#050505', color: '#fff' }}>
      {/* ─── Gradient Mesh Background ─── */}
      <div className="absolute inset-0 h-[1200px] z-0 overflow-hidden pointer-events-none">
        <div className="gradient-mesh" />
      </div>




      {/* ─── Login Form Container ─── */}
      <div className="flex-1 flex items-center justify-center py-12">

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-morphism rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-6 no-underline">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-glow">L</div>
              <span className="font-display text-lg font-bold tracking-tight text-foreground">LevelUp</span>
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-display text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to continue your career preparation.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-foreground">Password</label>
                <span className="text-xs text-muted-foreground/50 cursor-default" title="Contact your administrator to reset your password">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-4">
              Sign In <ArrowRight size={18} />
            </Button>
          </form>

          {/* Look around without an account. Sample data only — see middleware/auth.js */}
          <div className="mt-6 pt-5 border-t border-border/40">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Look around first
              </span>
              <span className="text-[11px] text-muted-foreground/70">Sample data, read only</span>
            </div>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {[
                { role: 'student', title: 'Student', detail: 'Third year, CSE-3A' },
                { role: 'faculty', title: 'Teaching faculty', detail: 'Two classes, marks and attendance' },
                { role: 'hod', title: 'Head of department', detail: 'Full CSE register and workbook tools' },
              ].map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleDemoLogin(d.role)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium text-foreground">{d.title}</span>
                    <span className="block text-[11px] text-muted-foreground">{d.detail}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border/50 pt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Login;
