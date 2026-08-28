/**
 * Round-trip self-check for the department workbook.
 *
 *   node server/scripts/verifyWorkbook.js
 *
 * Exports the reference cohort, reads the bytes straight back, and asserts the
 * register survived unchanged. Run it after touching the column specs in
 * services/workbookService.js — a column added to the export but not wired for
 * import will fail here rather than silently dropping a teacher's data.
 */

import {
  buildDepartmentWorkbook,
  buildTemplateWorkbook,
  buildDefaulterNotice,
  parseDepartmentWorkbook,
} from '../services/workbookService.js';
import { computeSummary, normaliseStudent, diffImport } from '../services/departmentService.js';
import { CSE_COHORT } from '../data/cseCohort.js';

let failures = 0;

const check = (label, ok, detail = '') => {
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  }
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

console.log('\nDepartment workbook round-trip\n');

const cohort = CSE_COHORT.map(normaliseStudent);
const summary = computeSummary(cohort);

/* --- export -------------------------------------------------------------- */
const { buffer, rowCounts, checksum } = buildDepartmentWorkbook(cohort, summary, {
  scope: 'all',
  generatedBy: 'verifyWorkbook.js',
});

console.log(`Export: ${cohort.length} students, ${kb(buffer.length)}, checksum ${checksum}`);
console.log(`Rows:   ${Object.entries(rowCounts).map(([k, v]) => `${k}=${v}`).join('  ')}\n`);

/* --- read back ----------------------------------------------------------- */
const { students: reread, issues, meta } = parseDepartmentWorkbook(buffer);
const back = reread.map(normaliseStudent);
const byUsn = new Map(back.map((s) => [s.usn, s]));

console.log('Structure');
check('every student came back', back.length === cohort.length, `${back.length} of ${cohort.length}`);
check('no blocking issues', issues.filter((i) => i.severity === 'error').length === 0,
  issues.filter((i) => i.severity === 'error').slice(0, 3).map((i) => `${i.sheet}:${i.row} ${i.message}`).join('\n        '));
check('schema version recorded', Boolean(meta.schemaVersion), JSON.stringify(meta));

console.log('\nField fidelity');
const mismatches = [];
for (const original of cohort) {
  const copy = byUsn.get(original.usn);
  if (!copy) { mismatches.push(`${original.usn}: missing entirely`); continue; }

  const compare = [
    ['name', original.name, copy.name],
    ['email', original.email, copy.email],
    ['phone', original.phone, copy.phone],
    ['parentPhone', original.parentPhone, copy.parentPhone],
    ['year', original.year, copy.year],
    ['section', original.section, copy.section],
    ['mentor', original.mentorName, copy.mentorName],
    ['cgpa', original.cgpa, copy.cgpa],
    ['sgpa', original.sgpa, copy.sgpa],
    ['resumeScore', original.resumeScore, copy.resumeScore],
    ['attendance %', original.attendance.percentage, copy.attendance.percentage],
    ['lectures held', original.attendance.totalLectures, copy.attendance.totalLectures],
    ['lectures attended', original.attendance.attendedLectures, copy.attendance.attendedLectures],
    ['attendance papers', original.attendance.subjects.length, copy.attendance.subjects.length],
    ['ia rows', original.iaMarks.length, copy.iaMarks.length],
    ['active arrears', original.backlogs.activeCount, copy.backlogs.activeCount],
    ['cleared arrears', original.backlogs.historyCount, copy.backlogs.historyCount],
    ['arrear subjects', original.backlogs.subjects.join('|'), copy.backlogs.subjects.join('|')],
    ['placement status', original.placementStatus.status, copy.placementStatus.status],
    ['company', original.placementStatus.company, copy.placementStatus.company],
    ['package', original.placementStatus.package, copy.placementStatus.package],
    ['remarks', original.mentorRemarks.length, copy.mentorRemarks.length],
  ];

  for (const [field, a, b] of compare) {
    const same = typeof a === 'number' ? Math.abs(a - Number(b)) < 0.005 : String(a ?? '') === String(b ?? '');
    if (!same) mismatches.push(`${original.usn} ${field}: exported ${JSON.stringify(a)} -> read ${JSON.stringify(b)}`);
  }

  for (const m of original.iaMarks) {
    const hit = copy.iaMarks.find((x) => x.code === m.code);
    if (!hit) { mismatches.push(`${original.usn} IA ${m.code}: missing`); continue; }
    if (hit.ia1 !== m.ia1 || hit.ia2 !== m.ia2 || hit.maxMarks !== m.maxMarks) {
      mismatches.push(`${original.usn} IA ${m.code}: ${m.ia1}/${m.ia2} -> ${hit.ia1}/${hit.ia2}`);
    }
  }

  for (const sub of original.attendance.subjects) {
    const hit = copy.attendance.subjects.find((x) => x.code === sub.code);
    if (!hit) { mismatches.push(`${original.usn} attendance ${sub.code}: missing`); continue; }
    if (hit.held !== sub.held || hit.attended !== sub.attended || hit.kind !== sub.kind) {
      mismatches.push(`${original.usn} attendance ${sub.code}: ${sub.attended}/${sub.held} ${sub.kind} -> ${hit.attended}/${hit.held} ${hit.kind}`);
    }
  }
}
check('all fields survived the round trip', mismatches.length === 0,
  mismatches.slice(0, 8).join('\n        ') + (mismatches.length > 8 ? `\n        ...and ${mismatches.length - 8} more` : ''));

console.log('\nDiff engine');
const clean = diffImport(back, cohort);
check('re-importing an untouched export changes nothing',
  clean.counts.updated === 0 && clean.counts.created === 0,
  JSON.stringify(clean.counts) + (clean.updated[0] ? ` first: ${JSON.stringify(clean.updated[0].changes)}` : ''));

const edited = back.map((s, i) => (i === 0 ? { ...s, cgpa: 9.99, name: 'Renamed Student' } : s));
const dirty = diffImport(edited, cohort);
check('an edited cell is detected', dirty.counts.updated === 1, JSON.stringify(dirty.counts));
check('the changed fields are named',
  dirty.updated[0]?.changes.some((c) => c.field === 'CGPA') && dirty.updated[0]?.changes.some((c) => c.field === 'Name'),
  JSON.stringify(dirty.updated[0]?.changes));

const added = [...back, { ...back[0], usn: '1AP24CS999', name: 'New Admission' }];
check('a new USN is reported as an addition', diffImport(added, cohort).counts.created === 1);

console.log('\nOther workbooks');
const template = buildTemplateWorkbook();
const parsedTemplate = parseDepartmentWorkbook(template);
check('template parses back', parsedTemplate.students.length === 1, JSON.stringify(parsedTemplate.issues));
check('template keeps its example intact', parsedTemplate.students[0]?.usn === '1AP24CS001');

const notice = buildDefaulterNotice(cohort);
const expectedDefaulters = cohort.filter((s) => s.attendance.percentage < 75).length;
check('defaulter notice lists every student below 75%', notice.count === expectedDefaulters,
  `notice ${notice.count}, cohort ${expectedDefaulters}`);
check('defaulter notice is a real file', notice.buffer.length > 2000, kb(notice.buffer.length));

console.log(
  failures === 0
    ? `\nAll checks passed. ${cohort.length} students survived export -> import unchanged.\n`
    : `\n${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
