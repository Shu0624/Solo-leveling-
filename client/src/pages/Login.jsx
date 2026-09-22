import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button, Input } from '../components/ui';

// ═══════════════════════════════════════════════════════════════
// Login — a title page and a form, on paper.
//
// Two columns on desktop: the left is a standing colophon, the right
// is the form. On mobile the colophon drops away entirely rather than
// stacking above the form and pushing it below the fold.
// ═══════════════════════════════════════════════════════════════

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const handleDemoLogin = (role) => {
    if (demoLogin) {
      demoLogin(role);
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1fr_minmax(420px,44%)]">

      {/* ─── Colophon (desktop only) ─── */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-border px-12 py-10 bg-elevated/40">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight text-foreground no-underline">
          LevelUp
        </Link>

        <div className="max-w-measure">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-5">
            Academic & Career Management
          </p>
          <p className="font-display text-[30px] leading-[1.25] text-foreground">
            Every academic milestone, attendance record and career credential,
            <span className="italic text-[hsl(var(--primary-accent))]"> unified in one platform.</span>
          </p>
        </div>

        <p className="text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} LevelUp
        </p>
      </aside>

      {/* ─── Form ─── */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          <Link
            to="/"
            className="lg:hidden inline-block font-display text-lg font-semibold tracking-tight text-foreground no-underline mb-10"
          >
            LevelUp
          </Link>

          <h1 className="font-display text-[30px] font-semibold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your college or university credentials.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 px-3.5 py-3 rounded-md border border-destructive/40 bg-destructive/5 text-[13px] text-destructive leading-relaxed"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={15} />}
              placeholder="you@college.edu"
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={15} />}
                placeholder="••••••••"
                required
              />
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                Forgotten password? Contact your department administrator.
              </p>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Sign in
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </form>

          {/* 1-Click Demo Login */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Look around first
              </span>
              <span className="text-[11px] text-muted-foreground/70">Sample cohort, instant access</span>
            </div>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-elevated/40">
              {[
                { role: 'student', title: 'Student', detail: 'Alex Chen (Third year, CSE-3A)' },
                { role: 'faculty', title: 'Teaching Faculty', detail: 'Dr. Jenkins (Two classes, attendance)' },
                { role: 'hod', title: 'Head of Department', detail: 'Dr. Kulkarni (Full CSE & workbooks)' },
                { role: 'principal', title: 'Principal', detail: 'Dr. Sundaram (College-wide metrics)' },
              ].map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleDemoLogin(d.role)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground"
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

          <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
