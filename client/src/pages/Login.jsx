import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    <div className="relative min-h-[calc(100vh-100px)] flex items-center justify-center overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-morphism rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h1>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium shadow-lg shadow-primary/25 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
