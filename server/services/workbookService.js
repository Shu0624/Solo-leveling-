/**
 * ---------------------------------------------------------------------------
 * Workbook service — the department register as a spreadsheet
 * ---------------------------------------------------------------------------
 * Every sheet in this file is described exactly once, by a column spec that
 * carries both `read` (student -> cell) and `write` (cell -> student). Export
 * and import are then two walks over the same spec, which is the only way a
 * round-trip stays lossless as the schema grows: you cannot add a column to
 * the export and forget it on the way back in.
 *
 * Sheets produced:
 *   Register    one row per student — identity, standing, attendance summary
 *   Attendance  one row per student per paper — the subject-wise ledger
 *   IA Marks    one row per student per paper — IA-1 / IA-2 internals
 *   Arrears     one row per active or cleared backlog
 *   Placement   one row per student — eligibility and offer
 *   Remarks     one row per proctor/mentor note
 *   Summary     department totals plus the provenance of the file itself
 *
 * The Summary sheet is not decoration. It carries SCHEMA_VERSION, the export
 * scope and the row counts, so an import can tell a full register apart from a
 * partial slice and refuse to treat one as the other.
 * ---------------------------------------------------------------------------
 */

import XLSX from 'xlsx';
import crypto from 'crypto';
import { DEPARTMENT, attendanceStatus, lecturesToRecover } from '../data/cseCohort.js';

export const SCHEMA_VERSION = '2.0';

/* -------------------------------------------------------------------------- */
/* Cell coercion helpers                                                      */
/* -------------------------------------------------------------------------- */

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

const num = (v, fallback = 0) => {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

const int = (v, fallback = 0) => Math.round(num(v, fallback));

const ensure = (obj, path) => {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys) {
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  return cur;
};

const fmtDate = (d) => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const parseDate = (v) => {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  // SheetJS hands back a serial number when a cell is formatted as a date.
  if (typeof v === 'number') return new Date(Date.UTC(1899, 11, 30) + v * 86400000);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

/** "BCS403 - Database Management Systems" <-> { code, title } */
const splitSubject = (raw) => {
  const s = str(raw);
  const m = s.match(/^\s*([A-Z0-9]{4,10})\s*[-—:]\s*(.+)$/i);
  return m ? { code: m[1].toUpperCase(), title: m[2].trim() } : { code: '', title: s };
};
const joinSubject = (code, title) => (code ? `${str(code)} - ${str(title)}` : str(title));

/* -------------------------------------------------------------------------- */
/* Sheet definitions                                                          */
/* -------------------------------------------------------------------------- */

const REGISTER_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (s) => str(s.usn), write: (s, v) => { s.usn = str(v).toUpperCase(); } },
  { header: 'Roll No', width: 13, read: (s) => str(s.rollNo), write: (s, v) => { s.rollNo = str(v); } },
  { header: 'Student Name', width: 24, read: (s) => str(s.name), write: (s, v) => { s.name = str(v); } },
  { header: 'Email', width: 30, read: (s) => str(s.email), write: (s, v) => { s.email = str(v).toLowerCase(); } },
  { header: 'Student Phone', width: 16, read: (s) => str(s.phone), write: (s, v) => { s.phone = str(v); } },
  { header: 'Parent Phone', width: 16, read: (s) => str(s.parentPhone), write: (s, v) => { s.parentPhone = str(v); } },
  { header: 'Year', width: 6, type: 'n', read: (s) => s.year ?? '', write: (s, v) => { s.year = int(v, 0) || undefined; } },
  { header: 'Semester', width: 9, type: 'n', read: (s) => s.semester ?? '', write: (s, v) => { s.semester = int(v, 0) || undefined; } },
  { header: 'Section', width: 8, read: (s) => str(s.section), write: (s, v) => { s.section = str(v).toUpperCase(); } },
  { header: 'Proctor / Mentor', width: 26, read: (s) => str(s.mentorName), write: (s, v) => { s.mentorName = str(v); } },
  { header: 'CGPA', width: 8, type: 'n', z: '0.00', read: (s) => num(s.cgpa), write: (s, v) => { s.cgpa = num(v); } },
  { header: 'SGPA', width: 8, type: 'n', z: '0.00', read: (s) => num(s.sgpa), write: (s, v) => { s.sgpa = num(v); } },
  { header: 'Lectures Held', width: 13, type: 'n', read: (s) => int(s.attendance?.totalLectures), write: (s, v) => { ensure(s, 'attendance').totalLectures = int(v); } },
  { header: 'Lectures Attended', width: 16, type: 'n', read: (s) => int(s.attendance?.attendedLectures), write: (s, v) => { ensure(s, 'attendance').attendedLectures = int(v); } },
  { header: 'Attendance %', width: 13, type: 'n', z: '0', read: (s) => int(s.attendance?.percentage), write: (s, v) => { ensure(s, 'attendance').percentage = int(v); } },
  { header: 'Attendance Status', width: 17, derived: true, read: (s) => str(s.attendance?.status) },
  { header: 'Lectures To Recover', width: 18, type: 'n', derived: true, read: (s) => lecturesToRecover(s.attendance?.attendedLectures, s.attendance?.totalLectures) },
  { header: 'Active Arrears', width: 13, type: 'n', read: (s) => int(s.backlogs?.activeCount), write: (s, v) => { ensure(s, 'backlogs').activeCount = int(v); } },
  { header: 'Cleared Arrears', width: 14, type: 'n', read: (s) => int(s.backlogs?.historyCount), write: (s, v) => { ensure(s, 'backlogs').historyCount = int(v); } },
  { header: 'Resume Score', width: 13, type: 'n', read: (s) => int(s.resumeScore), write: (s, v) => { s.resumeScore = int(v); } },
  { header: 'Last Updated', width: 13, derived: true, read: (s) => fmtDate(s.updatedAt) },
];

const ATTENDANCE_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (r) => str(r.usn) },
  { header: 'Student Name', width: 24, read: (r) => str(r.name) },
  { header: 'Subject Code', width: 13, read: (r) => str(r.code), write: (row, v) => { row.code = str(v).toUpperCase(); } },
  { header: 'Subject', width: 40, read: (r) => str(r.subject), write: (row, v) => { row.subject = str(v); } },
  { header: 'Type', width: 12, read: (r) => str(r.kind || 'Theory'), write: (row, v) => { row.kind = str(v) || 'Theory'; } },
  { header: 'Classes Held', width: 12, type: 'n', read: (r) => int(r.held), write: (row, v) => { row.held = int(v); } },
  { header: 'Classes Attended', width: 16, type: 'n', read: (r) => int(r.attended), write: (row, v) => { row.attended = int(v); } },
  { header: 'Subject %', width: 10, type: 'n', derived: true, read: (r) => (r.held ? Math.round((r.attended / r.held) * 100) : 0) },
];

const MARKS_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (r) => str(r.usn) },
  { header: 'Student Name', width: 24, read: (r) => str(r.name) },
  { header: 'Subject Code', width: 13, read: (r) => str(r.code), write: (row, v) => { row.code = str(v).toUpperCase(); } },
  { header: 'Subject', width: 40, read: (r) => str(r.subject), write: (row, v) => { row.subject = str(v); } },
  { header: 'IA-1', width: 8, type: 'n', read: (r) => int(r.ia1), write: (row, v) => { row.ia1 = int(v); } },
  { header: 'IA-2', width: 8, type: 'n', read: (r) => int(r.ia2), write: (row, v) => { row.ia2 = int(v); } },
  { header: 'Total', width: 8, type: 'n', read: (r) => int(r.total ?? (int(r.ia1) + int(r.ia2))), write: (row, v) => { row.total = int(v); } },
  { header: 'Max Marks', width: 11, type: 'n', read: (r) => int(r.maxMarks ?? 50), write: (row, v) => { row.maxMarks = int(v, 50) || 50; } },
];

const ARREAR_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (r) => str(r.usn) },
  { header: 'Student Name', width: 24, read: (r) => str(r.name) },
  { header: 'Subject Code', width: 13, read: (r) => str(r.code), write: (row, v) => { row.code = str(v).toUpperCase(); } },
  { header: 'Subject', width: 42, read: (r) => str(r.title), write: (row, v) => { row.title = str(v); } },
  { header: 'Status', width: 12, read: (r) => str(r.status), write: (row, v) => { row.status = /clear/i.test(str(v)) ? 'Cleared' : 'Active'; } },
];

const PLACEMENT_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (s) => str(s.usn) },
  { header: 'Student Name', width: 24, read: (s) => str(s.name) },
  { header: 'Year', width: 6, type: 'n', read: (s) => s.year ?? '' },
  { header: 'CGPA', width: 8, type: 'n', z: '0.00', read: (s) => num(s.cgpa) },
  { header: 'Active Arrears', width: 13, type: 'n', read: (s) => int(s.backlogs?.activeCount) },
  { header: 'Eligibility', width: 14, derived: true, read: (s) => (num(s.cgpa) >= DEPARTMENT.placementCgpaCutoff && int(s.backlogs?.activeCount) === 0 ? 'Eligible' : 'Not eligible') },
  { header: 'Status', width: 12, read: (s) => str(s.placementStatus?.status || 'eligible'), write: (s, v) => { ensure(s, 'placementStatus').status = str(v).toLowerCase() || 'eligible'; } },
  { header: 'Company', width: 34, read: (s) => str(s.placementStatus?.company), write: (s, v) => { ensure(s, 'placementStatus').company = str(v); } },
  { header: 'Package (LPA)', width: 13, read: (s) => str(s.placementStatus?.package), write: (s, v) => { ensure(s, 'placementStatus').package = str(v); } },
  { header: 'Resume Score', width: 13, type: 'n', read: (s) => int(s.resumeScore) },
];

const REMARK_COLUMNS = [
  { header: 'USN', width: 14, key: true, read: (r) => str(r.usn) },
  { header: 'Student Name', width: 24, read: (r) => str(r.name) },
  { header: 'Date', width: 12, read: (r) => fmtDate(r.date), write: (row, v) => { row.date = parseDate(v); } },
  { header: 'Recorded By', width: 26, read: (r) => str(r.author), write: (row, v) => { row.author = str(v); } },
  { header: 'Category', width: 14, read: (r) => str(r.category || 'counselling'), write: (row, v) => { row.category = str(v).toLowerCase() || 'counselling'; } },
  { header: 'Remark', width: 90, read: (r) => str(r.note), write: (row, v) => { row.note = str(v); } },
];

export const SHEETS = {
  register: { name: 'Register', columns: REGISTER_COLUMNS },
  attendance: { name: 'Attendance', columns: ATTENDANCE_COLUMNS },
  marks: { name: 'IA Marks', columns: MARKS_COLUMNS },
  arrears: { name: 'Arrears', columns: ARREAR_COLUMNS },
  placement: { name: 'Placement', columns: PLACEMENT_COLUMNS },
  remarks: { name: 'Remarks', columns: REMARK_COLUMNS },
};

/* -------------------------------------------------------------------------- */
/* Row projection — student objects to flat rows                              */
/* -------------------------------------------------------------------------- */

const registerRows = (students) => students.map((s) => REGISTER_COLUMNS.map((c) => c.read(s)));

const attendanceRows = (students) =>
  students.flatMap((s) =>
    (s.attendance?.subjects || []).map((sub) =>
      ATTENDANCE_COLUMNS.map((c) => c.read({ ...sub, usn: s.usn, name: s.name }))
    )
  );

const marksRows = (students) =>
  students.flatMap((s) =>
    (s.iaMarks || []).map((m) => MARKS_COLUMNS.map((c) => c.read({ ...m, usn: s.usn, name: s.name })))
  );

const arrearRows = (students) =>
  students.flatMap((s) => {
    const active = (s.backlogs?.subjects || []).map((raw) => {
      const { code, title } = splitSubject(raw);
      return { usn: s.usn, name: s.name, code, title, status: 'Active' };
    });
    // Cleared arrears are kept as a count only, so they export as one summary row.
    const clearedCount = int(s.backlogs?.historyCount);
    const cleared = clearedCount > 0
      ? [{ usn: s.usn, name: s.name, code: '', title: `${clearedCount} arrear(s) cleared in earlier attempts`, status: 'Cleared' }]
      : [];
    return [...active, ...cleared].map((r) => ARREAR_COLUMNS.map((c) => c.read(r)));
  });

const placementRows = (students) => students.map((s) => PLACEMENT_COLUMNS.map((c) => c.read(s)));

const remarkRows = (students) =>
  students.flatMap((s) =>
    (s.mentorRemarks || []).map((r) => REMARK_COLUMNS.map((c) => c.read({ ...r, usn: s.usn, name: s.name })))
  );

const ROW_BUILDERS = {
  register: registerRows,
  attendance: attendanceRows,
  marks: marksRows,
  arrears: arrearRows,
  placement: placementRows,
  remarks: remarkRows,
};

/* -------------------------------------------------------------------------- */
/* Worksheet assembly                                                         */
/* -------------------------------------------------------------------------- */

/** Build a worksheet with typed cells, column widths and a header autofilter. */
const makeSheet = (columns, rows) => {
  const header = columns.map((c) => c.header);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  ws['!cols'] = columns.map((c) => ({ wch: c.width || 14 }));
  if (rows.length) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: rows.length, c: columns.length - 1 },
      }),
    };
  }
  // Keep the header row visible while scrolling a 60-row register.
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

  columns.forEach((col, ci) => {
    if (!col.z && col.type !== 'n') return;
    for (let ri = 1; ri <= rows.length; ri += 1) {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      const cell = ws[addr];
      if (!cell) continue;
      if (col.type === 'n' && cell.v !== '' && cell.v !== null) {
        const n = Number(cell.v);
        if (Number.isFinite(n)) {
          cell.t = 'n';
          cell.v = n;
        }
      }
      if (col.z) cell.z = col.z;
    }
  });

  return ws;
};

const summarySheet = (summary, meta) => {
  const line = (label, value) => [label, value];
  const rows = [
    ['DEPARTMENT STUDENT REGISTER', ''],
    line('Department', summary.department || DEPARTMENT.name),
    line('Institution', summary.college || DEPARTMENT.college),
    line('Academic year', summary.academicYear || DEPARTMENT.academicYear),
    line('Term', summary.term || DEPARTMENT.term),
    ['', ''],
    ['DEPARTMENT TOTALS', ''],
    line('Students in this file', summary.totalStudents ?? 0),
    line('Average CGPA', summary.avgCgpa ?? ''),
    line('Average attendance %', summary.avgAttendance ?? ''),
    line(`Attendance defaulters (below ${summary.attendanceThreshold ?? 75}%)`, summary.defaultersCount ?? 0),
    line('Students carrying arrears', summary.backlogStudentsCount ?? 0),
    line('Total active arrears', summary.activeArrearsTotal ?? 0),
    line('Placement eligible', summary.placementEligibleCount ?? 0),
    line('Placed', summary.placedCount ?? 0),
    ['', ''],
    ['FILE PROVENANCE', ''],
    line('Schema version', SCHEMA_VERSION),
    line('Export scope', meta.scope || 'full'),
    line('Filters applied', meta.filters || 'none'),
    line('Generated on', meta.generatedAt || new Date().toISOString()),
    line('Generated by', meta.generatedBy || 'LevelUp Department Console'),
    line('Content checksum', meta.checksum || ''),
    ['', ''],
    ['ROW COUNTS BY SHEET', ''],
    ...Object.entries(meta.rowCounts || {}).map(([k, v]) => line(SHEETS[k]?.name || k, v)),
    ['', ''],
    ['HOW TO USE THIS FILE', ''],
    ['1.', 'Edit any cell in the data sheets. Keep the header row exactly as it is.'],
    ['2.', 'USN is the identity column. Never edit a USN — add a new row instead.'],
    ['3.', 'Grey columns (Attendance Status, Lectures To Recover, Subject %, Eligibility) are recalculated on import; edits there are ignored.'],
    ['4.', 'Upload the file back through Department Console -> Data & Storage -> Restore from workbook.'],
    ['5.', 'You will see a row-by-row preview of what will change before anything is written.'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 46 }, { wch: 74 }];
  return ws;
};

const checksumOf = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);

/**
 * Build the department workbook.
 *
 * @param {object[]} students  cohort to write out
 * @param {object}   summary   department KPIs (see departmentService.computeSummary)
 * @param {object}   meta      { scope, filters, generatedBy }
 * @param {string[]} sheets    subset of SHEETS keys; defaults to all
 * @returns {{ buffer: Buffer, rowCounts: object, checksum: string }}
 */
export function buildDepartmentWorkbook(students, summary, meta = {}, sheets = Object.keys(SHEETS)) {
  const wb = XLSX.utils.book_new();
  const rowCounts = {};
  const built = {};

  for (const key of sheets) {
    const def = SHEETS[key];
    if (!def) continue;
    const rows = ROW_BUILDERS[key](students);
    rowCounts[key] = rows.length;
    built[key] = { def, rows };
  }

  const checksum = checksumOf(students.map((s) => [s.usn, s.cgpa, s.attendance?.percentage, s.backlogs?.activeCount]));

  XLSX.utils.book_append_sheet(
    wb,
    summarySheet(summary, { ...meta, rowCounts, checksum, generatedAt: meta.generatedAt || new Date().toISOString() }),
    'Summary'
  );

  for (const key of sheets) {
    if (!built[key]) continue;
    XLSX.utils.book_append_sheet(wb, makeSheet(built[key].def.columns, built[key].rows), built[key].def.name);
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
  return { buffer, rowCounts, checksum };
}

/** A blank workbook with the headers, one worked example, and the rules. */
export function buildTemplateWorkbook() {
  const wb = XLSX.utils.book_new();

  const readme = XLSX.utils.aoa_to_sheet([
    ['DEPARTMENT REGISTER — IMPORT TEMPLATE', ''],
    ['', ''],
    ['This workbook has the exact sheets and headers the console reads back.', ''],
    ['Fill the sheets you have data for. Sheets you leave empty are left untouched on import.', ''],
    ['', ''],
    ['Sheet', 'What one row means'],
    ['Register', 'One student. Required. USN identifies the student and must be unique.'],
    ['Attendance', 'One paper for one student. Classes held / attended for that paper.'],
    ['IA Marks', 'One paper for one student. IA-1 and IA-2 out of Max Marks.'],
    ['Arrears', 'One arrear subject for one student. Status is Active or Cleared.'],
    ['Placement', 'One student. Offer details; leave blank if not placed.'],
    ['Remarks', 'One proctor or mentor note. Appended, never overwritten.'],
    ['', ''],
    ['Rules', ''],
    ['Header row', 'Do not rename, reorder or delete header cells. Extra columns are ignored.'],
    ['USN', 'Identity column across every sheet. A row with a USN not in Register is reported, not silently dropped.'],
    ['Recalculated', 'Attendance Status, Lectures To Recover, Subject %, Eligibility are computed on import.'],
    ['Attendance', 'If the Attendance sheet has rows for a student, its totals override the Register summary.'],
    ['Dates', 'Use YYYY-MM-DD or a real Excel date cell.'],
    ['Safety', 'Every upload is previewed row by row. Nothing is written until you confirm.'],
  ]);
  readme['!cols'] = [{ wch: 18 }, { wch: 96 }];
  XLSX.utils.book_append_sheet(wb, readme, 'Read Me');

  const example = {
    usn: '1AP24CS001', rollNo: 'CSE-24-001', name: 'Example Student',
    email: 'example.s24@cse.apex.edu.in', phone: '+91 90000 00000', parentPhone: '+91 90000 00001',
    year: 2, semester: 3, section: 'A', mentorName: 'Prof. Anjali Deshpande',
    cgpa: 8.2, sgpa: 8.4, resumeScore: 74, updatedAt: new Date(),
    attendance: {
      percentage: 82, totalLectures: 240, attendedLectures: 197, status: 'safe',
      subjects: [{ code: 'BCS304', subject: 'Data Structures & Applications', kind: 'Theory', held: 42, attended: 35 }],
    },
    backlogs: { activeCount: 1, historyCount: 1, subjects: ['BMATS101 - Mathematics for CSE Stream I'] },
    iaMarks: [{ code: 'BCS304', subject: 'Data Structures & Applications', ia1: 21, ia2: 22, total: 43, maxMarks: 50 }],
    placementStatus: { status: 'eligible', company: '', package: '' },
    mentorRemarks: [{ date: new Date(), author: 'Prof. Anjali Deshpande', category: 'counselling', note: 'Example note — delete this row.' }],
  };

  for (const key of Object.keys(SHEETS)) {
    XLSX.utils.book_append_sheet(wb, makeSheet(SHEETS[key].columns, ROW_BUILDERS[key]([example])), SHEETS[key].name);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
}

/* -------------------------------------------------------------------------- */
/* Reading a workbook back                                                    */
/* -------------------------------------------------------------------------- */

const readSheetRows = (wb, def) => {
  const ws = wb.Sheets[def.name];
  if (!ws) return null;
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, raw: true });
  if (!aoa.length) return [];

  const header = aoa[0].map((h) => str(h).toLowerCase());
  const indexOf = (col) => header.indexOf(col.header.toLowerCase());

  return aoa.slice(1).map((row, i) => {
    const cells = {};
    def.columns.forEach((col) => {
      const idx = indexOf(col);
      cells[col.header] = idx === -1 ? undefined : row[idx];
    });
    return { __row: i + 2, cells };
  }).filter((r) => Object.values(r.cells).some((v) => v !== undefined && v !== null && str(v) !== ''));
};

const applyColumns = (columns, cells, target) => {
  columns.forEach((col) => {
    if (col.derived || !col.write) return;
    const v = cells[col.header];
    if (v === undefined) return;
    col.write(target, v);
  });
  return target;
};

/**
 * Read a department workbook back into student objects.
 *
 * Rows are grouped by USN. Detail sheets (attendance, marks, arrears, remarks)
 * only attach to a student the Register sheet declared — an orphan row is
 * reported as an issue rather than quietly creating a half-formed student.
 *
 * @returns {{ students: object[], issues: object[], meta: object }}
 */
export function parseDepartmentWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const issues = [];
  const byUsn = new Map();

  const note = (sheet, row, message, severity = 'warning') =>
    issues.push({ sheet, row, message, severity });

  /* --- Register: the spine ------------------------------------------------ */
  const registerRowsRead = readSheetRows(wb, SHEETS.register);
  if (registerRowsRead === null) {
    return {
      students: [],
      issues: [{ sheet: 'Register', row: 0, severity: 'error', message: 'No sheet named "Register" was found. Download the template and use its sheet names.' }],
      meta: { schemaVersion: null, sheetsFound: wb.SheetNames },
    };
  }

  for (const { __row, cells } of registerRowsRead) {
    const usn = str(cells['USN']).toUpperCase();
    if (!usn) {
      note('Register', __row, 'Row skipped — the USN cell is empty.', 'error');
      continue;
    }
    if (byUsn.has(usn)) {
      note('Register', __row, `Duplicate USN ${usn} — only the first row is kept.`, 'error');
      continue;
    }

    const student = {
      usn,
      attendance: { subjects: [] },
      backlogs: { activeCount: 0, historyCount: 0, subjects: [] },
      iaMarks: [],
      placementStatus: { status: 'eligible', company: '', package: '' },
      mentorRemarks: [],
    };
    applyColumns(SHEETS.register.columns, cells, student);

    if (!student.name) note('Register', __row, `${usn} has no student name.`, 'warning');
    if (student.cgpa < 0 || student.cgpa > 10) {
      note('Register', __row, `${usn} has CGPA ${student.cgpa}, outside 0–10. Clamped.`, 'warning');
      student.cgpa = Math.min(10, Math.max(0, student.cgpa));
    }
    byUsn.set(usn, student);
  }

  const attach = (sheetKey, handler) => {
    const rows = readSheetRows(wb, SHEETS[sheetKey]);
    if (!rows) return;
    for (const { __row, cells } of rows) {
      const usn = str(cells['USN']).toUpperCase();
      const student = byUsn.get(usn);
      if (!student) {
        note(SHEETS[sheetKey].name, __row, `USN ${usn || '(blank)'} is not in the Register sheet — row ignored.`, 'error');
        continue;
      }
      handler(student, cells, __row);
    }
  };

  /* --- Attendance ledger -------------------------------------------------- */
  attach('attendance', (student, cells, row) => {
    const entry = applyColumns(SHEETS.attendance.columns, cells, {});
    if (!entry.subject && !entry.code) return;
    if (entry.attended > entry.held) {
      note('Attendance', row, `${student.usn} / ${entry.code || entry.subject}: attended (${entry.attended}) exceeds held (${entry.held}). Clamped.`, 'warning');
      entry.attended = entry.held;
    }
    student.attendance.subjects.push({
      code: entry.code || '',
      subject: entry.subject || entry.code,
      kind: entry.kind || 'Theory',
      held: entry.held,
      attended: entry.attended,
    });
  });

  /* --- Internal assessment ------------------------------------------------ */
  attach('marks', (student, cells, row) => {
    const entry = applyColumns(SHEETS.marks.columns, cells, {});
    if (!entry.subject && !entry.code) return;
    const max = entry.maxMarks || 50;
    const half = Math.ceil(max / 2);
    if (entry.ia1 > half || entry.ia2 > half) {
      note('IA Marks', row, `${student.usn} / ${entry.code || entry.subject}: an IA score exceeds ${half}. Clamped.`, 'warning');
      entry.ia1 = Math.min(entry.ia1, half);
      entry.ia2 = Math.min(entry.ia2, half);
    }
    student.iaMarks.push({
      code: entry.code || '',
      subject: entry.subject || entry.code,
      ia1: entry.ia1,
      ia2: entry.ia2,
      total: entry.ia1 + entry.ia2,
      maxMarks: max,
    });
  });

  /* --- Arrears ------------------------------------------------------------ */
  const clearedSeen = new Set();
  attach('arrears', (student, cells) => {
    const entry = applyColumns(SHEETS.arrears.columns, cells, {});
    if (!entry.title && !entry.code) return;
    if (entry.status === 'Cleared') {
      // Cleared rows are a count, exported as a single summary line per student.
      const n = int((entry.title.match(/^(\d+)/) || [])[1], 1) || 1;
      if (!clearedSeen.has(student.usn)) {
        student.backlogs.historyCount = n;
        clearedSeen.add(student.usn);
      } else {
        student.backlogs.historyCount += n;
      }
      return;
    }
    student.backlogs.subjects.push(joinSubject(entry.code, entry.title));
  });

  /* --- Placement ---------------------------------------------------------- */
  attach('placement', (student, cells) => {
    applyColumns(SHEETS.placement.columns, cells, student);
  });

  /* --- Remarks ------------------------------------------------------------ */
  attach('remarks', (student, cells) => {
    const entry = applyColumns(SHEETS.remarks.columns, cells, {});
    if (!entry.note) return;
    student.mentorRemarks.push({
      date: entry.date || new Date(),
      author: entry.author || 'Imported',
      category: entry.category || 'counselling',
      note: entry.note,
    });
  });

  /* --- Recompute everything derived -------------------------------------- */
  const students = [...byUsn.values()].map((s) => {
    if (s.attendance.subjects.length) {
      const held = s.attendance.subjects.reduce((n, x) => n + x.held, 0);
      const attended = s.attendance.subjects.reduce((n, x) => n + x.attended, 0);
      s.attendance.totalLectures = held;
      s.attendance.attendedLectures = attended;
      s.attendance.percentage = held ? Math.round((attended / held) * 100) : 0;
    } else if (s.attendance.totalLectures) {
      s.attendance.percentage = Math.round((s.attendance.attendedLectures / s.attendance.totalLectures) * 100);
    }
    s.attendance.status = attendanceStatus(s.attendance.percentage || 0);
    s.backlogs.activeCount = s.backlogs.subjects.length;
    if (!s.placementStatus.status) s.placementStatus.status = 'eligible';
    return s;
  });

  const summaryWs = wb.Sheets['Summary'];
  let schemaVersion = null;
  if (summaryWs) {
    const rows = XLSX.utils.sheet_to_json(summaryWs, { header: 1, blankrows: false });
    const hit = rows.find((r) => str(r[0]).toLowerCase() === 'schema version');
    if (hit) schemaVersion = str(hit[1]);
  }

  return {
    students,
    issues,
    meta: {
      schemaVersion,
      sheetsFound: wb.SheetNames,
      sheetsRead: Object.values(SHEETS).filter((d) => wb.SheetNames.includes(d.name)).map((d) => d.name),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Attendance defaulter notice                                                */
/* -------------------------------------------------------------------------- */

/**
 * The single-sheet workbook the examination cell actually asks for: who is
 * short, by how much, and how many lectures would fix it.
 */
export function buildDefaulterNotice(students, meta = {}) {
  const threshold = meta.threshold ?? DEPARTMENT.attendanceThreshold;
  const defaulters = students
    .filter((s) => (s.attendance?.percentage ?? 100) < threshold)
    .sort((a, b) => (a.attendance?.percentage ?? 0) - (b.attendance?.percentage ?? 0));

  const header = [
    ['', DEPARTMENT.college],
    ['', `Department of ${DEPARTMENT.name}`],
    ['', `Shortage of Attendance — Notice to Students (below ${threshold}%)`],
    ['', `${meta.academicYear || DEPARTMENT.academicYear} · ${meta.term || DEPARTMENT.term}`],
    ['', `Issued on ${new Date().toISOString().slice(0, 10)} by ${meta.generatedBy || 'Head of the Department'}`],
    [],
    ['Sl.', 'USN', 'Student Name', 'Year', 'Section', 'Held', 'Attended', 'Attendance %', 'Shortfall %', 'Lectures To Recover', 'Proctor', 'Parent Contact'],
  ];

  const body = defaulters.map((s, i) => {
    const a = s.attendance || {};
    return [
      i + 1,
      s.usn,
      s.name,
      s.year,
      s.section,
      int(a.totalLectures),
      int(a.attendedLectures),
      int(a.percentage),
      Math.max(0, threshold - int(a.percentage)),
      lecturesToRecover(a.attendedLectures, a.totalLectures, threshold),
      s.mentorName || '',
      s.parentPhone || '',
    ];
  });

  const footer = [
    [],
    ['', `Total students short of ${threshold}%: ${defaulters.length}`],
    [],
    ['', 'Students listed above are not eligible to appear for the semester end examination'],
    ['', 'until the shortage is cleared as per university regulation. Parents have been intimated.'],
    [],
    ['', 'Proctor', '', '', 'Head of the Department', '', '', 'Principal'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...body, ...footer]);
  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 26 }, { wch: 6 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 13 }, { wch: 12 }, { wch: 20 }, { wch: 26 }, { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Defaulter Notice');
  return { buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true }), count: defaulters.length };
}

export default {
  SCHEMA_VERSION,
  SHEETS,
  buildDepartmentWorkbook,
  buildTemplateWorkbook,
  parseDepartmentWorkbook,
  buildDefaulterNotice,
};
