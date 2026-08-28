import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * All the talking-to-the-server the department console does.
 *
 * Filters live here rather than in the table so the workbook downloads can
 * reuse them — "export what I am looking at" has to mean exactly what is on
 * screen, which only works if one object defines both.
 */

export const EMPTY_FILTERS = {
  year: 'all',
  section: 'all',
  risk: 'all',
  mentor: 'all',
  search: '',
  sort: 'usn',
  order: 'asc',
};

const toQuery = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== 'all' && String(v).trim() !== '') params.append(k, v);
  });
  return params.toString();
};

/** Pull the filename the server chose out of Content-Disposition. */
const filenameFrom = (headers, fallback) => {
  const cd = headers?.['content-disposition'] || '';
  const match = cd.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : fallback;
};

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking straight away cancels the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/** A blob response can still be a JSON error. Read it before assuming success. */
const readBlobError = async (error) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text())?.message;
    } catch {
      return null;
    }
  }
  return data?.message;
};

export function useDepartmentConsole() {
  const { api, user } = useAuth();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busy, setBusy] = useState(null); // label of the download in flight
  const [notice, setNotice] = useState(null); // { tone, text }

  const requestId = useRef(0);

  /* --- roster ----------------------------------------------------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 220);
    return () => clearTimeout(t);
  }, [filters.search]);

  const query = useMemo(
    () => toQuery({ ...filters, search: debouncedSearch }),
    [filters.year, filters.section, filters.risk, filters.mentor, filters.sort, filters.order, debouncedSearch]
  );

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await api.get(`/department/roster?${query}`);
      if (id !== requestId.current) return; // a newer request has already landed
      setSummary(res.data.summary);
      setStudents(res.data.students || []);
      setMeta(res.data.meta);
      setError(null);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || 'The department register could not be loaded. Check your connection and try again.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [api, query]);

  useEffect(() => { load(); }, [load]);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const toggleSort = useCallback((column) => {
    setFilters((f) => ({
      ...f,
      sort: column,
      order: f.sort === column && f.order === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const isFiltered = useMemo(
    () => JSON.stringify({ ...filters, sort: 'usn', order: 'asc' }) !== JSON.stringify(EMPTY_FILTERS),
    [filters]
  );

  /* --- downloads -------------------------------------------------------- */

  const download = useCallback(async (path, fallbackName, label) => {
    setBusy(label);
    setNotice(null);
    try {
      const res = await api.get(path, { responseType: 'blob' });
      const name = filenameFrom(res.headers, fallbackName);
      saveBlob(res.data, name);
      const rows = res.headers['x-row-count'];
      setNotice({
        tone: 'success',
        text: rows ? `${name} saved — ${rows} row${rows === '1' ? '' : 's'}.` : `${name} saved.`,
      });
      return { ok: true, headers: res.headers, name };
    } catch (err) {
      setNotice({ tone: 'error', text: (await readBlobError(err)) || 'The download did not complete. Try again.' });
      return { ok: false };
    } finally {
      setBusy(null);
    }
  }, [api]);

  const exportRegister = useCallback(
    (scope = 'all') => download(
      `/department/workbook/register.xlsx?scope=${scope}&${query}`,
      'CSE-Register.xlsx',
      scope === 'filtered' ? 'view' : 'register'
    ),
    [download, query]
  );

  const exportDefaulterNotice = useCallback(
    () => download('/department/workbook/defaulters.xlsx', 'CSE-Attendance-Shortage-Notice.xlsx', 'notice'),
    [download]
  );

  const exportTemplate = useCallback(
    () => download('/department/workbook/template.xlsx', 'CSE-Register-Template.xlsx', 'template'),
    [download]
  );

  /* --- import ----------------------------------------------------------- */

  const previewImport = useCallback(async (file) => {
    const body = new FormData();
    body.append('workbook', file);
    const res = await api.post('/department/workbook/import', body);
    return res.data;
  }, [api]);

  const commitImport = useCallback(async (file) => {
    const body = new FormData();
    body.append('workbook', file);
    const res = await api.post('/department/workbook/import?mode=commit', body);
    await load();
    return res.data;
  }, [api, load]);

  /* --- storage ---------------------------------------------------------- */

  const fetchStorage = useCallback(async () => {
    const res = await api.get('/department/storage');
    return res.data;
  }, [api]);

  const archive = useCallback(async (categories) => {
    setBusy('archive');
    setNotice(null);
    try {
      const res = await api.post(
        '/department/storage/archive',
        { categories },
        { responseType: 'blob' }
      );
      const name = filenameFrom(res.headers, 'CSE-Archive.xlsx');
      saveBlob(res.data, name);

      const applied = res.headers['x-archive-applied'] === 'true';
      const freed = Number(res.headers['x-archive-bytes-freed'] || 0);
      const pruned = Number(res.headers['x-archive-documents-pruned'] || 0);

      setNotice({
        tone: applied ? 'success' : 'info',
        text: applied
          ? `${name} saved. ${formatBytes(freed)} released across ${pruned} student record${pruned === 1 ? '' : 's'}.`
          : `${name} saved. Nothing was pruned — this roster is not stored in the database yet.`,
      });
      await load();
      return { ok: true, applied, freed, pruned, name };
    } catch (err) {
      setNotice({ tone: 'error', text: (await readBlobError(err)) || 'The archive did not complete. Nothing was changed.' });
      return { ok: false };
    } finally {
      setBusy(null);
    }
  }, [api, load]);

  /* --- record edits ----------------------------------------------------- */

  const addRemark = useCallback(async (student, note, category) => {
    const entry = {
      date: new Date().toISOString(),
      author: user?.name || 'Department Console',
      note,
      category,
    };
    try {
      await api.put(`/department/students/${student._id}`, { newRemark: { note, category } });
    } catch (err) {
      // A reference-roster student has nowhere to save to. The note still
      // belongs on screen for the rest of the session; say why it is not filed.
      const code = err.response?.data?.code;
      if (code !== 'NOT_IN_DATABASE' && code !== 'DEMO_READ_ONLY') throw err;
      setNotice({ tone: 'info', text: err.response.data.message });
    }

    const updated = { ...student, mentorRemarks: [entry, ...(student.mentorRemarks || [])] };
    setStudents((list) => list.map((s) => (s._id === student._id ? updated : s)));
    return updated;
  }, [api, user]);

  return {
    filters, setFilter, resetFilters, toggleSort, isFiltered,
    summary, students, meta, loading, error, reload: load,
    busy, notice, setNotice,
    exportRegister, exportDefaulterNotice, exportTemplate,
    previewImport, commitImport,
    fetchStorage, archive,
    addRemark,
  };
}

export const formatBytes = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

export default useDepartmentConsole;
