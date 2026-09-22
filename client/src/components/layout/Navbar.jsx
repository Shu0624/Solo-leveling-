import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LogOut, Home, BookOpen, FileText, Video, Rocket, Sun, Moon,
  ShieldCheck, Globe, Gift, ClipboardList, User, Menu, X, Building,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui';
import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// Navbar — the running head of the document.
//
// It sits flush against the top rule rather than floating as a
// rounded pill, and the active section is marked by an underline the
// way a masthead marks the current section. Icon-only controls go
// through IconButton, which requires an accessible label.
// ═══════════════════════════════════════════════════════════════

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);
  const openerRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // A drawer that traps nothing and cannot be dismissed by keyboard is a
  // keyboard trap in practice. Escape closes it and focus returns to the
  // control that opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        openerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const displayId = user?.enrollmentId || user?.employeeId || '';
  const roleBadge = user?.role === 'student' ? 'Student'
    : user?.role === 'faculty' ? 'Faculty'
    : user?.role === 'hod' ? 'HOD'
    : user?.role === 'principal' ? 'Principal'
    : user?.role === 'placement' ? 'Placement'
    : 'User';

  const navItems = [
    { path: '/dashboard', icon: <Home size={16} />, label: 'Dashboard' },
    { path: '/modules', icon: <BookOpen size={16} />, label: 'Learn' },
    { path: '/resume', icon: <FileText size={16} />, label: 'Resume' },
    { path: '/interview', icon: <Video size={16} />, label: 'Interview' },
    { path: '/assessment', icon: <ClipboardList size={16} />, label: 'Assessment' },
    { path: '/syllabus', icon: <GraduationCap size={16} />, label: 'Syllabus' },
    { path: '/roadmap', icon: <Rocket size={16} />, label: 'Roadmap' },
    { path: '/activities', icon: <Globe size={16} />, label: 'Programs' },
    { path: '/benefits', icon: <Gift size={16} />, label: 'Benefits' },
    ...(['faculty', 'hod', 'principal', 'placement', 'admin'].includes(user?.role)
      ? [
          { path: '/hod', icon: <Building size={16} />, label: 'Department' },
          { path: '/admin', icon: <ShieldCheck size={16} />, label: 'Admin' }
        ]
      : []
    )
  ];

  const bottomTabs = [
    { path: '/dashboard', icon: <Home size={19} />, label: 'Home' },
    { path: '/modules', icon: <BookOpen size={19} />, label: 'Learn' },
    { path: '/assessment', icon: <ClipboardList size={19} />, label: 'Assess' },
    { path: '/resume', icon: <FileText size={19} />, label: 'Resume' },
    { path: '/profile', icon: <User size={19} />, label: 'Profile' },
  ];

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  // Landing and auth pages carry their own masthead.
  if (['/', '/login', '/register'].includes(location.pathname)) return null;

  return (
    <>
      {/* ─── Running head ─── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">

            {/* Wordmark */}
            <Link
              to={user ? '/dashboard' : '/'}
              className="flex items-baseline gap-2 no-underline shrink-0"
            >
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                LevelUp
              </span>
            </Link>

            {/* Sections — underline marks the current one */}
            {user && (
              <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-1.5 px-2.5 h-14 text-[13px] font-medium transition-colors',
                      'after:absolute after:left-2.5 after:right-2.5 after:bottom-0 after:h-[2px] after:transition-colors',
                      isActive(item.path)
                        ? 'text-foreground after:bg-[hsl(var(--primary-accent))]'
                        : 'text-muted-foreground hover:text-foreground after:bg-transparent'
                    )}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="hidden xl:block">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Controls */}
            {user ? (
              <div className="flex items-center gap-1 shrink-0">
                <IconButton
                  label={`Switch to ${nextTheme} theme`}
                  size="sm"
                  onClick={() => setTheme(nextTheme)}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </IconButton>

                <div className="hidden md:flex items-center gap-1 border-l border-border pl-2 ml-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-md hover:bg-secondary transition-colors"
                  >
                    <span
                      className="w-7 h-7 rounded-md bg-secondary border border-border flex items-center justify-center text-[11px] font-semibold text-foreground"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[13px] font-medium text-foreground">
                        {user.name?.split(' ')[0]}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {displayId || roleBadge}
                      </span>
                    </span>
                  </Link>

                  <IconButton
                    label="Sign out"
                    size="sm"
                    onClick={logout}
                    className="hover:text-destructive"
                  >
                    <LogOut size={16} />
                  </IconButton>
                </div>

                <IconButton
                  ref={openerRef}
                  label={mobileOpen ? 'Close menu' : 'Open menu'}
                  size="sm"
                  className="lg:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-drawer"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X size={19} /> : <Menu size={19} />}
                </IconButton>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <IconButton
                  label={`Switch to ${nextTheme} theme`}
                  size="sm"
                  onClick={() => setTheme(nextTheme)}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </IconButton>
                <Link
                  to="/login"
                  className="px-3 h-8 inline-flex items-center rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 h-8 inline-flex items-center rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && user && (
        <>
          <div
            className="fixed inset-0 bg-foreground/25 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed top-0 right-0 bottom-0 w-[290px] bg-card border-l border-border z-50 lg:hidden flex flex-col outline-none"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 min-w-0"
                onClick={() => setMobileOpen(false)}
              >
                <span
                  className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground truncate">{user.name}</span>
                  <span className="block text-[11px] uppercase tracking-[0.08em] text-muted-foreground truncate">
                    {displayId || roleBadge}
                  </span>
                </span>
              </Link>
              <IconButton label="Close menu" size="sm" onClick={() => setMobileOpen(false)}>
                <X size={18} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
                    isActive(item.path)
                      ? 'border-[hsl(var(--primary-accent))] text-foreground font-medium bg-secondary/60'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  )}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-border p-2">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <User size={16} aria-hidden="true" />
                Profile settings
              </Link>
              <button
                type="button"
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile tab bar ─── */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border safe-area-bottom">
          <div className="flex items-stretch justify-around">
            {bottomTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                aria-current={isActive(tab.path) ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 pt-2 pb-1.5 min-w-[56px] border-t-2 transition-colors',
                  isActive(tab.path)
                    ? 'border-[hsl(var(--primary-accent))] text-foreground'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
