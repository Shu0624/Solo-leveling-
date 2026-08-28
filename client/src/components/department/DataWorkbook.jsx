import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, Upload, FileSpreadsheet, Archive, RotateCcw,
  AlertTriangle, Check, Loader2, FileWarning, ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Rule, SectionTitle } from './primitives';
import { formatBytes } from './useDepartmentConsole';

/**
 * Data & Storage — the workbook side of the console.
 *
 * The premise: a spreadsheet is the file format every department already has,
 * and it is a perfectly good cold store. Detail that nobody queries after the
 * semester closes — the paper-wise attendance ledger, internal assessment
 * rows, years of proctor notes — goes out to a workbook the college keeps, and
 * comes off the student records. Upload the same file and it all comes back.
 */

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function ActionRow({ icon: Icon, title, detail, cta, onClick, busy, disabled }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5">
      <span className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-prose">{detail}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {cta}
      </button>
    </div>
  );
}

function IssueList({ issues }) {
  if (!issues?.length) return null;
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity !== 'error');

  return (
    <div className="space-y-3">
      {[['Errors', errors, 'text-destructive'], ['Notes', warnings, 'text-warning']].map(
        ([label, list, tone]) => list.length > 0 && (
          <div key={label}>
            <h5 className={cn('text-xs font-semibold uppercase tracking-wider mb-1.5', tone)}>
              {label} ({list.length})
            </h5>
            <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {list.slice(0, 40).map((i, k) => (
                <li key={k} className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-mono text-foreground/70">{i.sheet}</span>
                  {i.row ? <span className="font-mono text-foreground/70">:{i.row}</span> : null} — {i.message}
                </li>
              ))}
              {list.length > 40 && (
                <li className="text-xs text-muted-foreground">…and {list.length - 40} more.</li>
              )}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

/** The change list. This is what makes an import safe to agree to. */
function DiffPreview({ preview, onApply, onDiscard, applying }) {
  const { diff, issues, fileName, canCommit, blockedReason, sheetsRead, schemaVersion, schemaExpected } = preview;
  const c = diff.counts;
  const [expanded, setExpanded] = useState(false);

  const rows = expanded ? diff.updated : diff.updated.slice(0, 6);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{fileName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {sheetsRead?.length ? `Read ${sheetsRead.join(', ')}` : 'Read the Register sheet'}
              {schemaVersion && schemaVersion !== schemaExpected && (
                <span className="text-warning"> · written for schema {schemaVersion}, this console expects {schemaExpected}</span>
              )}
            </div>
          </div>
          <button
            onClick={onDiscard}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Discard
          </button>
        </div>
      </div>

      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="tnum"><strong className="text-foreground">{c.rows}</strong> <span className="text-muted-foreground">rows read</span></span>
          <span className="tnum"><strong className="text-success">{c.created}</strong> <span className="text-muted-foreground">to add</span></span>
          <span className="tnum"><strong className="text-warning">{c.updated}</strong> <span className="text-muted-foreground">to change</span></span>
          <span className="tnum"><strong className="text-muted-foreground">{c.unchanged}</strong> <span className="text-muted-foreground">unchanged</span></span>
          {c.notInFile > 0 && (
            <span className="tnum"><strong className="text-muted-foreground">{c.notInFile}</strong> <span className="text-muted-foreground">on roll but not in this file</span></span>
          )}
        </div>
        {c.notInFile > 0 && (
          <p className="text-xs text-muted-foreground mt-2.5">
            Students missing from the file are left exactly as they are. An import never deletes anybody.
          </p>
        )}
      </div>

      {diff.updated.length > 0 && (
        <div className="px-4 py-3.5 border-b border-border">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            What changes
          </h5>
          <ul className="space-y-2.5">
            {rows.map((u) => (
              <li key={u.usn} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{u.usn}</span>
                  <span className="text-foreground">{u.name}</span>
                </div>
                <ul className="mt-1 ml-1 space-y-0.5">
                  {u.changes.map((ch, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <span className="text-foreground/70">{ch.field}</span>
                      <span className="line-through opacity-60 tnum">{String(ch.before) || 'blank'}</span>
                      <ArrowRight size={10} className="opacity-50" />
                      <span className="text-foreground tnum">{String(ch.after)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {diff.updated.length > 6 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? 'Show fewer' : `Show all ${diff.updated.length} changed students`}
            </button>
          )}
        </div>
      )}

      {diff.created.length > 0 && (
        <div className="px-4 py-3.5 border-b border-border">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            New students ({diff.created.length})
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {diff.created.slice(0, 12).map((s) => `${s.usn} ${s.name}`).join(' · ')}
            {diff.created.length > 12 ? ` …and ${diff.created.length - 12} more` : ''}
          </p>
        </div>
      )}

      {issues?.length > 0 && (
        <div className="px-4 py-3.5 border-b border-border">
          <IssueList issues={issues} />
        </div>
      )}

      <div className="px-4 py-3 flex items-center justify-between gap-3 bg-secondary/30">
        <p className="text-xs text-muted-foreground max-w-md">
          {blockedReason || 'Nothing has been written yet. Applying updates the register in place; remarks are appended, never overwritten.'}
        </p>
        <button
          type="button"
          onClick={onApply}
          disabled={!canCommit || applying || (c.created === 0 && c.updated === 0)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {applying ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {applying ? 'Applying' : `Apply ${c.created + c.updated} change${c.created + c.updated === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

export default function DataWorkbook({ controller: dc, isFiltered, viewCount, totalCount }) {
  const {
    exportRegister, exportDefaulterNotice, exportTemplate,
    previewImport, commitImport, fetchStorage, archive,
    busy, meta,
  } = dc;

  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [importError, setImportError] = useState(null);
  const [result, setResult] = useState(null);

  const [storage, setStorage] = useState(null);
  const [selected, setSelected] = useState([]);

  const readOnly = Boolean(meta?.readOnly);

  const loadStorage = useCallback(async () => {
    try {
      const data = await fetchStorage();
      setStorage(data);
      setSelected(data.categories.map((c) => c.key));
    } catch {
      setStorage(null);
    }
  }, [fetchStorage]);

  useEffect(() => { loadStorage(); }, [loadStorage]);

  const handleFile = async (file) => {
    if (!file) return;
    setImportError(null);
    setResult(null);
    setPreview(null);
    setPendingFile(file);
    setReading(true);
    try {
      setPreview(await previewImport(file));
    } catch (err) {
      setImportError(err.response?.data?.message || 'That file could not be read. Download the template to see the shape the importer expects.');
      setPendingFile(null);
    } finally {
      setReading(false);
    }
  };

  const apply = async () => {
    if (!pendingFile) return;
    setApplying(true);
    try {
      const res = await commitImport(pendingFile);
      setResult(res);
      setPreview(null);
      setPendingFile(null);
      loadStorage();
    } catch (err) {
      setImportError(err.response?.data?.message || 'The import did not complete. Nothing was written.');
    } finally {
      setApplying(false);
    }
  };

  const estimateFor = (keys) => {
    if (!storage) return { rows: 0, bytes: 0 };
    return storage.estimate.breakdown
      .filter((b) => keys.includes(b.key))
      .reduce((acc, b) => ({ rows: acc.rows + b.rows, bytes: acc.bytes + b.bytes }), { rows: 0, bytes: 0 });
  };

  const chosen = estimateFor(selected);
  const share = storage?.estimate?.documentBytes
    ? Math.round((chosen.bytes / storage.estimate.documentBytes) * 100)
    : 0;

  return (
    <div className="space-y-10">
      {/* ── Download ──────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle note="Every sheet round-trips: what comes out of here can be edited in Excel and read straight back in.">
          Take the register out
        </SectionTitle>

        <div className="rounded-xl border border-border divide-y divide-border px-4">
          <ActionRow
            icon={FileSpreadsheet}
            title="Full department register"
            detail={`All ${totalCount} students across six sheets — roll, paper-wise attendance, internal assessment, arrears, placement and proctor remarks.`}
            cta="Download"
            busy={busy === 'register'}
            onClick={() => exportRegister('all')}
          />
          <ActionRow
            icon={Download}
            title="Just what I am looking at"
            detail={
              isFiltered
                ? `The ${viewCount} student${viewCount === 1 ? '' : 's'} currently filtered, with the filter recorded on the Summary sheet.`
                : 'Filter the register first — this exports exactly the rows on screen, filters and sort included.'
            }
            cta="Download"
            busy={busy === 'view'}
            disabled={!isFiltered}
            onClick={() => exportRegister('filtered')}
          />
          <ActionRow
            icon={FileWarning}
            title="Shortage of attendance notice"
            detail="A signed-off sheet for the examination cell: who is below the requirement, by how much, how many classes would fix it, and the parent contact number."
            cta="Download"
            busy={busy === 'notice'}
            onClick={exportDefaulterNotice}
          />
          <ActionRow
            icon={FileSpreadsheet}
            title="Blank template"
            detail="The same six sheets with headers, one worked example and the rules on the first sheet. Hand this to whoever maintains the register."
            cta="Download"
            busy={busy === 'template'}
            onClick={exportTemplate}
          />
        </div>
      </section>

      {/* ── Import ────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle note="Upload a workbook and you get a row-by-row account of what would change. Nothing is written until you say so.">
          Bring a workbook back in
        </SectionTitle>

        {result ? (
          <div className="rounded-xl border border-success/30 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <Check size={16} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">{result.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Read from {result.fileName}. The register above has been refreshed.
                </p>
                {result.written?.failed?.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {result.written.failed.slice(0, 5).map((f, i) => (
                      <li key={i} className="text-xs text-destructive">{f.usn}: {f.message}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setResult(null)} className="mt-2.5 text-xs font-medium text-primary hover:underline">
                  Import another file
                </button>
              </div>
            </div>
          </div>
        ) : preview ? (
          <DiffPreview
            preview={preview}
            applying={applying}
            onApply={apply}
            onDiscard={() => { setPreview(null); setPendingFile(null); }}
          />
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
                dragging ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              {reading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={15} className="animate-spin" /> Reading the workbook…
                </div>
              ) : (
                <>
                  <Upload size={18} className="mx-auto text-muted-foreground" />
                  <p className="text-sm text-foreground mt-2.5">
                    Drop an .xlsx workbook here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      choose a file
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                    Matched on USN. Existing students are updated, new USNs are added, and anyone missing
                    from the file is left untouched.
                  </p>
                </>
              )}
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx,.xlsm,.xls"
                className="sr-only"
                onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>

            {importError && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{importError}</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Archive ───────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle note="Detail nobody queries after the term closes does not need to sit in the database. Export it, take it off the records, put it back whenever you need it.">
          Archive and reclaim space
        </SectionTitle>

        {!storage ? (
          <div className="rounded-xl border border-border px-4 py-6 text-sm text-muted-foreground">
            Working out what is stored…
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <ul className="divide-y divide-border">
              {storage.estimate.breakdown.map((b) => {
                const spec = storage.categories.find((c) => c.key === b.key);
                const on = selected.includes(b.key);
                return (
                  <li key={b.key}>
                    <label className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-secondary/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setSelected((s) => (on ? s.filter((k) => k !== b.key) : [...s, b.key]))}
                        className="mt-1 w-4 h-4 rounded border-border accent-[hsl(var(--primary))]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-foreground font-medium">{b.label}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{spec?.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="tnum text-sm text-foreground">{formatBytes(b.bytes)}</div>
                        <div className="tnum text-xs text-muted-foreground">{b.rows.toLocaleString()} rows</div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 py-3.5 bg-secondary/30 border-t border-border">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-sm text-foreground">
                    <span className="tnum font-semibold">{formatBytes(chosen.bytes)}</span>
                    <span className="text-muted-foreground"> released from </span>
                    <span className="tnum">{storage.estimate.studentCount}</span>
                    <span className="text-muted-foreground"> student records</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {share}% of the {formatBytes(storage.estimate.documentBytes)} those records currently occupy
                    {chosen.rows > 0 ? ` · ${chosen.rows.toLocaleString()} rows move to the workbook` : ''}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => archive(selected)}
                  disabled={!selected.length || busy === 'archive'}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {busy === 'archive' ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                  Export and prune
                </button>
              </div>

              <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-prose">
                The workbook downloads first; records are only trimmed once the file is on its way.{' '}
                {readOnly
                  ? 'This is a demo session, so nothing will actually be pruned.'
                  : 'Upload it again under "Bring a workbook back in" to restore every archived row.'}
              </p>
            </div>
          </div>
        )}

        {storage?.archives?.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Previously archived
            </h4>
            <ul className="divide-y divide-border border-y border-border">
              {storage.archives.map((a) => (
                <li key={a._id} className="py-2.5 flex items-baseline justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">{a.fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}{a.createdBy}
                      {' · '}{(a.categories || []).length} categor{(a.categories || []).length === 1 ? 'y' : 'ies'}
                      {a.restoredAt ? ' · restored' : ''}
                    </div>
                  </div>
                  <span className="tnum text-xs text-muted-foreground shrink-0">
                    {formatBytes(a.bytesFreed)} freed
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
              <RotateCcw size={12} />
              Restoring is the same upload as any other workbook — the importer works out what is missing.
            </p>
          </div>
        )}
      </section>

      <Rule />
      <p className="text-xs text-muted-foreground leading-relaxed max-w-prose">
        Workbooks are read and written on the server; no student data passes through a third-party service.
        Every export carries a Summary sheet naming who produced it, when, and which filters were in force,
        so a file that turns up six months later can still be placed.
      </p>
    </div>
  );
}
