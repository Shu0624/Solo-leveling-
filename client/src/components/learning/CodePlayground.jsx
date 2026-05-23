import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Code2, ChevronDown, ChevronUp, Terminal, Loader2, Copy, Check } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', starter: '// Write your JavaScript code here\nconsole.log("Hello, LevelUp!");' },
  { value: 'python', label: 'Python', starter: '# Write your Python code here\nprint("Hello, LevelUp!")' },
];

const CodePlayground = () => {
  const { api } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(LANGUAGES.find(l => l.value === lang)?.starter || '');
    setOutput(null);
    setError(null);
  };

  const runCode = async () => {
    if (!code.trim() || running) return;
    setRunning(true);
    setOutput(null);
    setError(null);

    try {
      const res = await api.post('/modules/execute', { code, language });
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setOutput(res.data.output || '(no output)');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-8 border border-border/50 rounded-2xl overflow-hidden bg-background/50">
      {/* Toggle Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Code2 size={18} />
          </div>
          <span className="font-semibold text-sm text-foreground">Try it yourself</span>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 p-4 space-y-3">
              {/* Language Selector + Run */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={runCode}
                    disabled={running || !code.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
                  >
                    {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    {running ? 'Running...' : 'Run Code'}
                  </button>
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(code);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  title="Copy current code"
                >
                  {codeCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Code Editor */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-48 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm p-4 rounded-xl border border-border/30 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                style={{ tabSize: 2 }}
                onKeyDown={(e) => {
                  // Handle Tab key for indentation
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    setCode(code.substring(0, start) + '  ' + code.substring(end));
                    setTimeout(() => {
                      e.target.selectionStart = e.target.selectionEnd = start + 2;
                    }, 0);
                  }
                }}
              />

              {/* Output Panel */}
              {(output || error) && (
                <div className={`rounded-xl p-4 text-sm font-mono border relative group ${
                  error 
                    ? 'bg-destructive/5 border-destructive/20 text-destructive' 
                    : 'bg-secondary border-border/50 text-foreground'
                }`}>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(error || output);
                          setOutputCopied(true);
                          setTimeout(() => setOutputCopied(false), 2000);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-[#1e1e2e]/80 hover:bg-[#1e1e2e] border border-white/10 text-white/50 hover:text-white transition-all shadow-md"
                      title="Copy output"
                    >
                      {outputCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider opacity-60">
                    <Terminal size={12} /> {error ? 'Error' : 'Output'}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {error || output}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodePlayground;
