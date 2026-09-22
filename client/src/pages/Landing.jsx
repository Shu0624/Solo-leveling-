import { Link } from 'react-router-dom';
import {
  ArrowRight, Bot, FileText, Route, Video, Trophy, Globe,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Landing — set as a title page.
//
// The structure is borrowed from print: a masthead rule, a display
// headline in Source Serif over a narrow measure, a numbered contents
// list rather than a grid of tinted feature cards, and rules instead
// of boxes. Nothing animates on scroll and nothing glows.
// ═══════════════════════════════════════════════════════════════

const CAPABILITIES = [
  {
    icon: Bot,
    title: 'Mock interviews',
    body: 'Technical and behavioural rounds with an interviewer that adapts to your domain, and a transcript scored afterwards.',
  },
  {
    icon: FileText,
    title: 'Resume analysis',
    body: 'A score across five dimensions with the specific rewrites needed to clear applicant tracking filters.',
  },
  {
    icon: Route,
    title: 'Career roadmaps',
    body: 'A phase-by-phase plan built from your target role and current level, instead of a folder of bookmarks.',
  },
  {
    icon: Trophy,
    title: 'Progress record',
    body: 'Study sessions, quizzes and problems solved, kept as a record your department can actually see.',
  },
  {
    icon: Globe,
    title: 'Programs and benefits',
    body: 'Hackathons, off-campus drives and student developer packs, reviewed and refreshed daily.',
  },
  {
    icon: Video,
    title: 'Peer practice rooms',
    body: 'A video room you can open in one click to run a mock interview with a classmate.',
  },
];

const Landing = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">

    {/* ─── Masthead ─── */}
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 no-underline">
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            LevelUp
          </span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Career Preparation
          </span>
        </Link>

        <nav className="flex items-center gap-1">
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
        </nav>
      </div>
    </header>

    <main className="flex-1">

      {/* ─── Title block ─── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-6">
            For engineering students
          </p>

          <h1 className="font-display text-[40px] sm:text-[56px] font-semibold leading-[1.08] text-foreground">
            Preparation, kept
            <br className="hidden sm:block" />
            <span className="italic text-[hsl(var(--primary-accent))]"> in one record.</span>
          </h1>

          <p className="mt-6 text-[17px] leading-[1.65] text-muted-foreground max-w-measure">
            Practise interviews, sharpen your resume, and follow a plan built around
            the role you want — while your department sees the progress that matters,
            without chasing it down a spreadsheet.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Create an account
              <ArrowRight size={15} aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-5 h-11 rounded-md border border-input text-foreground font-medium text-sm hover:bg-elevated transition-colors"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-[13px] text-muted-foreground">
            Free for students. No card required.
          </p>
        </div>
      </section>

      {/* ─── Contents ─── */}
      <section className="border-t border-border" aria-labelledby="contents-heading">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="flex items-baseline justify-between gap-4 mb-10 pb-4 border-b border-border">
            <h2 id="contents-heading" className="font-display text-2xl font-semibold text-foreground">
              What it covers
            </h2>
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Six areas
            </span>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9 list-none p-0 m-0">
            {CAPABILITIES.map(({ icon: Icon, title, body }, i) => (
              <li key={title}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="tnum text-[11px] font-medium text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon size={15} className="text-[hsl(var(--primary-accent))]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-[17px] font-semibold text-foreground mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-[1.6]">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Closing ─── */}
      <section className="border-t border-border bg-elevated/40">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="max-w-measure">
            <h2 className="font-display text-2xl sm:text-[28px] font-semibold text-foreground leading-snug">
              Start with one mock interview.
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              You will have a transcript, a score, and a first roadmap in under
              twenty minutes.
            </p>
            <Link
              to="/register"
              className="mt-7 group inline-flex items-center gap-2 px-5 h-11 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Get started
              <ArrowRight size={15} aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>

    {/* ─── Footer ─── */}
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} LevelUp
        </p>
        <nav className="flex items-center gap-6 text-[13px]">
          <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="text-muted-foreground hover:text-foreground transition-colors">
            Create account
          </Link>
          <Link to="/exhibition" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
      </div>
    </footer>
  </div>
);

export default Landing;
