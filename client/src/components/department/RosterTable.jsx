import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AttendanceBar, Mark, attendanceTone } from './primitives';

/**
 * The register itself.
 *
 * Deliberately a table and not a grid of cards: an HOD reads down a column
 * looking for the one number that is wrong, and cards make that impossible.
 * Every row is a button so the dossier opens on click, Enter or Space.
 */

const COLUMNS = [
  { key: 'usn', label: 'USN', sortable: true, align: 'left' },
  { key: 'name', label: 'Student', sortable: true, align: 'left' },
  { key: null, label: 'Class', align: 'left' },
  { key: 'cgpa', label: 'CGPA', sortable: true, align: 'right' },
  { key: 'attendance', label: 'Attendance', sortable: true, align: 'left' },
  { key: 'backlogs', label: 'Arrears', sortable: true, align: 'left' },
  { key: null, label: 'Placement', align: 'left' },
];

function SortHead({ column, filters, onSort }) {
  const active = column.key && filters.sort === column.key;
  const Icon = !active ? ChevronsUpDown : filters.order === 'asc' ? ChevronUp : ChevronDown;

  const content = (
    <span className={cn('inline-flex items-center gap-1', active && 'text-foreground')}>
      {column.label}
      {column.sortable && <Icon size={12} className={cn('shrink-0', active ? 'opacity-90' : 'opacity-40')} />}
    </span>
  );

  return (
    <th
      scope="col"
      aria-sort={active ? (filters.order === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn(
        'py-2.5 px-4 font-medium text-[0.6875rem] uppercase tracking-wider text-muted-foreground whitespace-nowrap',
        column.align === 'right' && 'text-right'
      )}
    >
      {column.sortable ? (
        <button
          type="button"
          onClick={() => onSort(column.key)}
          className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {content}
        </button>
      ) : content}
    </th>
  );
}

function PlacementCell({ student }) {
  const p = student.placementStatus || {};
  if (p.status === 'placed') {
    return (
      <div className="min-w-0">
        <div className="text-[0.8125rem] text-foreground truncate max-w-[15rem]" title={p.company}>{p.company}</div>
        <div className="text-xs text-muted-foreground tnum">{p.package ? `${p.package} LPA` : 'Offer accepted'}</div>
      </div>
    );
  }
  if (student.placementEligible) {
    return <span className="text-[0.8125rem] text-foreground/80">Eligible</span>;
  }
  const why = student.backlogs?.activeCount > 0 ? 'arrears pending' : 'CGPA below 7.0';
  return (
    <span className="text-[0.8125rem] text-muted-foreground">
      Not eligible <span className="text-xs">· {why}</span>
    </span>
  );
}

export default function RosterTable({
  students,
  filters,
  loading,
  threshold = 75,
  onSort,
  onOpen,
  selectedId,
  emptyAction,
}) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
            <div className="h-3 flex-1 max-w-[14rem] rounded bg-secondary animate-pulse" />
            <div className="h-3 w-16 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-28 rounded bg-secondary animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm text-foreground font-medium">No student matches this view.</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Try clearing the search box, or widen the year and section filters.
        </p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-border">
          <tr className="bg-secondary/40">
            {COLUMNS.map((c) => (
              <SortHead key={c.label} column={c} filters={filters} onSort={onSort} />
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {students.map((s) => {
            const pct = s.attendance?.percentage ?? 0;
            const tone = attendanceTone(pct, threshold);
            const short = s.attendance?.shortfallLectures ?? 0;
            const arrears = s.backlogs?.activeCount ?? 0;
            const selected = selectedId === s._id;

            return (
              // The whole row is clickable for convenience, but the accessible
              // control is a real button on the name — a `role="button"` row
              // would strip the table semantics a screen reader navigates by.
              <tr
                key={s._id}
                onClick={() => onOpen(s)}
                className={cn(
                  'cursor-pointer transition-colors align-middle',
                  'hover:bg-secondary/50 focus-within:bg-secondary/60',
                  selected && 'bg-secondary'
                )}
              >
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-mono text-[0.8125rem] text-foreground tnum">{s.usn}</div>
                  <div className="font-mono text-[0.6875rem] text-muted-foreground">{s.rollNo}</div>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpen(s); }}
                      className="font-medium text-foreground text-left hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {s.name}
                      <span className="sr-only"> — open full record</span>
                    </button>
                    {s.preferredDomain && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20 whitespace-nowrap">
                        {s.preferredDomain.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[16rem] mt-0.5" title={s.mentorName}>
                    {s.mentorName ? `Proctor: ${s.mentorName}` : (s.careerInterest || 'No proctor assigned')}
                  </div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-[0.8125rem] text-foreground/90">
                  {s.year ? `Year ${s.year}` : '—'}
                  <span className="text-muted-foreground"> · {s.section || '—'}</span>
                  {s.semester && <div className="text-xs text-muted-foreground">Semester {s.semester}</div>}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="tnum text-[0.9375rem] text-foreground">{Number(s.cgpa).toFixed(2)}</div>
                  <div className="tnum text-xs text-muted-foreground">SGPA {Number(s.sgpa).toFixed(2)}</div>
                </td>

                <td className="py-3 px-4 min-w-[11rem]">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      'tnum text-[0.9375rem]',
                      tone === 'short' ? 'text-destructive font-semibold' : 'text-foreground'
                    )}>
                      {pct}%
                    </span>
                    <span className="text-xs text-muted-foreground tnum">
                      {s.attendance?.attendedLectures}/{s.attendance?.totalLectures}
                    </span>
                  </div>
                  <AttendanceBar percentage={pct} threshold={threshold} className="mt-1.5 max-w-[9rem]" />
                  {short > 0 && (
                    <div className="text-[0.6875rem] text-destructive mt-1">
                      {short} more {short === 1 ? 'class' : 'classes'} to reach {threshold}%
                    </div>
                  )}
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  {arrears === 0 ? (
                    <span className="text-[0.8125rem] text-muted-foreground">None</span>
                  ) : (
                    <div className="flex items-start gap-1.5">
                      <Mark tone="watch" className="mt-1.5" />
                      <div>
                        <div className="text-[0.8125rem] text-warning font-medium">
                          {arrears} pending
                        </div>
                        <div
                          className="text-xs text-muted-foreground truncate max-w-[12rem]"
                          title={(s.backlogs?.subjects || []).join(', ')}
                        >
                          {(s.backlogs?.subjects || [])[0]?.split(' - ')[0] || ''}
                          {arrears > 1 ? ` +${arrears - 1} more` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </td>

                <td className="py-3 px-4">
                  <PlacementCell student={s} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
