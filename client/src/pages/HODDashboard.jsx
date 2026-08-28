import { useState } from 'react';
import { Search, X, RotateCcw, AlertCircle, Info, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import useDepartmentConsole from '../components/department/useDepartmentConsole';
import RosterTable from '../components/department/RosterTable';
import StudentDossier from '../components/department/StudentDossier';
import DataWorkbook from '../components/department/DataWorkbook';
import { Figure, LedgerStrip } from '../components/department/primitives';

/**
 * Department console for the head of department and the teaching staff.
 *
 * Written as a register rather than a dashboard: masthead, summary line,
 * filtered list, and a record you can open. The numbers a HOD is asked for at
 * a review meeting — on roll, short of attendance, carrying arrears, eligible
 * for placement — are on the first screen without a click.
 */

const YEARS = [
  { value: 'all', label: 'All years' },
  { value: '2', label: 'Second year · Sem 3–4' },
  { value: '3', label: 'Third year · Sem 5–6' },
  { value: '4', label: 'Final year · Sem 7–8' },
];

const SECTIONS = [
  { value: 'all', label: 'All sections' },
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
];

function Select({ label, value, options, onChange }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-input bg-background pl-3 pr-8 py-2 text-[0.8125rem] text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-shadow cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-muted-foreground text-[0.625rem]">▾</span>
    </label>
  );
}

function ListTab({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem] whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-foreground text-background font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn('tnum text-xs', active ? 'text-background/70' : 'text-muted-foreground/70')}>
          {count}
        </span>
      )}
    </button>
  );
}

function Notice({ notice, onDismiss }) {
  if (!notice) return null;
  const Icon = notice.tone === 'error' ? AlertCircle : notice.tone === 'success' ? Check : Info;
  const tone = {
    error: 'border-destructive/30 bg-destructive/5 text-destructive',
    success: 'border-success/30 bg-success/5 text-success',
    info: 'border-border bg-secondary/50 text-foreground',
  }[notice.tone] || 'border-border bg-secondary/50 text-foreground';

  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl border px-4 py-2.5', tone)}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <p className="text-sm flex-1">{notice.text}</p>
      <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

export default function HODDashboard() {
  const { user } = useAuth();
  const dc = useDepartmentConsole();
  const {
    filters, setFilter, resetFilters, toggleSort, isFiltered,
    summary, students, meta, loading, error, reload,
    notice, setNotice, addRemark,
  } = dc;

  const [view, setView] = useState('register'); // 'register' | 'data'
  const [open, setOpen] = useState(null);

  const threshold = summary?.attendanceThreshold ?? 75;
  const cutoff = summary?.placementCgpaCutoff ?? 7;
  const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });

  const setList = (risk) => setFilter('risk', filters.risk === risk ? 'all' : risk);

  const handleRemark = async (student, note, category) => {
    const updated = await addRemark(student, note, category);
    setOpen(updated);
    return updated;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Masthead ────────────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
                {summary?.college || 'Apex Institute of Technology'}
              </p>
              <h1 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground mt-1.5">
                Department of {summary?.department || 'Computer Science & Engineering'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Student master register
                <span className="mx-1.5 text-border">·</span>
                {summary?.academicYear || '2025–2026'}
                <span className="mx-1.5 text-border">·</span>
                {summary?.term || 'Odd Semester'}
                <span className="mx-1.5 text-border">·</span>
                as on {today}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-sm text-foreground">{user?.name || 'Head of Department'}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.role === 'hod' ? 'Head of the Department' : user?.role === 'faculty' ? 'Teaching faculty' : 'Administration'}
                  {meta?.origin === 'demo' && ' · demo session'}
                  {meta?.origin === 'reference' && ' · sample roster'}
                </div>
              </div>
            </div>
          </div>

          {/* Section switch */}
          <nav className="flex gap-1 mt-6 -mb-6 sm:-mb-8" aria-label="Console sections">
            {[['register', 'Register'], ['data', 'Data & storage']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-current={view === key ? 'page' : undefined}
                className={cn(
                  'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-sm',
                  view === key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <Notice notice={notice} onDismiss={() => setNotice(null)} />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={reload} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline">
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Summary line ─────────────────────────────────────────────── */}
        <LedgerStrip>
          <Figure
            label="On roll"
            value={summary?.totalStudents ?? '—'}
            note={summary?.byYear?.length ? summary.byYear.map((y) => `Y${y.year} ${y.count}`).join(' · ') : 'Across all years'}
            onClick={() => setList('all')}
            active={filters.risk === 'all'}
          />
          <Figure
            label={`Short of ${threshold}%`}
            value={summary?.defaultersCount ?? '—'}
            note="Not eligible to sit the exam"
            tone={!summary ? 'neutral' : summary.defaultersCount > 0 ? 'short' : 'clear'}
            onClick={() => setList('defaulter')}
            active={filters.risk === 'defaulter'}
          />
          <Figure
            label="Carrying arrears"
            value={summary?.backlogStudentsCount ?? '—'}
            note={summary ? `${summary.activeArrearsTotal} papers pending in total` : ''}
            tone={!summary ? 'neutral' : summary.backlogStudentsCount > 0 ? 'watch' : 'clear'}
            onClick={() => setList('backlog')}
            active={filters.risk === 'backlog'}
          />
          <Figure
            label="Placement eligible"
            value={summary?.placementEligibleCount ?? '—'}
            note={`CGPA ${cutoff.toFixed(1)}+ and no arrears`}
            onClick={() => setList('placement')}
            active={filters.risk === 'placement'}
          />
          <Figure
            label="Placed"
            value={summary?.placedCount ?? '—'}
            note="Offer accepted this season"
            onClick={() => setList('placed')}
            active={filters.risk === 'placed'}
          />
          <Figure
            label="Department average"
            value={summary?.avgCgpa ?? '—'}
            note={summary ? `CGPA · attendance ${summary.avgAttendance}%` : ''}
          />
        </LedgerStrip>

        {view === 'register' ? (
          <>
            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilter('search', e.target.value)}
                    placeholder="Name, USN, roll number or proctor"
                    aria-label="Search the register"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-shadow"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilter('search', '')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select label="Year" value={filters.year} options={YEARS} onChange={(v) => setFilter('year', v)} />
                  <Select label="Section" value={filters.section} options={SECTIONS} onChange={(v) => setFilter('section', v)} />
                  {meta?.mentors?.length > 0 && (
                    <Select
                      label="Proctor"
                      value={filters.mentor}
                      options={[{ value: 'all', label: 'All proctors' }, ...meta.mentors.map((m) => ({ value: m, label: m }))]}
                      onChange={(v) => setFilter('mentor', v)}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1.5">Lists</span>
                <ListTab active={filters.risk === 'all'} onClick={() => setFilter('risk', 'all')}>
                  Everyone
                </ListTab>
                <ListTab active={filters.risk === 'defaulter'} onClick={() => setList('defaulter')} count={summary?.defaultersCount}>
                  Short of attendance
                </ListTab>
                <ListTab active={filters.risk === 'caution'} onClick={() => setList('caution')} count={summary?.cautionCount}>
                  Close to the line
                </ListTab>
                <ListTab active={filters.risk === 'backlog'} onClick={() => setList('backlog')} count={summary?.backlogStudentsCount}>
                  Arrears pending
                </ListTab>
                <ListTab active={filters.risk === 'placement'} onClick={() => setList('placement')} count={summary?.placementEligibleCount}>
                  Placement eligible
                </ListTab>
                <ListTab active={filters.risk === 'topper'} onClick={() => setList('topper')} count={summary?.topperCount}>
                  Merit list
                </ListTab>

                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw size={12} /> Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Register ─────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-baseline justify-between gap-4 px-4 py-3 border-b border-border">
                <p className="text-sm text-foreground">
                  <span className="tnum font-medium">{students.length}</span>
                  <span className="text-muted-foreground">
                    {isFiltered ? ` of ${summary?.totalStudents ?? 0} students` : ' students'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Select a row to open the full record
                </p>
              </div>

              <RosterTable
                students={students}
                filters={filters}
                loading={loading}
                threshold={threshold}
                onSort={toggleSort}
                onOpen={setOpen}
                selectedId={open?._id}
                emptyAction={
                  isFiltered && (
                    <button onClick={resetFilters} className="text-sm font-medium text-primary hover:underline">
                      Clear all filters
                    </button>
                  )
                }
              />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-prose">
              A student below {threshold}% aggregate attendance is not permitted to sit the semester end
              examination until the shortage is made up. The figure beside each attendance bar is the number
              of consecutive classes that would clear it, assuming none are missed from here on.
            </p>
          </>
        ) : (
          <DataWorkbook
            controller={dc}
            isFiltered={isFiltered}
            viewCount={students.length}
            totalCount={summary?.totalStudents ?? 0}
          />
        )}
      </main>

      <StudentDossier
        student={open}
        onClose={() => setOpen(null)}
        onAddRemark={handleRemark}
        threshold={threshold}
        cutoff={cutoff}
        canWrite={!meta?.readOnly}
      />
    </div>
  );
}
