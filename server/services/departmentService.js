/**
 * ---------------------------------------------------------------------------
 * Department service
 * ---------------------------------------------------------------------------
 * Everything the HOD / teacher console needs that is not HTTP: resolving the
 * cohort a user is allowed to see, filtering it, computing the department
 * totals, diffing an uploaded workbook against what is stored, and archiving
 * cold detail out of MongoDB into a spreadsheet.
 *
 * The archive path is the storage story. A student document is small until you
 * attach a subject-wise attendance ledger, five IA rows and a couple of years
 * of proctor notes to it — then a 400-student department is carrying tens of
 * megabytes of detail that nobody queries after the semester closes. Archiving
 * writes that detail into a workbook the college keeps, prunes it from the
 * documents, and leaves behind the aggregates the console actually renders.
 * Re-importing the workbook puts it all back.
 * ---------------------------------------------------------------------------
 */

import User from '../models/User.js';
import DataArchive from '../models/DataArchive.js';
import { CSE_COHORT, DEPARTMENT, attendanceStatus, lecturesToRecover } from '../data/cseCohort.js';

/** Fields the console reads. Anything not listed here stays out of the payload. */
const STUDENT_FIELDS = [
  'name', 'email', 'usn', 'rollNo', 'enrollmentId', 'department', 'college',
  'year', 'semester', 'section', 'classroomCode', 'admissionYear',
  'cgpa', 'sgpa', 'phone', 'parentPhone', 'mentorName',
  'attendance', 'backlogs', 'iaMarks', 'placementStatus', 'resumeScore',
  'mentorRemarks', 'archive', 'updatedAt',
].join(' ');

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Bring a stored document up to the shape the console expects, and recompute
 * every derived figure. A record is only ever trusted for its raw counts —
 * percentages and statuses are always recalculated here so a stale value in
 * the database can never contradict what the table shows.
 */
export function normaliseStudent(raw, index = 0) {
  const s = { ...raw };
  s._id = String(s._id ?? `student-${index}`);

  s.usn = s.usn || s.enrollmentId || '';
  s.rollNo = s.rollNo || '';
  s.year = num(s.year, 0) || undefined;
  s.section = (s.section || '').toUpperCase();
  s.cgpa = num(s.cgpa);
  s.sgpa = num(s.sgpa);
  s.resumeScore = num(s.resumeScore);

  const a = s.attendance || {};
  const subjects = Array.isArray(a.subjects) ? a.subjects : [];
  const held = subjects.length ? subjects.reduce((n, x) => n + num(x.held), 0) : num(a.totalLectures);
  const attended = subjects.length ? subjects.reduce((n, x) => n + num(x.attended), 0) : num(a.attendedLectures);
  const percentage = held > 0 ? Math.round((attended / held) * 100) : num(a.percentage);

  s.attendance = {
    percentage,
    totalLectures: held,
    attendedLectures: attended,
    status: attendanceStatus(percentage),
    shortfallLectures: lecturesToRecover(attended, held),
    subjects,
  };

  const b = s.backlogs || {};
  const arrearSubjects = Array.isArray(b.subjects) ? b.subjects.filter(Boolean) : [];
  s.backlogs = {
    activeCount: arrearSubjects.length || num(b.activeCount),
    historyCount: num(b.historyCount),
    subjects: arrearSubjects,
  };

  s.iaMarks = (Array.isArray(s.iaMarks) ? s.iaMarks : []).map((m) => ({
    code: m.code || '',
    subject: m.subject || m.code || '',
    ia1: num(m.ia1),
    ia2: num(m.ia2),
    total: num(m.total, num(m.ia1) + num(m.ia2)),
    maxMarks: num(m.maxMarks, 50) || 50,
  }));

  const p = s.placementStatus || {};
  s.placementStatus = {
    status: p.status || 'eligible',
    company: p.company || '',
    package: p.package || '',
  };

  s.mentorRemarks = (Array.isArray(s.mentorRemarks) ? s.mentorRemarks : [])
    .map((r) => ({
      date: r.date ? new Date(r.date) : new Date(),
      author: r.author || '',
      category: r.category || 'counselling',
      note: r.note || '',
    }))
    .sort((x, y) => y.date - x.date);

  s.placementEligible = s.cgpa >= DEPARTMENT.placementCgpaCutoff && s.backlogs.activeCount === 0;
  s.archive = s.archive || null;

  // 1. Basic Information
  s.prn = s.prn || '';
  s.dob = s.dob || '';
  s.gender = s.gender || '';
  s.academicYear = s.academicYear || '2025–2026';

  // 2. Contact Information
  s.personalEmail = s.personalEmail || '';
  s.address = s.address || '';
  s.parentName = s.parentName || '';
  s.parentPhone = s.parentPhone || '';

  // 3. Academic Details
  s.prevSgpa = num(s.prevSgpa);
  s.currentSubjects = Array.isArray(s.currentSubjects) ? s.currentSubjects : [];
  s.academicStrengths = Array.isArray(s.academicStrengths) ? s.academicStrengths : [];
  s.weakSubjects = Array.isArray(s.weakSubjects) ? s.weakSubjects : [];

  // 4. Professional & Career Details
  s.linkedinUrl = s.linkedinUrl || '';
  s.githubUrl = s.githubUrl || '';
  s.portfolioUrl = s.portfolioUrl || '';
  s.resumeUrl = s.resumeUrl || '';
  s.careerInterest = s.careerInterest || 'Job';
  s.preferredDomain = s.preferredDomain || 'Full-Stack Web';
  s.skills = Array.isArray(s.skills) ? s.skills : [];
  s.certifications = Array.isArray(s.certifications) ? s.certifications : [];
  s.projects = Array.isArray(s.projects) ? s.projects : [];
  s.internships = Array.isArray(s.internships) ? s.internships : [];

  return s;
}

/* -------------------------------------------------------------------------- */
/* Cohort resolution                                                          */
/* -------------------------------------------------------------------------- */

const isCseDepartment = /computer|cse/i;

const ciEquals = (a, b) => String(a || '').toUpperCase() === String(b || '').toUpperCase();

/**
 * Teaching faculty see the classes they are assigned to, the same rule the rest
 * of the app enforces in canAccessStudent(). A HOD, principal or placement
 * officer sees the whole department. Faculty with no assignment fall through to
 * the department view rather than an empty screen.
 */
const scopeToUser = (students, user) => {
  if (user?.role !== 'faculty') return students;
  const classes = user.assignedClassrooms || [];
  if (!classes.length) return students;
  return students.filter((s) => classes.some((c) => ciEquals(c, s.classroomCode)));
};

/**
 * Resolve the roster a user may see.
 *
 * A demo session never touches the database — it gets the reference cohort and
 * nothing else, so a public demo link can never surface a real student. A real
 * session reads its own department; the reference cohort is only used to fill
 * an empty department so a fresh install is not a blank screen.
 */
export async function resolveCohort(user, { includeReference = true } = {}) {
  if (user?.isDemo) {
    return {
      students: scopeToUser(CSE_COHORT.map(normaliseStudent), user),
      origin: 'demo',
      dbCount: 0,
    };
  }

  const filter = { role: 'student' };
  if (user?.role === 'hod' || user?.role === 'faculty') {
    filter.department = user.department ? new RegExp(escapeRegex(user.department), 'i') : isCseDepartment;
    if (user.college) filter.college = user.college;
  } else if (user?.college) {
    filter.college = user.college;
    filter.department = isCseDepartment;
  } else {
    filter.department = isCseDepartment;
  }

  let dbStudents = [];
  try {
    dbStudents = await User.find(filter).select(STUDENT_FIELDS).lean();
  } catch (err) {
    console.warn('[department] roster query failed, falling back to reference cohort:', err.message);
  }

  if (dbStudents.length === 0) {
    return {
      students: includeReference ? scopeToUser(CSE_COHORT.map(normaliseStudent), user) : [],
      origin: includeReference ? 'reference' : 'empty',
      dbCount: 0,
    };
  }

  return {
    students: scopeToUser(dbStudents.map(normaliseStudent), user),
    origin: 'database',
    dbCount: dbStudents.length,
  };
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* -------------------------------------------------------------------------- */
/* Filtering, sorting, KPIs                                                   */
/* -------------------------------------------------------------------------- */

export const RISK_FILTERS = {
  all: () => true,
  defaulter: (s) => s.attendance.percentage < DEPARTMENT.attendanceThreshold,
  caution: (s) => s.attendance.status === 'caution',
  backlog: (s) => s.backlogs.activeCount > 0,
  placement: (s) => s.placementEligible,
  placed: (s) => s.placementStatus.status === 'placed',
  topper: (s) => s.cgpa >= DEPARTMENT.meritCgpaCutoff,
};

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name),
  usn: (a, b) => a.usn.localeCompare(b.usn),
  cgpa: (a, b) => b.cgpa - a.cgpa,
  attendance: (a, b) => a.attendance.percentage - b.attendance.percentage,
  backlogs: (a, b) => b.backlogs.activeCount - a.backlogs.activeCount,
  resume: (a, b) => b.resumeScore - a.resumeScore,
};

export function applyFilters(students, { year, section, risk, search, mentor, sort, order } = {}) {
  let out = students;

  if (year && year !== 'all') out = out.filter((s) => String(s.year) === String(year));
  if (section && section !== 'all') out = out.filter((s) => s.section === String(section).toUpperCase());
  if (mentor && mentor !== 'all') out = out.filter((s) => s.mentorName === mentor);

  const riskFn = RISK_FILTERS[risk] || RISK_FILTERS.all;
  out = out.filter(riskFn);

  if (search && String(search).trim()) {
    const q = String(search).toLowerCase().trim();
    out = out.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.usn.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.mentorName || '').toLowerCase().includes(q)
    );
  }

  const sorter = SORTERS[sort] || SORTERS.usn;
  out = [...out].sort(sorter);
  if (order === 'desc') out.reverse();

  return out;
}

/** Department totals. Always computed over the cohort passed in, never a subset. */
export function computeSummary(students, scopeLabel = 'department') {
  const total = students.length || 0;
  const sum = (fn) => students.reduce((n, s) => n + fn(s), 0);

  const defaulters = students.filter(RISK_FILTERS.defaulter);
  const caution = students.filter(RISK_FILTERS.caution);
  const withArrears = students.filter(RISK_FILTERS.backlog);
  const eligible = students.filter(RISK_FILTERS.placement);
  const placed = students.filter(RISK_FILTERS.placed);
  const toppers = students.filter(RISK_FILTERS.topper);

  const byYear = {};
  const bySection = {};
  for (const s of students) {
    const y = s.year || 'unknown';
    const sec = s.section || 'unknown';
    byYear[y] = byYear[y] || { year: y, count: 0, defaulters: 0, arrears: 0, cgpaSum: 0 };
    byYear[y].count += 1;
    byYear[y].defaulters += RISK_FILTERS.defaulter(s) ? 1 : 0;
    byYear[y].arrears += s.backlogs.activeCount;
    byYear[y].cgpaSum += s.cgpa;
    bySection[sec] = (bySection[sec] || 0) + 1;
  }

  return {
    scope: scopeLabel,
    department: DEPARTMENT.name,
    college: DEPARTMENT.college,
    academicYear: DEPARTMENT.academicYear,
    term: DEPARTMENT.term,
    attendanceThreshold: DEPARTMENT.attendanceThreshold,
    placementCgpaCutoff: DEPARTMENT.placementCgpaCutoff,
    meritCgpaCutoff: DEPARTMENT.meritCgpaCutoff,
    totalStudents: total,
    avgCgpa: total ? (sum((s) => s.cgpa) / total).toFixed(2) : '0.00',
    avgAttendance: total ? Math.round(sum((s) => s.attendance.percentage) / total) : 0,
    defaultersCount: defaulters.length,
    cautionCount: caution.length,
    backlogStudentsCount: withArrears.length,
    activeArrearsTotal: sum((s) => s.backlogs.activeCount),
    placementEligibleCount: eligible.length,
    placedCount: placed.length,
    topperCount: toppers.length,
    avgResumeScore: total ? Math.round(sum((s) => s.resumeScore) / total) : 0,
    byYear: Object.values(byYear)
      .map((y) => ({ ...y, avgCgpa: y.count ? (y.cgpaSum / y.count).toFixed(2) : '0.00', cgpaSum: undefined }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year))),
    bySection,
  };
}

/* -------------------------------------------------------------------------- */
/* Workbook import: diff, then commit                                         */
/* -------------------------------------------------------------------------- */

const FIELD_LABELS = {
  name: 'Name', email: 'Email', phone: 'Phone', parentPhone: 'Parent phone',
  rollNo: 'Roll no', year: 'Year', semester: 'Semester', section: 'Section',
  mentorName: 'Proctor', cgpa: 'CGPA', sgpa: 'SGPA', resumeScore: 'Resume score',
  'attendance.percentage': 'Attendance %',
  'attendance.totalLectures': 'Lectures held',
  'attendance.attendedLectures': 'Lectures attended',
  'backlogs.activeCount': 'Active arrears',
  'backlogs.historyCount': 'Cleared arrears',
  'placementStatus.status': 'Placement status',
  'placementStatus.company': 'Company',
  'placementStatus.package': 'Package',
};

const COMPARED_PATHS = Object.keys(FIELD_LABELS);

const dig = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const sameValue = (a, b) => {
  if (a == null && b == null) return true;
  if (typeof a === 'number' || typeof b === 'number') return Math.abs(Number(a || 0) - Number(b || 0)) < 0.005;
  return String(a ?? '').trim() === String(b ?? '').trim();
};

/**
 * Compare parsed workbook rows against the current cohort.
 * Nothing is written here — this is what the console shows before the HOD
 * agrees to apply the file.
 */
export function diffImport(incoming, existing) {
  const byUsn = new Map(existing.map((s) => [String(s.usn).toUpperCase(), s]));

  const created = [];
  const updated = [];
  const unchanged = [];

  for (const row of incoming) {
    const usn = String(row.usn).toUpperCase();
    const current = byUsn.get(usn);
    const parsed = normaliseStudent({ ...row, _id: current?._id });

    if (!current) {
      created.push({
        usn,
        name: parsed.name,
        year: parsed.year,
        section: parsed.section,
        changes: [],
      });
      continue;
    }

    const changes = [];
    for (const path of COMPARED_PATHS) {
      const before = dig(current, path);
      const after = dig(parsed, path);
      if (after === undefined || after === '') continue;
      if (!sameValue(before, after)) {
        changes.push({ field: FIELD_LABELS[path], path, before: before ?? '', after });
      }
    }

    const newRemarks = parsed.mentorRemarks.filter(
      (r) => !current.mentorRemarks.some((c) => c.note === r.note && Math.abs(new Date(c.date) - new Date(r.date)) < 86400000)
    );
    if (newRemarks.length) {
      changes.push({ field: 'Proctor remarks', path: 'mentorRemarks', before: `${current.mentorRemarks.length} on record`, after: `+${newRemarks.length} new` });
    }

    const marksChanged = JSON.stringify(parsed.iaMarks) !== JSON.stringify(current.iaMarks) && parsed.iaMarks.length > 0;
    if (marksChanged) {
      changes.push({ field: 'IA marks', path: 'iaMarks', before: `${current.iaMarks.length} papers`, after: `${parsed.iaMarks.length} papers` });
    }

    const ledgerChanged = parsed.attendance.subjects.length > 0 &&
      JSON.stringify(parsed.attendance.subjects) !== JSON.stringify(current.attendance.subjects);
    if (ledgerChanged) {
      changes.push({ field: 'Attendance ledger', path: 'attendance.subjects', before: `${current.attendance.subjects.length} papers`, after: `${parsed.attendance.subjects.length} papers` });
    }

    if (changes.length) {
      updated.push({ usn, name: parsed.name || current.name, id: current._id, changes });
    } else {
      unchanged.push({ usn, name: current.name });
    }
  }

  const seen = new Set(incoming.map((r) => String(r.usn).toUpperCase()));
  const missing = existing.filter((s) => !seen.has(String(s.usn).toUpperCase()))
    .map((s) => ({ usn: s.usn, name: s.name }));

  return {
    created,
    updated,
    unchanged,
    missing,
    counts: {
      rows: incoming.length,
      created: created.length,
      updated: updated.length,
      unchanged: unchanged.length,
      notInFile: missing.length,
    },
  };
}

/**
 * Write parsed rows into MongoDB. Matched on USN, then enrollment id, then
 * email — colleges rarely fill all three, and a wrong match here would merge
 * two students, so the fallbacks are tried in order of how identifying they
 * actually are.
 */
export async function commitImport(incoming, { user, mode = 'merge' } = {}) {
  const result = { created: 0, updated: 0, failed: [], skipped: 0 };

  for (const row of incoming) {
    const usn = String(row.usn || '').toUpperCase();
    if (!usn) { result.skipped += 1; continue; }

    try {
      const query = { role: 'student', $or: [{ usn }, { enrollmentId: usn }] };
      if (row.email) query.$or.push({ email: String(row.email).toLowerCase() });

      const existing = await User.findOne(query);
      const payload = buildUpdatePayload(row, existing, mode);

      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        result.updated += 1;
      } else {
        await User.create({
          ...payload,
          usn,
          role: 'student',
          department: row.department || DEPARTMENT.name,
          college: row.college || user?.college || DEPARTMENT.college,
          email: row.email || `${usn.toLowerCase()}@import.local`,
          name: row.name || usn,
          // Imported students authenticate through the college's own flow; a
          // random secret keeps the account from being guessable until then.
          password: cryptoRandom(),
          classroomCode: row.classroomCode || (row.year && row.section ? `CSE-${row.year}${row.section}` : undefined),
        });
        result.created += 1;
      }
    } catch (err) {
      result.failed.push({ usn, message: err.message });
    }
  }

  return result;
}

const cryptoRandom = () => `imp_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const buildUpdatePayload = (row, existing, mode) => {
  const payload = {};
  const set = (k, v) => { if (v !== undefined && v !== '') payload[k] = v; };

  set('name', row.name);
  set('email', row.email ? String(row.email).toLowerCase() : undefined);
  set('rollNo', row.rollNo);
  set('phone', row.phone);
  set('parentPhone', row.parentPhone);
  set('year', row.year);
  set('semester', row.semester);
  set('section', row.section);
  set('mentorName', row.mentorName);
  set('cgpa', row.cgpa);
  set('sgpa', row.sgpa);
  set('resumeScore', row.resumeScore);

  if (row.attendance?.totalLectures || row.attendance?.subjects?.length) {
    payload.attendance = {
      percentage: row.attendance.percentage,
      totalLectures: row.attendance.totalLectures,
      attendedLectures: row.attendance.attendedLectures,
      status: row.attendance.status,
      subjects: row.attendance.subjects?.length ? row.attendance.subjects : existing?.attendance?.subjects || [],
    };
  }

  if (row.backlogs) {
    payload.backlogs = {
      activeCount: row.backlogs.subjects?.length ?? row.backlogs.activeCount ?? 0,
      historyCount: row.backlogs.historyCount ?? 0,
      subjects: row.backlogs.subjects || [],
    };
  }

  if (row.iaMarks?.length) payload.iaMarks = row.iaMarks;
  if (row.placementStatus?.status) payload.placementStatus = row.placementStatus;

  if (row.mentorRemarks?.length) {
    const current = existing?.mentorRemarks || [];
    // Remarks are a log. An import adds to it; it never rewrites history.
    const additions = mode === 'replace'
      ? row.mentorRemarks
      : row.mentorRemarks.filter((r) => !current.some((c) => c.note === r.note));
    payload.mentorRemarks = mode === 'replace' ? additions : [...current, ...additions];
  }

  return payload;
};

/* -------------------------------------------------------------------------- */
/* Archiving cold detail out of the database                                  */
/* -------------------------------------------------------------------------- */

/** Roughly what a value costs in the collection. Good enough to decide with. */
const weigh = (value) => (value == null ? 0 : Buffer.byteLength(JSON.stringify(value), 'utf8'));

export const ARCHIVABLE = {
  attendanceLedger: {
    label: 'Subject-wise attendance ledger',
    detail: 'Per-paper classes held and attended. The aggregate percentage stays on the record.',
    path: 'attendance.subjects',
    weigh: (s) => weigh(s.attendance?.subjects),
    prune: (doc) => { if (doc.attendance) doc.attendance.subjects = []; },
  },
  iaMarks: {
    label: 'Internal assessment marks',
    detail: 'IA-1 and IA-2 per paper. CGPA and SGPA stay on the record.',
    path: 'iaMarks',
    weigh: (s) => weigh(s.iaMarks),
    prune: (doc) => { doc.iaMarks = []; },
  },
  remarks: {
    label: 'Proctor and counselling notes',
    detail: 'The full remarks log. Counts stay; the text moves to the workbook.',
    path: 'mentorRemarks',
    weigh: (s) => weigh(s.mentorRemarks),
    prune: (doc) => { doc.mentorRemarks = []; },
  },
};

/** What would be freed, per category, without touching anything. */
export function estimateArchive(students, categories = Object.keys(ARCHIVABLE)) {
  const breakdown = categories
    .filter((k) => ARCHIVABLE[k])
    .map((key) => {
      const spec = ARCHIVABLE[key];
      const bytes = students.reduce((n, s) => n + spec.weigh(s), 0);
      const rows = students.reduce((n, s) => {
        if (key === 'attendanceLedger') return n + (s.attendance?.subjects?.length || 0);
        if (key === 'iaMarks') return n + (s.iaMarks?.length || 0);
        return n + (s.mentorRemarks?.length || 0);
      }, 0);
      return { key, label: spec.label, detail: spec.detail, rows, bytes };
    });

  return {
    breakdown,
    totalRows: breakdown.reduce((n, b) => n + b.rows, 0),
    totalBytes: breakdown.reduce((n, b) => n + b.bytes, 0),
    documentBytes: students.reduce((n, s) => n + weigh(s), 0),
    studentCount: students.length,
  };
}

/**
 * Prune the archived categories from the stored documents.
 * Only ever called after the workbook has been generated, and only for
 * students that actually live in the database — reference-cohort rows have
 * nothing to prune.
 */
export async function pruneArchived(students, categories, { archiveId, user }) {
  const specs = categories.map((k) => ARCHIVABLE[k]).filter(Boolean);
  if (!specs.length) return { pruned: 0, bytesFreed: 0 };

  let pruned = 0;
  let bytesFreed = 0;

  for (const s of students) {
    if (!/^[0-9a-fA-F]{24}$/.test(String(s._id))) continue; // reference rows have synthetic ids
    try {
      const doc = await User.findById(s._id);
      if (!doc) continue;

      bytesFreed += specs.reduce((n, spec) => n + spec.weigh(doc), 0);
      specs.forEach((spec) => spec.prune(doc));

      doc.archive = {
        archiveId,
        archivedAt: new Date(),
        archivedBy: user?.name || 'Department Console',
        categories,
      };
      await doc.save();
      pruned += 1;
    } catch (err) {
      console.warn('[department] prune failed for', s.usn, err.message);
    }
  }

  return { pruned, bytesFreed };
}

/** Ledger entry so the console can show what was archived and when. */
export async function recordArchive(entry) {
  try {
    return await DataArchive.create(entry);
  } catch (err) {
    console.warn('[department] archive ledger write failed:', err.message);
    return null;
  }
}

export async function listArchives(user, limit = 20) {
  try {
    const filter = {};
    if (user?.college) filter.college = user.college;
    return await DataArchive.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  } catch {
    return [];
  }
}

export default {
  resolveCohort,
  normaliseStudent,
  applyFilters,
  computeSummary,
  diffImport,
  commitImport,
  estimateArchive,
  pruneArchived,
  recordArchive,
  listArchives,
  RISK_FILTERS,
  ARCHIVABLE,
};
