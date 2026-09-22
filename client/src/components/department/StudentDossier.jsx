import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X, Phone, Mail, Send, Globe, ExternalLink,
  Code2, Briefcase, Award, Sparkles, Star, User, BookOpen, MapPin, Hash, Check
} from 'lucide-react';
import { LinkedinIcon as Linkedin, GithubIcon as Github } from '../ui/SocialIcons';
import { cn } from '../../lib/utils';
import { AttendanceBar, Field, Mark, Rule, Standing, attendanceTone } from './primitives';

/**
 * Everything on one student, in the order a proctor and HOD would ask for it:
 * academic standing, professional/career profile, attendance compliance,
 * pending arrears, placement readiness, and the mentoring log.
 */

const TABS = [
  { key: 'academics', label: 'Academics' },
  { key: 'career', label: 'Career & Mentoring ⭐' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'arrears', label: 'Arrears' },
  { key: 'placement', label: 'Placement' },
  { key: 'remarks', label: 'Remarks' },
];

const REMARK_CATEGORIES = [
  { value: 'counselling', label: 'Counselling' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'academic', label: 'Academic' },
  { value: 'placement', label: 'Placement' },
  { value: 'parent', label: 'Parent contact' },
  { value: 'merit', label: 'Merit' },
];

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '—';

const dateLabel = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/* -------------------------------------------------------------------------- */
/* Tab panels                                                                 */
/* -------------------------------------------------------------------------- */

function Academics({ student }) {
  const marks = student.iaMarks || [];
  const totals = marks.reduce(
    (acc, m) => ({ scored: acc.scored + (m.total || 0), max: acc.max + (m.maxMarks || 50) }),
    { scored: 0, max: 0 }
  );
  const share = totals.max ? Math.round((totals.scored / totals.max) * 100) : 0;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-4">
        <Field label="CGPA" value={Number(student.cgpa).toFixed(2)} mono />
        <Field label="Latest SGPA" value={Number(student.sgpa).toFixed(2)} mono />
        <Field label="Prev SGPA" value={student.prevSgpa ? Number(student.prevSgpa).toFixed(2) : '—'} mono />
        <Field label="Internals" value={totals.max ? `${totals.scored} / ${totals.max}` : '—'} mono />
      </dl>

      {/* Strengths & Areas for Improvement */}
      {(student.academicStrengths?.length > 0 || student.weakSubjects?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-success mb-1.5 flex items-center gap-1">
              <Check size={13} /> Academic Strengths
            </h5>
            {student.academicStrengths?.length > 0 ? (
              <ul className="text-xs text-foreground/90 space-y-1">
                {student.academicStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">• {s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">None specified</p>
            )}
          </div>

          <div>
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-destructive mb-1.5 flex items-center gap-1">
              <Mark tone="short" /> Needs Assistance / Weak
            </h5>
            {student.weakSubjects?.length > 0 ? (
              <ul className="text-xs text-foreground/90 space-y-1">
                {student.weakSubjects.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">• {s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No weak subjects flagged</p>
            )}
          </div>
        </div>
      )}

      {/* Internal Assessment Table */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Internal assessment
          </h4>
          <span className="text-xs text-muted-foreground tnum">{share}% of internals earned</span>
        </div>

        {marks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No internal assessment on record. Marks arrive with the IA Marks sheet of the register workbook.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-medium py-2">Paper</th>
                <th className="text-right font-medium py-2 w-16">IA-1</th>
                <th className="text-right font-medium py-2 w-16">IA-2</th>
                <th className="text-right font-medium py-2 w-20">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {marks.map((m, i) => {
                const half = Math.ceil((m.maxMarks || 50) / 2);
                const weak = (m.total || 0) < (m.maxMarks || 50) * 0.4;
                return (
                  <tr key={`${m.code}-${i}`}>
                    <td className="py-2.5 pr-3">
                      <div className="text-foreground">{m.subject}</div>
                      {m.code && <div className="font-mono text-[0.6875rem] text-muted-foreground">{m.code}</div>}
                    </td>
                    <td className={cn('text-right tnum py-2.5', m.ia1 < half * 0.4 && 'text-destructive')}>{m.ia1}</td>
                    <td className={cn('text-right tnum py-2.5', m.ia2 < half * 0.4 && 'text-destructive')}>{m.ia2}</td>
                    <td className={cn('text-right tnum py-2.5 font-medium', weak ? 'text-destructive' : 'text-foreground')}>
                      {m.total}<span className="text-muted-foreground font-normal">/{m.maxMarks}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CareerAndMentoring({ student }) {
  return (
    <div className="space-y-6">
      {/* Target Domain & Career Interest */}
      <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Domain</span>
            <div className="text-sm font-bold text-primary flex items-center gap-1.5 mt-0.5">
              <Sparkles size={14} className="text-accent" /> {student.preferredDomain || 'Full-Stack Web'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Career Path</span>
            <div className="text-sm font-semibold text-foreground mt-0.5">
              {student.careerInterest || 'Campus Placement'}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
          {student.linkedinUrl ? (
            <a
              href={student.linkedinUrl.startsWith('http') ? student.linkedinUrl : `https://${student.linkedinUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-background border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
            >
              <Linkedin size={12} className="text-[#0A66C2]" /> LinkedIn <ExternalLink size={10} className="text-muted-foreground" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">No LinkedIn</span>
          )}

          {student.githubUrl && (
            <a
              href={student.githubUrl.startsWith('http') ? student.githubUrl : `https://${student.githubUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-background border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
            >
              <Github size={12} /> GitHub <ExternalLink size={10} className="text-muted-foreground" />
            </a>
          )}

          {student.portfolioUrl && (
            <a
              href={student.portfolioUrl.startsWith('http') ? student.portfolioUrl : `https://${student.portfolioUrl}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-background border border-border hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
            >
              <Globe size={12} className="text-accent" /> Portfolio <ExternalLink size={10} className="text-muted-foreground" />
            </a>
          )}
        </div>
      </div>

      {/* Technical Skills */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Technical Skills & Stack
        </h4>
        {student.skills?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {student.skills.map((s, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium font-mono">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No technical skills recorded.</p>
        )}
      </div>

      {/* Projects */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
          <Code2 size={14} className="text-accent" /> Featured Projects ({student.projects?.length || 0})
        </h4>
        {student.projects?.length > 0 ? (
          <div className="space-y-2.5">
            {student.projects.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-background border border-border">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">{p.title}</p>
                  {p.githubLink && (
                    <a
                      href={p.githubLink.startsWith('http') ? p.githubLink : `https://${p.githubLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      Repo <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>}
                {p.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.techStack.map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No project portfolio recorded yet.</p>
        )}
      </div>

      {/* Internships & Certifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Briefcase size={14} className="text-primary" /> Internships
          </h4>
          {student.internships?.length > 0 ? (
            <div className="space-y-2">
              {student.internships.map((int, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-background border border-border text-xs">
                  <p className="font-bold text-foreground">{int.role || 'Intern'}</p>
                  <p className="text-muted-foreground">{int.company} · {int.duration}</p>
                  {int.description && <p className="text-[11px] text-muted-foreground mt-1">{int.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None</p>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Award size={14} className="text-warning" /> Certifications
          </h4>
          {student.certifications?.length > 0 ? (
            <div className="space-y-2">
              {student.certifications.map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-background border border-border text-xs">
                  <p className="font-bold text-foreground">{c.name}</p>
                  <p className="text-muted-foreground">{c.issuer} · {c.year}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Attendance({ student, threshold }) {
  const a = student.attendance || {};
  const tone = attendanceTone(a.percentage ?? 0, threshold);
  const subjects = a.subjects || [];
  const theory = subjects.filter((s) => s.kind !== 'Laboratory');
  const labs = subjects.filter((s) => s.kind === 'Laboratory');

  const group = (rows, title) => rows.length > 0 && (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {rows.map((s, i) => {
            const pct = s.held ? Math.round((s.attended / s.held) * 100) : 0;
            return (
              <tr key={`${s.code}-${i}`}>
                <td className="py-2.5 pr-3">
                  <div className="text-foreground">{s.subject}</div>
                  {s.code && <div className="font-mono text-[0.6875rem] text-muted-foreground">{s.code}</div>}
                </td>
                <td className="py-2.5 w-32">
                  <AttendanceBar percentage={pct} threshold={threshold} />
                </td>
                <td className="py-2.5 pl-3 text-right whitespace-nowrap w-28">
                  <span className={cn('tnum', pct < threshold ? 'text-destructive font-medium' : 'text-foreground')}>{pct}%</span>
                  <span className="text-xs text-muted-foreground tnum"> · {s.attended}/{s.held}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <div className={cn('font-display tnum text-3xl font-semibold leading-none',
              tone === 'short' ? 'text-destructive' : tone === 'watch' ? 'text-warning' : 'text-success')}>
              {a.percentage ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aggregate attendance across all subjects</p>
          </div>
          <Standing tone={tone}>
            {tone === 'short' ? 'Shortage notice' : tone === 'watch' ? 'Caution zone' : 'Eligible'}
          </Standing>
        </div>
      </div>

      {group(theory, 'Theory Lectures')}
      {group(labs, 'Laboratory Batches')}
    </div>
  );
}

function Arrears({ student }) {
  const b = student.backlogs || {};
  const subjects = b.subjects || [];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4">
        <Field label="Active backlogs" value={String(b.activeCount ?? 0)} mono />
        <Field label="Cleared in earlier attempts" value={String(b.historyCount ?? 0)} mono />
      </dl>

      {subjects.length === 0 ? (
        <div className="rounded-xl border border-border p-4">
          <Standing tone="clear">No pending arrears</Standing>
          <p className="text-xs text-muted-foreground mt-2">
            All papers from earlier semesters are cleared. This is one of the two conditions for
            day-one placement eligibility.
          </p>
        </div>
      ) : (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Papers to be re-attempted
          </h4>
          <ul className="divide-y divide-border border-y border-border">
            {subjects.map((raw, i) => {
              const [code, ...rest] = String(raw).split(' - ');
              const title = rest.join(' - ') || code;
              return (
                <li key={i} className="py-3 flex items-start gap-3">
                  <Mark tone="watch" className="mt-1.5" />
                  <div className="min-w-0">
                    <div className="text-sm text-foreground">{title}</div>
                    {rest.length > 0 && <div className="font-mono text-[0.6875rem] text-muted-foreground">{code}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Placement({ student, cutoff }) {
  const p = student.placementStatus || {};
  const arrears = student.backlogs?.activeCount ?? 0;
  const cgpaOk = Number(student.cgpa) >= cutoff;

  const criteria = [
    { label: `CGPA at or above ${cutoff.toFixed(1)}`, ok: cgpaOk, detail: `Currently ${Number(student.cgpa).toFixed(2)}` },
    { label: 'No pending arrears', ok: arrears === 0, detail: arrears === 0 ? 'Clear' : `${arrears} pending` },
  ];

  return (
    <div className="space-y-6">
      {p.status === 'placed' ? (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <Standing tone="clear">Offer accepted</Standing>
          <div className="mt-2 text-base text-foreground font-medium">{p.company}</div>
          {p.package && <div className="text-sm text-muted-foreground tnum mt-0.5">{p.package} LPA</div>}
          <p className="text-xs text-muted-foreground mt-3">
            Held out of the further-placement pool under the one-offer policy.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <Standing tone={student.placementEligible ? 'clear' : 'watch'}>
            {student.placementEligible ? 'Eligible for campus placement' : 'Not currently eligible'}
          </Standing>
          <ul className="mt-3 space-y-2">
            {criteria.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-sm">
                <Mark tone={c.ok ? 'clear' : 'short'} className="mt-1.5" />
                <span className={cn(c.ok ? 'text-foreground' : 'text-muted-foreground')}>
                  {c.label}
                  <span className="text-muted-foreground"> — {c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4">
        <Field label="Resume audit score" value={student.resumeScore ? `${student.resumeScore} / 100` : '—'} mono />
        <Field label="Year of study" value={student.year ? `Year ${student.year}` : '—'} />
      </dl>
    </div>
  );
}

function Remarks({ student, onAdd, canWrite }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('counselling');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(null);

  const remarks = useMemo(
    () => [...(student.mentorRemarks || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [student.mentorRemarks]
  );

  const submit = async (e) => {
    e.preventDefault();
    const note = text.trim();
    if (!note) return;
    setSaving(true);
    setFailed(null);
    try {
      await onAdd(note, category);
      setText('');
    } catch (err) {
      setFailed(err?.response?.data?.message || 'The note could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-2.5">
        <label htmlFor="remark" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add to the record
        </label>
        <textarea
          id="remark"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`What was discussed with ${(student.name || 'this student').split(' ')[0]}, and what happens next.`}
          className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-shadow"
        />
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Remark category"
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {REMARK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Send size={13} />
            {saving ? 'Saving' : 'Record'}
          </button>
        </div>
        {failed && <p className="text-xs text-destructive">{failed}</p>}
      </form>

      <Rule />

      {remarks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing recorded yet. Notes here are what the next proctor reads before meeting this student.
        </p>
      ) : (
        <ol className="space-y-4">
          {remarks.map((r, i) => (
            <li key={i} className="relative pl-5">
              <span aria-hidden className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-border" />
              {i < remarks.length - 1 && (
                <span aria-hidden className="absolute left-[2.5px] top-4 bottom-[-1rem] w-px bg-border" />
              )}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xs font-medium text-foreground">{r.author || 'Unattributed'}</span>
                <span className="text-[0.6875rem] text-muted-foreground">{dateLabel(r.date)}</span>
                <span className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">· {r.category}</span>
              </div>
              <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{r.note}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

export default function StudentDossier({ student, onClose, onAddRemark, threshold = 75, cutoff = 7.0, canWrite = true }) {
  const [tab, setTab] = useState('academics');
  const reduce = useReducedMotion();

  useEffect(() => { setTab('academics'); }, [student?._id]);

  useEffect(() => {
    if (!student) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [student, onClose]);

  const attTone = student ? attendanceTone(student.attendance?.percentage ?? 0, threshold) : 'neutral';

  return createPortal(
    <AnimatePresence>
      {student && (
        <div className="fixed inset-0 z-[90]">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Student record — ${student.name}`}
            initial={reduce ? { opacity: 0 } : { x: '100%' }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 inset-y-0 w-full sm:max-w-xl bg-card border-l border-border shadow-lg-token flex flex-col"
          >
            {/* Identity Header */}
            <header className="px-5 sm:px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary font-display font-semibold flex items-center justify-center text-sm border border-primary/20">
                    {initials(student.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold text-foreground leading-tight truncate">
                      {student.name}
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">
                      {student.usn} {student.prn ? `· ${student.prn}` : ''} {student.rollNo ? `· ${student.rollNo}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Year {student.year}, Section {student.section}
                      {student.semester ? ` · Sem ${student.semester}` : ''}
                      {student.dob ? ` · DOB: ${student.dob}` : ''}
                      {student.gender ? ` · ${student.gender}` : ''}
                      {student.mentorName ? ` · Proctor: ${student.mentorName}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close student record"
                  className="shrink-0 -mr-2 -mt-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3.5">
                <Standing tone={attTone}>
                  {student.attendance?.percentage ?? 0}% attendance
                </Standing>
                <Standing tone={student.backlogs?.activeCount ? 'watch' : 'clear'}>
                  {student.backlogs?.activeCount ? `${student.backlogs.activeCount} arrears` : 'No arrears'}
                </Standing>
                <span className="text-xs text-muted-foreground tnum">CGPA {Number(student.cgpa).toFixed(2)}</span>
                {student.preferredDomain && (
                  <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold">
                    ⭐ {student.preferredDomain}
                  </span>
                )}
              </div>

              {/* Contact Strip */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
                {student.email && (
                  <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Mail size={12} /> {student.email}
                  </a>
                )}
                {student.phone && (
                  <a href={`tel:${student.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Phone size={12} /> {student.phone}
                  </a>
                )}
                {student.parentPhone && (
                  <a href={`tel:${student.parentPhone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                    <Phone size={12} /> {student.parentPhone} {student.parentName ? `(${student.parentName})` : '(Parent)'}
                  </a>
                )}
                {student.address && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground/80 truncate max-w-xs" title={student.address}>
                    <MapPin size={12} /> {student.address}
                  </span>
                )}
              </div>
            </header>

            {/* Tabs */}
            <nav className="px-5 sm:px-6 border-b border-border" aria-label="Record sections">
              <div className="flex gap-1 -mb-px overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    aria-current={tab === t.key ? 'page' : undefined}
                    className={cn(
                      'px-3 py-2.5 text-[0.8125rem] font-medium whitespace-nowrap border-b-2 transition-colors rounded-t-sm',
                      tab === t.key
                        ? 'border-primary text-foreground font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t.label}
                    {t.key === 'arrears' && student.backlogs?.activeCount > 0 && (
                      <span className="ml-1.5 tnum text-[0.6875rem] text-warning font-bold">{student.backlogs.activeCount}</span>
                    )}
                    {t.key === 'remarks' && student.mentorRemarks?.length > 0 && (
                      <span className="ml-1.5 tnum text-[0.6875rem] text-muted-foreground">{student.mentorRemarks.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </nav>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
              {tab === 'academics' && <Academics student={student} />}
              {tab === 'career' && <CareerAndMentoring student={student} />}
              {tab === 'attendance' && <Attendance student={student} threshold={threshold} />}
              {tab === 'arrears' && <Arrears student={student} />}
              {tab === 'placement' && <Placement student={student} cutoff={cutoff} />}
              {tab === 'remarks' && (
                <Remarks student={student} canWrite={canWrite} onAdd={(note, cat) => onAddRemark(student, note, cat)} />
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
