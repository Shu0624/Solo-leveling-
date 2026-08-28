/**
 * End-to-end check of the department console API.
 *
 *   node server/scripts/verifyDepartmentApi.js
 *
 * Boots the Express app on a spare port with no database configured, drives
 * every route a HOD session touches, and asserts the answers. It covers the
 * parts that are easy to break without noticing: filters that must narrow the
 * table without moving the department totals, workbook headers the browser
 * needs exposed to name a download, the two-phase import, and the role checks.
 *
 * A running MongoDB is not required — with MONGO_URI unset the service serves
 * the reference cohort, which is what these assertions are written against.
 */

process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long_ok';
process.env.NODE_ENV = 'test';
delete process.env.MONGO_URI;

const { default: app } = await import('../app.js');
const server = app.listen(5311);
const base = 'http://127.0.0.1:5311/api';
const H = { Authorization: 'Bearer demo_token_hod_1' };

const get = (p) => fetch(base + p, { headers: H });

let fails = 0;
const check = (label, ok, extra = '') => {
  console.log((ok ? '  ok    ' : '  FAIL  ') + label + (ok ? '' : '   << ' + extra));
  if (!ok) fails += 1;
};

let r, j;

console.log('\nRoster');
r = await get('/department/roster'); j = await r.json();
check('GET /department/roster 200', r.status === 200, r.status + ' ' + JSON.stringify(j).slice(0, 200));
check('summary totals present', j.summary?.totalStudents === 64, JSON.stringify(j.summary?.totalStudents));
check('demo flagged read-only', j.meta?.readOnly === true);
check('origin is demo', j.meta?.origin === 'demo', j.meta?.origin);
console.log('        ' + JSON.stringify({
  students: j.summary.totalStudents, defaulters: j.summary.defaultersCount,
  arrears: j.summary.backlogStudentsCount, eligible: j.summary.placementEligibleCount,
  avgCgpa: j.summary.avgCgpa, avgAtt: j.summary.avgAttendance,
}));

console.log('\nFilters');
r = await get('/department/roster?risk=defaulter'); j = await r.json();
check('defaulter filter narrows the view but not the totals', j.students.length === 9 && j.summary.totalStudents === 64, j.students.length);
r = await get('/department/roster?year=4&section=A'); j = await r.json();
check('year + section filter', j.students.length > 0 && j.students.every((s) => s.year === 4 && s.section === 'A'), j.students.length);
r = await get('/department/roster?search=1AP24CS004'); j = await r.json();
check('search by USN', j.students.length === 1 && j.students[0].usn === '1AP24CS004', j.students.length);
r = await get('/department/roster?sort=attendance'); j = await r.json();
check('sort by attendance ascending', j.students[0].attendance.percentage <= j.students.at(-1).attendance.percentage);
r = await get('/department/roster?risk=defaulter'); j = await r.json();
check('shortfall lectures computed for defaulters', j.students.every((s) => s.attendance.shortfallLectures > 0), JSON.stringify(j.students[0]?.attendance?.shortfallLectures));

console.log('\nDossier');
r = await get('/department/students/1AP24CS004'); j = await r.json();
check('dossier by USN', r.status === 200 && j.student.usn === '1AP24CS004', r.status);
r = await get('/department/students/nope-404');
check('unknown student is 404', r.status === 404, r.status);

console.log('\nWorkbook downloads');
r = await get('/department/workbook/register.xlsx');
const buf = Buffer.from(await r.arrayBuffer());
check('register.xlsx downloads', r.status === 200 && buf.length > 10000, r.status + ' ' + buf.length);
check('spreadsheet content type', (r.headers.get('content-type') || '').includes('spreadsheetml'), r.headers.get('content-type'));
check('attachment filename set', /attachment; filename=/.test(r.headers.get('content-disposition') || ''), r.headers.get('content-disposition'));
check('row count header exposed', r.headers.get('x-row-count') === '64', r.headers.get('x-row-count'));
check('expose-headers lets the browser read them', (r.headers.get('access-control-expose-headers') || '').includes('X-Row-Count'), r.headers.get('access-control-expose-headers'));

r = await get('/department/workbook/register.xlsx?scope=filtered&risk=defaulter');
check('filtered export honours the filter', r.headers.get('x-row-count') === '9', r.headers.get('x-row-count'));
r = await get('/department/workbook/template.xlsx');
check('template.xlsx downloads', r.status === 200, r.status);
r = await get('/department/workbook/defaulters.xlsx');
check('defaulter notice downloads', r.status === 200 && r.headers.get('x-row-count') === '9', r.status + ' ' + r.headers.get('x-row-count'));

console.log('\nWorkbook import');
const form = (bytes, name) => { const f = new FormData(); f.append('workbook', new Blob([bytes]), name); return f; };

r = await fetch(base + '/department/workbook/import', { method: 'POST', headers: H, body: form(buf, 'CSE-Register.xlsx') });
j = await r.json();
check('import preview 200', r.status === 200, r.status + ' ' + JSON.stringify(j).slice(0, 300));
check('untouched export previews as no change', j.diff?.counts?.updated === 0 && j.diff?.counts?.created === 0, JSON.stringify(j.diff?.counts));
check('demo commit is blocked with a reason', j.canCommit === false && Boolean(j.blockedReason), JSON.stringify({ c: j.canCommit, b: j.blockedReason }));
check('all six sheets were read', Array.isArray(j.sheetsRead) && j.sheetsRead.length === 6, JSON.stringify(j.sheetsRead));

r = await fetch(base + '/department/workbook/import?mode=commit', { method: 'POST', headers: H, body: form(buf, 'x.xlsx') });
check('demo commit refused with 403', r.status === 403, r.status);

r = await fetch(base + '/department/workbook/import', { method: 'POST', headers: H, body: form(Buffer.from('not a spreadsheet'), 'notes.xlsx') });
check('unreadable file rejected cleanly', r.status === 422, r.status + ' ' + (await r.text()).slice(0, 140));

r = await fetch(base + '/department/workbook/import', { method: 'POST', headers: H, body: form(Buffer.from('x'), 'roster.pdf') });
check('non-xlsx rejected', r.status >= 400, r.status);

console.log('\nStorage');
r = await get('/department/storage'); j = await r.json();
check('storage estimate 200', r.status === 200, r.status);
check('three archivable categories', j.estimate?.breakdown?.length === 3, JSON.stringify(j.estimate?.breakdown?.map((b) => b.key)));
console.log('        ' + j.estimate.breakdown.map((b) => `${b.key}: ${b.rows} rows / ${(b.bytes / 1024).toFixed(1)}KB`).join('  |  '));
console.log('        documents total: ' + (j.estimate.documentBytes / 1024).toFixed(1) + 'KB');

r = await fetch(base + '/department/storage/archive', {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ dryRun: true }),
});
j = await r.json();
check('archive dry run estimates without producing a file', r.status === 200 && j.dryRun === true, r.status);

r = await fetch(base + '/department/storage/archive', {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: ['iaMarks', 'remarks'] }),
});
check('archive returns a workbook', r.status === 200 && (r.headers.get('content-type') || '').includes('spreadsheetml'), r.status);
check('archive honestly reports nothing pruned in demo', r.headers.get('x-archive-applied') === 'false', r.headers.get('x-archive-applied'));

console.log('\nAuthorization');
r = await fetch(base + '/department/roster', { headers: { Authorization: 'Bearer demo_token_student_1' } });
check('student role blocked from the roster', r.status === 403, r.status);

r = await fetch(base + '/department/roster', { headers: { Authorization: 'Bearer demo_token_faculty_1' } });
j = await r.json();
check('faculty sees only their assigned classes',
  r.status === 200 && j.students.length > 0 && j.students.length < 64 &&
  j.students.every((s) => ['CSE-3A', 'CSE-4B'].includes(s.classroomCode)),
  `${r.status}, ${j.students?.length} students, codes ${[...new Set((j.students || []).map((s) => s.classroomCode))].join(',')}`);
check('faculty totals are scoped to the same set', j.summary?.totalStudents === j.students.length,
  `${j.summary?.totalStudents} vs ${j.students.length}`);

r = await fetch(base + '/department/roster');
check('missing token blocked', r.status === 401, r.status);
r = await fetch(base + '/department/students/abc', { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: '{}' });
check('demo write blocked on record update', r.status === 403, r.status);

console.log('\nBackward compatibility');
r = await get('/dashboard/hod/cse-students'); j = await r.json();
check('legacy /dashboard/hod/cse-students still serves', r.status === 200 && j.students.length === 64, r.status);

console.log(fails === 0 ? '\nAll API checks passed.\n' : `\n${fails} API check(s) failed.\n`);
server.close();
process.exit(fails === 0 ? 0 : 1);
