import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Download, Users, Award, BarChart3, Upload, Loader2, ArrowLeft, ExternalLink, Sparkles, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const FormResults = ({ formId, onBack }) => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    fetchResults();
  }, [formId]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/assessment/form/${formId}/results`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await api.post(`/assessment/form/${formId}/ai-insights`);
      setAiInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      alert('Failed to generate insights. Please try again.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/assessment/form/${formId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data?.title || 'form'}_results.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export. Please try again.');
    }
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      await api.post(`/assessment/form/${formId}/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchResults();
      alert('CSV data imported successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-muted-foreground">Results not found.</div>;

  const avgScore = data.totalResponses > 0
    ? Math.round(data.responses.reduce((a, r) => a + (r.totalScore || 0), 0) / data.totalResponses)
    : 0;

  const maxPossible = (data.questions || []).reduce((a, q) => a + (q.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{data.title} — Results</h2>
            <p className="text-xs text-muted-foreground font-medium">{data.totalResponses} response{data.totalResponses !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-4 py-2.5 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border/50 hover:bg-secondary/70 transition-colors cursor-pointer flex items-center gap-2">
            <Upload size={14} /> Import CSV
            <input ref={csvInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCSVImport} />
          </label>
          <button
            onClick={generateInsights}
            disabled={loadingInsights}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loadingInsights ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Insights
          </button>
          <button onClick={handleExport} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2">
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Responses', value: data.totalResponses, icon: Users, color: 'text-primary' },
          { label: 'Average Score', value: `${avgScore}/${maxPossible}`, icon: BarChart3, color: 'text-accent' },
          { label: 'Max Score', value: maxPossible, icon: Award, color: 'text-success' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-morphism rounded-2xl p-5 text-center"
            >
              <Icon size={24} className={`${stat.color} mx-auto mb-2`} />
              <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-bold mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl overflow-hidden border border-accent/20 shadow-xl shadow-accent/5"
        >
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 px-6 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-accent animate-pulse" size={18} />
              <h3 className="font-extrabold text-foreground text-sm">🤖 AI Cognitive Analysis & Insights</h3>
            </div>
            <button
              onClick={() => setAiInsights('')}
              className="text-muted-foreground hover:text-foreground text-xs font-bold transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="p-6 text-sm text-muted-foreground leading-relaxed space-y-4 custom-markdown-styles">
            <ReactMarkdown>{aiInsights}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* Response Table */}
      <div className="glass-morphism rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-muted/95 border-b border-border/50">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Enrollment ID</th>
                <th className="px-5 py-4">Submitted</th>
                <th className="px-5 py-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.responses.length > 0 ? (
                data.responses.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-foreground font-bold text-sm">{i + 1}</td>
                    <td className="px-5 py-3 text-foreground font-medium text-sm">{r.studentName || 'Unknown'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.studentEnrollmentId || 'N/A'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold text-sm ${
                        (r.totalScore / maxPossible) >= 0.7 ? 'text-success' : (r.totalScore / maxPossible) >= 0.4 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {r.totalScore}/{maxPossible}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-muted-foreground font-medium">
                    No responses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Imported Data */}
      {data.importedData && data.importedData.length > 0 && (
        <div className="glass-morphism rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
            <ExternalLink size={16} className="text-primary" />
            <h3 className="font-bold text-foreground text-sm">Imported Google Form Data ({data.importedData.length} rows)</h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/95 sticky top-0">
                <tr>
                  {Object.keys(data.importedData[0]).map(key => (
                    <th key={key} className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {data.importedData.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-2.5 text-xs text-foreground whitespace-nowrap">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-morphism rounded-2xl p-8 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="font-bold text-foreground">Importing CSV data...</p>
          </div>
        </div>
      )}

      <style>{`
        .custom-markdown-styles h1 { font-size: 1.25rem; font-weight: 800; color: hsl(var(--foreground)); margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .custom-markdown-styles h2 { font-size: 1.1rem; font-weight: 700; color: hsl(var(--foreground)); margin-top: 1.25rem; margin-bottom: 0.5rem; }
        .custom-markdown-styles h3 { font-size: 1rem; font-weight: 600; color: hsl(var(--foreground)); margin-top: 1rem; margin-bottom: 0.25rem; }
        .custom-markdown-styles p { margin-bottom: 0.75rem; line-height: 1.6; }
        .custom-markdown-styles ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .custom-markdown-styles li { margin-bottom: 0.25rem; }
        .custom-markdown-styles strong { color: hsl(var(--foreground)); font-weight: 700; }
        .custom-markdown-styles code { background: hsl(var(--secondary) / 0.5); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; }
      `}</style>
    </div>
  );
};

export default FormResults;
