import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LogOut, Home, BookOpen, FileText, Video, Rocket, Sun, Moon, 
  ShieldCheck, Globe, Gift, ClipboardList, User, Menu, X 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Build initials from name
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
    { path: '/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { path: '/modules', icon: <BookOpen size={18} />, label: 'Learn' },
    { path: '/resume', icon: <FileText size={18} />, label: 'Resume' },
    { path: '/interview', icon: <Video size={18} />, label: 'Interview' },
    { path: '/assessment', icon: <ClipboardList size={18} />, label: 'Assessment' },
    { path: '/roadmap', icon: <Rocket size={18} />, label: 'Roadmap' },
    { path: '/activities', icon: <Globe size={18} />, label: 'Programs' },
    { path: '/benefits', icon: <Gift size={18} />, label: 'Benefits' },
    // Admin link — only shown for non-student roles
    ...(['faculty','hod','principal','placement','admin'].includes(user?.role)
      ? [{ path: '/admin', icon: <ShieldCheck size={18} />, label: 'Admin' }]
      : []
    )
  ];

  // Bottom tab bar items — the 5 most important for quick mobile access
  const bottomTabs = [
    { path: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { path: '/modules', icon: <BookOpen size={20} />, label: 'Learn' },
    { path: '/assessment', icon: <ClipboardList size={20} />, label: 'Assess' },
    { path: '/resume', icon: <FileText size={20} />, label: 'Resume' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TOP NAVBAR                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <nav className="sticky top-4 mx-3 sm:mx-4 md:mx-8 z-50 rounded-2xl glass-morphism px-4 sm:px-6 py-3 transition-all duration-300">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 no-underline group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              L
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 font-sans tracking-tight">
              LevelUp
            </span>
          </Link>

          {/* ─── Desktop Navigation (≥1024px) ─── */}
          {user && (
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-foreground",
                    isActive(item.path) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {item.icon}
                  <span className="hidden xl:block">{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* ─── Right Side Controls ─── */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Profile chip — visible on tablet+ */}
              <div className="hidden md:flex items-center gap-2 border-l border-border/50 pl-3 ml-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/50 group"
                  title="Account Settings"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
                    {initials}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-foreground leading-tight">{user.name?.split(' ')[0]}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
                      {displayId || roleBadge}
                    </span>
                  </div>
                </Link>
                
                <button
                  onClick={logout}
                  className="p-2 ml-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Hamburger — visible below lg */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="px-4 sm:px-5 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-4 sm:px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE SLIDE-OUT DRAWER (< 1024px)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && user && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] bg-card border-l border-border z-50 lg:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 group"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{displayId || roleBadge}</div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-secondary text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <div className="flex-1 overflow-y-auto py-3 px-3">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all mb-1",
                      isActive(item.path) 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-border/50 p-4 space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                  <User size={18} />
                  Profile Settings
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MOBILE BOTTOM TAB BAR (< 768px, logged in only)               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-1.5">
            {bottomTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                  isActive(tab.path) 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                {tab.icon}
                <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
                {isActive(tab.path) && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="w-1 h-1 rounded-full bg-primary mt-0.5"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
