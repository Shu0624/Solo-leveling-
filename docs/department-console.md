# Department console

The HOD and teacher view of a department: who is on roll, who is short of
attendance, who is carrying arrears, who can be sent to a company — and the
Excel round-trip that keeps all of it portable.

Open it at `/hod`, or sign in as a HOD and land on it from `/dashboard`.

---

## What is on screen

**Register** — the roster as a table. Sortable columns, a search box that covers
name, USN, roll number and proctor, and filter chips for the lists a HOD is
actually asked for: short of attendance, close to the line, arrears pending,
placement eligible, merit list. Selecting a student opens the full record:
academics, attendance, arrears, placement and the proctor remarks log.

The department totals across the top never change when you filter. A filtered
table is a view; the number you report upward is the department.

**Data & storage** — workbook exports, workbook imports, and archiving. See
below.

Teaching faculty see the classes assigned to them. A HOD, principal or
placement officer sees the whole department. This is the same rule
`canAccessStudent()` enforces everywhere else in the app.

---

## The Excel round-trip

Every figure the console shows can be written to a workbook, edited in Excel,
and read straight back. Export and import are driven by one column spec
(`server/services/workbookService.js`), so a column cannot be added to the
export and forgotten on the way back in.

### Sheets

| Sheet | One row is |
|---|---|
| `Summary` | Not data — department totals plus the provenance of the file: schema version, scope, filters in force, who generated it, when, and a content checksum |
| `Register` | One student: identity, standing, attendance summary, arrear counts |
| `Attendance` | One paper for one student: classes held and attended |
| `IA Marks` | One paper for one student: IA-1, IA-2, out of max |
| `Arrears` | One arrear subject, `Active` or `Cleared` |
| `Placement` | One student: eligibility, offer, package |
| `Remarks` | One proctor note |

Four columns are recomputed on import and ignored if edited: Attendance Status,
Lectures To Recover, Subject %, Eligibility.

### Downloads

| What | Route |
|---|---|
| Full register | `GET /api/department/workbook/register.xlsx` |
| Only the filtered view | `GET /api/department/workbook/register.xlsx?scope=filtered&…` |
| Shortage-of-attendance notice | `GET /api/department/workbook/defaulters.xlsx` |
| Blank template with the rules | `GET /api/department/workbook/template.xlsx` |

The notice is the sheet the examination cell asks for: who is below the
requirement, by how much, how many consecutive classes would clear it, the
proctor, and the parent contact number — with a signature strip at the bottom.

### Upload

`POST /api/department/workbook/import` is two-phase on purpose.

1. **Preview** (default). The file is parsed and diffed against what is stored.
   You get a row-by-row account: students to add, fields that would change with
   before and after values, rows that are identical, and students on roll that
   the file does not mention. Nothing is written.
2. **Commit** (`?mode=commit`). Applies the diff.

Matching is on USN, then enrolment id, then email — in that order, because that
is the order of how identifying they actually are. Students missing from the
file are left untouched; an import never deletes anybody. Remarks are appended,
never rewritten, unless you pass `?strategy=replace`.

Malformed rows are reported, not silently dropped. An attendance figure above
the classes held, an IA score above the maximum, a duplicate USN, a detail row
whose USN is not in `Register` — each produces a named issue against the sheet
and row number it came from.

---

## Archiving: Excel as the cold store

A student document is small until you attach a subject-wise attendance ledger,
five IA rows and a couple of years of proctor notes. For the 64-student
reference cohort that detail is roughly 85 KB of the 137 KB those records
occupy — about 62%, and it grows every term while nobody queries the old
semesters.

**Data & storage → Archive and reclaim space** does the obvious thing:

1. Builds a workbook containing everything selected.
2. Sends it to you.
3. *Then* prunes those fields from the student documents, leaving the
   aggregates the console renders — percentage, CGPA, arrear counts.
4. Writes a small `DataArchive` ledger entry: what, when, by whom, how many
   bytes, and the checksum.

The order matters: nothing is ever removed from a record before it exists
somewhere else.

Restoring is the same upload as any other workbook. The importer works out what
is missing and puts it back.

Categories are chosen per run:

- `attendanceLedger` — per-paper classes held and attended
- `iaMarks` — IA-1 and IA-2 per paper
- `remarks` — the proctor and counselling log

`POST /api/department/storage/archive` with `{ "dryRun": true }` reports what a
run would reclaim without producing a file. `GET /api/department/storage` is
what the panel renders.

---

## Demo sessions

The login page offers one-click access without an account. Those sessions carry
a `demo_token_<role>_<ts>` string instead of a JWT, recognised in
`server/middleware/auth.js` and given a synthetic identity flagged `isDemo`.

A demo session serves the reference cohort and only the reference cohort — it
never reads or writes a real student record. Workbook downloads and import
*previews* work fully (uploading your own file gives you a real diff against
the sample roster); commits and record edits return `403 DEMO_READ_ONLY` with a
message the interface shows.

Set `ALLOW_DEMO_LOGIN=false` to turn demo access off entirely.

---

## Where the data comes from

`resolveCohort()` in `server/services/departmentService.js` resolves in this
order:

1. Demo session → the reference cohort, scoped to the role.
2. Students in the caller's department → the database.
3. Department is empty → the reference cohort, so a fresh install is not a
   blank screen. `meta.origin` says `reference`, and the masthead labels it
   "sample roster" rather than pretending otherwise.

The reference cohort (`server/data/cseCohort.js`) is 64 students generated from
a fixed seed, so the same roster comes out on every process — an export has to
be diffable against yesterday's export. Attendance percentages, ledger sums, IA
totals and arrear counts are consistent by construction, not by hand.

---

## Verifying

```bash
npm run verify:workbook     # export -> import -> compare every field
npm run verify:department   # boot the API, drive every route, check the answers
npm run verify              # both
```

`verify:workbook` is the one to run after touching the column specs: a column
added to the export but not wired for import fails there rather than silently
dropping a teacher's data. Neither script needs a database.

---

## Routes

| Method | Route | Who |
|---|---|---|
| GET | `/api/department/roster` | HOD, faculty, principal, placement, admin |
| GET | `/api/department/students/:id` | same |
| PUT | `/api/department/students/:id` | HOD, faculty, principal, admin |
| GET | `/api/department/workbook/register.xlsx` | staff |
| GET | `/api/department/workbook/template.xlsx` | staff |
| GET | `/api/department/workbook/defaulters.xlsx` | staff |
| POST | `/api/department/workbook/import` | HOD, faculty, principal, admin |
| GET | `/api/department/storage` | staff |
| POST | `/api/department/storage/archive` | HOD, principal, admin |
| GET | `/api/department/storage/archives` | staff |

`GET /api/dashboard/hod/cse-students` and `PUT /api/dashboard/student-record/:id`
still work and delegate to the same service. They are kept for clients already
pointing at them; new work should use `/api/department`.
