/**
 * ---------------------------------------------------------------------------
 * /api/department — HOD and teacher department console
 * ---------------------------------------------------------------------------
 * Read routes serve the roster and a single student's dossier.
 * Write routes update a record or append a proctor remark.
 * Workbook routes are the Excel round-trip:
 *
 *   GET  /workbook/register.xlsx    the register, honouring the current filters
 *   GET  /workbook/template.xlsx    an empty workbook with the rules on sheet 1
 *   GET  /workbook/defaulters.xlsx  the shortage-of-attendance notice
 *   POST /workbook/import           preview a file, then apply it
 *   GET  /storage                   what archiving would reclaim
 *   POST /storage/archive           export the cold detail, then prune it
 *   GET  /storage/archives          the archive ledger
 *
 * Import is deliberately two-phase. A spreadsheet that has been through three
 * departments and a WhatsApp forward is not trustworthy input, so the default
 * response is a row-by-row diff and nothing is written until the caller asks
 * again with `mode=commit`.
 * ---------------------------------------------------------------------------
 */

import express from 'express';
import multer from 'multer';
import { protect, authorize, blockDemoWrites } from '../middleware/auth.js';
import User from '../models/User.js';
import {
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
  ARCHIVABLE,
} from '../services/departmentService.js';
import {
  buildDepartmentWorkbook,
  buildTemplateWorkbook,
  parseDepartmentWorkbook,
  buildDefaulterNotice,
  SCHEMA_VERSION,
  SHEETS,
} from '../services/workbookService.js';
import { DEPARTMENT, CURRICULUM } from '../data/cseCohort.js';

const router = express.Router();

const STAFF = ['hod', 'faculty', 'principal', 'placement', 'admin'];
const EDITORS = ['hod', 'faculty', 'principal', 'admin'];

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/\.(xlsx|xlsm|xls)$/i.test(file.originalname || '')) return cb(null, true);
    // Hand the shared error handler a status, or picking the wrong file reads
    // as a server fault to the person who picked it.
    const err = new Error('That is not an Excel workbook. Upload an .xlsx file — the template download has the right shape.');
    err.status = 400;
    err.code = 'UNSUPPORTED_FILE_TYPE';
    cb(err);
  },
});

const stamp = () => new Date().toISOString().slice(0, 10);

const sendWorkbook = (res, buffer, fileName, extraHeaders = {}) => {
  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  // The browser can only read these cross-origin if they are explicitly exposed.
  const exposed = ['Content-Disposition', ...Object.keys(extraHeaders)];
  res.setHeader('Access-Control-Expose-Headers', exposed.join(', '));
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, String(v)));
  res.send(buffer);
};

const describeFilters = (q) => {
  const parts = [];
  if (q.year && q.year !== 'all') parts.push(`Year ${q.year}`);
  if (q.section && q.section !== 'all') parts.push(`Section ${q.section}`);
  if (q.risk && q.risk !== 'all') parts.push(`List: ${q.risk}`);
  if (q.mentor && q.mentor !== 'all') parts.push(`Proctor: ${q.mentor}`);
  if (q.search) parts.push(`Search: "${q.search}"`);
  return parts.length ? parts.join(' · ') : 'none';
};

/* ========================================================================== */
/* Roster                                                                     */
/* ========================================================================== */

// @desc    Department roster, department totals, and the filter vocabulary
// @route   GET /api/department/roster
// @access  HOD, Faculty, Principal, Placement, Admin
router.get('/roster', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    const { students, origin, dbCount } = await resolveCohort(req.user);
    const filtered = applyFilters(students, req.query);

    res.json({
      // Totals are always for the whole department. A filtered table must not
      // change the number the HOD reports upward.
      summary: computeSummary(students, 'department'),
      view: {
        count: filtered.length,
        filters: {
          year: req.query.year || 'all',
          section: req.query.section || 'all',
          risk: req.query.risk || 'all',
          mentor: req.query.mentor || 'all',
          search: req.query.search || '',
          sort: req.query.sort || 'usn',
          order: req.query.order || 'asc',
        },
      },
      meta: {
        origin,                       // 'database' | 'reference' | 'demo'
        dbCount,
        readOnly: Boolean(req.user?.isDemo),
        schemaVersion: SCHEMA_VERSION,
        curriculum: CURRICULUM,
        mentors: [...new Set(students.map((s) => s.mentorName).filter(Boolean))].sort(),
        sections: [...new Set(students.map((s) => s.section).filter(Boolean))].sort(),
        years: [...new Set(students.map((s) => s.year).filter(Boolean))].sort(),
        archivedCount: students.filter((s) => s.archive?.archiveId).length,
      },
      students: filtered,
    });
  } catch (err) {
    next(err);
  }
});

// @desc    One student's full dossier
// @route   GET /api/department/students/:id
router.get('/students/:id', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    const { students } = await resolveCohort(req.user);
    const student = students.find((s) => String(s._id) === String(req.params.id) || s.usn === String(req.params.id).toUpperCase());
    if (!student) return res.status(404).json({ message: 'No student with that identifier in your department.' });
    res.json({ student });
  } catch (err) {
    next(err);
  }
});

// @desc    Update a record, or append a proctor remark
// @route   PUT /api/department/students/:id
router.put('/students/:id', protect, authorize(...EDITORS), blockDemoWrites, async (req, res, next) => {
  try {
    const { cgpa, sgpa, attendance, backlogs, placementStatus, newRemark } = req.body;

    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        code: 'NOT_IN_DATABASE',
        message: 'This record comes from the reference roster and is not stored yet. Import your department register to edit it.',
      });
    }

    if (cgpa !== undefined) student.cgpa = Number(cgpa);
    if (sgpa !== undefined) student.sgpa = Number(sgpa);
    if (attendance) student.attendance = { ...student.attendance?.toObject?.() ?? student.attendance, ...attendance };
    if (backlogs) {
      const subjects = backlogs.subjects ?? student.backlogs?.subjects ?? [];
      student.backlogs = { ...student.backlogs, ...backlogs, subjects, activeCount: subjects.length };
    }
    if (placementStatus) student.placementStatus = { ...student.placementStatus, ...placementStatus };

    if (newRemark?.note) {
      student.mentorRemarks = [
        ...(student.mentorRemarks || []),
        {
          date: new Date(),
          author: req.user.name,
          note: String(newRemark.note).slice(0, 2000),
          category: newRemark.category || 'counselling',
        },
      ];
    }

    await student.save();
    res.json({ success: true, student: normaliseStudent(student.toObject()) });
  } catch (err) {
    next(err);
  }
});

/* ========================================================================== */
/* Workbook: out                                                              */
/* ========================================================================== */

// @desc    The department register as a workbook
// @route   GET /api/department/workbook/register.xlsx
// @query   scope=filtered|all, sheets=register,attendance,...
router.get('/workbook/register.xlsx', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    const { students } = await resolveCohort(req.user);
    const scope = req.query.scope === 'filtered' ? 'filtered' : 'all';
    const rows = scope === 'filtered' ? applyFilters(students, req.query) : students;

    const requested = String(req.query.sheets || '').split(',').map((s) => s.trim()).filter(Boolean);
    const sheets = requested.length ? requested.filter((s) => SHEETS[s]) : Object.keys(SHEETS);

    const { buffer, rowCounts, checksum } = buildDepartmentWorkbook(
      rows,
      computeSummary(rows, scope),
      {
        scope,
        filters: scope === 'filtered' ? describeFilters(req.query) : 'none',
        generatedBy: `${req.user.name} (${req.user.role.toUpperCase()})`,
      },
      sheets.length ? sheets : Object.keys(SHEETS)
    );

    sendWorkbook(res, buffer, `CSE-Register-${scope}-${stamp()}.xlsx`, {
      'X-Row-Count': rows.length,
      'X-Checksum': checksum,
      'X-Sheet-Rows': JSON.stringify(rowCounts),
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Empty workbook with the exact headers the importer reads
// @route   GET /api/department/workbook/template.xlsx
router.get('/workbook/template.xlsx', protect, authorize(...STAFF), (req, res, next) => {
  try {
    sendWorkbook(res, buildTemplateWorkbook(), `CSE-Register-Template-v${SCHEMA_VERSION}.xlsx`);
  } catch (err) {
    next(err);
  }
});

// @desc    Shortage-of-attendance notice for the examination cell
// @route   GET /api/department/workbook/defaulters.xlsx
router.get('/workbook/defaulters.xlsx', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    const { students } = await resolveCohort(req.user);
    const scope = req.query.scope === 'filtered' ? applyFilters(students, req.query) : students;
    const { buffer, count } = buildDefaulterNotice(scope, {
      generatedBy: `${req.user.name} (${req.user.role.toUpperCase()})`,
      threshold: DEPARTMENT.attendanceThreshold,
    });
    sendWorkbook(res, buffer, `CSE-Attendance-Shortage-Notice-${stamp()}.xlsx`, { 'X-Row-Count': count });
  } catch (err) {
    next(err);
  }
});

/* ========================================================================== */
/* Workbook: in                                                               */
/* ========================================================================== */

// @desc    Read a workbook back in. Previews by default; writes on mode=commit.
// @route   POST /api/department/workbook/import?mode=preview|commit
router.post('/workbook/import', protect, authorize(...EDITORS), upload.single('workbook'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 'NO_FILE', message: 'Attach an .xlsx workbook to upload.' });
    }

    let parsed;
    try {
      parsed = parseDepartmentWorkbook(req.file.buffer);
    } catch (err) {
      return res.status(422).json({
        code: 'UNREADABLE_WORKBOOK',
        message: `That file could not be read as a workbook (${err.message}). Download the template and copy your data into it.`,
      });
    }

    const blocking = parsed.issues.filter((i) => i.severity === 'error');
    if (!parsed.students.length) {
      return res.status(422).json({
        code: 'NO_ROWS',
        message: 'No student rows were found. The importer reads a sheet named "Register" with a USN column.',
        issues: parsed.issues,
        meta: parsed.meta,
      });
    }

    const { students: existing } = await resolveCohort(req.user);
    const diff = diffImport(parsed.students, existing);

    const mode = String(req.query.mode || 'preview').toLowerCase();
    if (mode !== 'commit') {
      return res.json({
        mode: 'preview',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        schemaVersion: parsed.meta.schemaVersion,
        schemaExpected: SCHEMA_VERSION,
        sheetsRead: parsed.meta.sheetsRead,
        issues: parsed.issues,
        diff,
        // Preview is safe for a demo session; committing is not.
        canCommit: !req.user?.isDemo && blocking.length === 0,
        blockedReason: req.user?.isDemo
          ? 'Demo session — the preview is real, but nothing is written to the database.'
          : blocking.length
            ? 'Fix the errors listed below, then upload again.'
            : null,
      });
    }

    if (req.user?.isDemo) {
      return res.status(403).json({
        code: 'DEMO_READ_ONLY',
        message: 'Demo session. The file was read and diffed, but writing needs a department account.',
        diff,
      });
    }
    if (blocking.length) {
      return res.status(422).json({
        code: 'BLOCKING_ISSUES',
        message: 'The workbook has errors that would corrupt the register. Nothing was written.',
        issues: parsed.issues,
      });
    }

    const written = await commitImport(parsed.students, { user: req.user, mode: req.query.strategy === 'replace' ? 'replace' : 'merge' });

    const { students: refreshed } = await resolveCohort(req.user);
    res.json({
      mode: 'commit',
      fileName: req.file.originalname,
      written,
      issues: parsed.issues,
      summary: computeSummary(refreshed, 'department'),
      message: `${written.created} added, ${written.updated} updated${written.failed.length ? `, ${written.failed.length} failed` : ''}.`,
    });
  } catch (err) {
    next(err);
  }
});

/* ========================================================================== */
/* Storage                                                                    */
/* ========================================================================== */

// @desc    What the database is holding, and what archiving would reclaim
// @route   GET /api/department/storage
router.get('/storage', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    const { students, origin, dbCount } = await resolveCohort(req.user);
    const estimate = estimateArchive(students);
    const archives = await listArchives(req.user);

    res.json({
      origin,
      dbCount,
      readOnly: Boolean(req.user?.isDemo),
      categories: Object.entries(ARCHIVABLE).map(([key, spec]) => ({ key, label: spec.label, detail: spec.detail })),
      estimate,
      archives,
      totalArchivedBytes: archives.reduce((n, a) => n + (a.bytesFreed || 0), 0),
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Export the cold detail to a workbook, then prune it from the records
// @route   POST /api/department/storage/archive
// @body    { categories: string[], dryRun?: boolean }
router.post('/storage/archive', protect, authorize('hod', 'principal', 'admin'), async (req, res, next) => {
  try {
    const categories = (Array.isArray(req.body?.categories) && req.body.categories.length
      ? req.body.categories
      : Object.keys(ARCHIVABLE)
    ).filter((k) => ARCHIVABLE[k]);

    if (!categories.length) {
      return res.status(400).json({ code: 'NO_CATEGORIES', message: 'Choose at least one category to archive.' });
    }

    const { students, origin } = await resolveCohort(req.user);
    const estimate = estimateArchive(students, categories);

    // A dry run answers "what would this cost me" without producing a file.
    if (req.body?.dryRun) {
      return res.json({ dryRun: true, categories, estimate });
    }

    // The workbook is written first, always. Detail is only ever pruned from a
    // record after it exists somewhere else.
    const { buffer, rowCounts, checksum } = buildDepartmentWorkbook(
      students,
      computeSummary(students, 'archive'),
      {
        scope: `archive:${categories.join('+')}`,
        filters: 'none',
        generatedBy: `${req.user.name} (${req.user.role.toUpperCase()})`,
      }
    );

    const fileName = `CSE-Archive-${categories.join('-')}-${stamp()}.xlsx`;
    let pruned = { pruned: 0, bytesFreed: 0 };
    let archiveId = null;

    if (!req.user?.isDemo && origin === 'database') {
      const ledger = await recordArchive({
        department: req.user.department || DEPARTMENT.name,
        college: req.user.college || DEPARTMENT.college,
        fileName,
        categories,
        studentCount: students.length,
        rowCounts,
        checksum,
        schemaVersion: SCHEMA_VERSION,
        createdBy: req.user.name,
        createdByRole: req.user.role,
        note: req.body?.note || '',
      });
      archiveId = ledger?._id ? String(ledger._id) : null;

      pruned = await pruneArchived(students, categories, { archiveId, user: req.user });

      if (ledger) {
        ledger.bytesFreed = pruned.bytesFreed;
        ledger.documentsPruned = pruned.pruned;
        await ledger.save();
      }
    }

    sendWorkbook(res, buffer, fileName, {
      'X-Archive-Id': archiveId || 'none',
      'X-Archive-Checksum': checksum,
      'X-Archive-Categories': categories.join(','),
      'X-Archive-Rows': estimate.totalRows,
      'X-Archive-Bytes-Freed': pruned.bytesFreed,
      'X-Archive-Documents-Pruned': pruned.pruned,
      // Nothing was pruned in demo or reference mode — say so rather than
      // letting the UI claim a saving that did not happen.
      'X-Archive-Applied': String(pruned.pruned > 0),
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Archive ledger
// @route   GET /api/department/storage/archives
router.get('/storage/archives', protect, authorize(...STAFF), async (req, res, next) => {
  try {
    res.json({ archives: await listArchives(req.user, Number(req.query.limit) || 20) });
  } catch (err) {
    next(err);
  }
});

export default router;
