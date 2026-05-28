import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Code2, ChevronDown, ChevronUp, Terminal, Loader2, Copy, Check, Clipboard, Trash2, RotateCcw, FileCode } from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', starter: '// Write your JavaScript code here\nconsole.log("Hello, LevelUp!");' },
  { value: 'python', label: 'Python', starter: '# Write your Python code here\nprint("Hello, LevelUp!")' },
];

const loadPyodideScript = () => {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide runtime script'));
    document.head.appendChild(script);
  });
};

const CodePlayground = () => {
  const [expanded, setExpanded] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [loadingInterpreter, setLoadingInterpreter] = useState(false);
  const [pyodideInstance, setPyodideInstance] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codePasted, setCodePasted] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(LANGUAGES.find(l => l.value === lang)?.starter || '');
    setOutput(null);
    setError(null);
  };

  const handleReset = () => {
    setCode(LANGUAGES.find(l => l.value === language)?.starter || '');
    setOutput(null);
    setError(null);
  };

  const handleClear = () => {
    setCode('');
    setOutput(null);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
        
        // Auto-detect language based on pasted content keywords
        if (text.includes('def ') || text.includes('print(') || text.includes('import ') || text.includes('# ') || text.includes('elif ')) {
          setLanguage('python');
        } else if (text.includes('console.log') || text.includes('const ') || text.includes('let ') || text.includes('function ') || text.includes('var ')) {
          setLanguage('javascript');
        }
        
        setCodePasted(true);
        setTimeout(() => setCodePasted(false), 2000);
        setOutput(null);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Could not paste automatically. Please click inside the editor and use Ctrl+V (or Cmd+V) to paste.');
    }
  };

  const handleTextareaPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const currentStarter = LANGUAGES.find(l => l.value === language)?.starter || '';
    
    // If the editor is currently empty or just contains the default starter code,
    // intercept the paste and replace it entirely with the pasted text.
    if (code.trim() === '' || code.trim() === currentStarter.trim()) {
      e.preventDefault();
      setCode(pastedText);
      
      // Auto-detect language
      if (pastedText.includes('def ') || pastedText.includes('print(') || pastedText.includes('import ') || pastedText.includes('# ') || pastedText.includes('elif ')) {
        setLanguage('python');
      } else if (pastedText.includes('console.log') || pastedText.includes('const ') || pastedText.includes('let ') || pastedText.includes('function ') || pastedText.includes('var ')) {
        setLanguage('javascript');
      }
    }
  };

  const runJSCode = (codeToRun) => {
    const consoleOutput = [];
    const customConsole = {
      log: (...args) => {
        consoleOutput.push(args.map(arg => {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        }).join(' '));
      },
      error: (...args) => {
        consoleOutput.push('[ERROR] ' + args.join(' '));
      },
      warn: (...args) => {
        consoleOutput.push('[WARN] ' + args.join(' '));
      }
    };

    try {
      // Execute the JS code in a function context with custom console
      const runner = new Function('console', `
        try {
          ${codeToRun}
        } catch (e) {
          throw e;
        }
      `);
      
      runner(customConsole);
      setOutput(consoleOutput.join('\n') || '(no output)');
    } catch (err) {
      setError(err.message);
    }
  };

  const runPythonCode = async (codeToRun) => {
    let instance = pyodideInstance;
    if (!instance) {
      setLoadingInterpreter(true);
      try {
        await loadPyodideScript();
        const stdoutBuffer = [];
        instance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
          stdout: (text) => {
            stdoutBuffer.push(text);
          },
          stderr: (text) => {
            stdoutBuffer.push(text);
          }
        });
        setPyodideInstance(instance);
        instance._stdoutBuffer = stdoutBuffer;
      } catch (err) {
        setError(`Failed to initialize Python environment: ${err.message}`);
        setLoadingInterpreter(false);
        return;
      } finally {
        setLoadingInterpreter(false);
      }
    }

    // Clear output buffer
    instance._stdoutBuffer.length = 0;

    try {
      // Execute Python code asynchronously
      await instance.runPythonAsync(codeToRun);
      const outputText = instance._stdoutBuffer.join('\n');
      setOutput(outputText || '(no output)');
    } catch (err) {
      setError(err.message);
    }
  };

  const runCode = async () => {
    if (!code.trim() || running || loadingInterpreter) return;
    setRunning(true);
    setOutput(null);
    setError(null);

    try {
      if (language === 'javascript') {
        runJSCode(code);
      } else if (language === 'python') {
        await runPythonCode(code);
      }
    } catch (err) {
      setError(err.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-8 border border-border/60 rounded-2xl overflow-hidden bg-background/40 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-primary/30">
      {/* Toggle Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
            <Terminal size={18} />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm text-foreground block">Try it yourself</span>
            <span className="text-[10px] text-muted-foreground block">Run, edit and test Python or JavaScript code snippets in real-time</span>
          </div>
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
            <div className="border-t border-border/50 p-4 space-y-4">
              {/* Language Selector + Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20 p-2 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer text-foreground"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={runCode}
                    disabled={running || loadingInterpreter || !code.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-xs font-black hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shadow-success/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {running || loadingInterpreter ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    {loadingInterpreter ? 'LOADING INTERPRETER...' : running ? 'RUNNING...' : 'RUN CODE'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Paste Code */}
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                    title="Paste from clipboard and replace starter code"
                  >
                    {codePasted ? <Check size={12} className="text-success" /> : <Clipboard size={12} />}
                    <span>{codePasted ? 'Pasted!' : 'Paste Code'}</span>
                  </button>

                  {/* Copy Code */}
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
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                    title="Copy current code"
                  >
                    {codeCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  {/* Reset Code */}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                    title="Reset to default starter code"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>

                  {/* Clear Code */}
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-destructive text-xs font-medium transition-colors"
                    title="Clear editor"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* IDE Code Editor Mockup */}
              <div className="relative border border-border/60 rounded-xl overflow-hidden shadow-inner bg-[#1e1e2e]">
                {/* Editor Tab bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-primary/70" />
                    <span className="font-mono text-xs text-white/60">
                      {language === 'python' ? 'main.py' : 'index.js'}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                </div>

                {/* Editor Textarea */}
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onPaste={handleTextareaPaste}
                  spellCheck={false}
                  placeholder={language === 'python' ? '# Enter your Python code here...' : '// Enter your JavaScript code here...'}
                  className="w-full h-56 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm p-4 resize-y focus:outline-none focus:ring-0 leading-relaxed border-none"
                  style={{ tabSize: 2 }}
                  onKeyDown={(e) => {
                    // Handle Tab key for indentation (inserts 2 spaces)
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
              </div>

              {/* Output Panel / Mock Terminal */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-[#0f0f17] shadow-lg">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#151522] border-b border-white/5">
                  <div className="flex items-center gap-3">
                    {/* Mac traffic light controls */}
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white/50 flex items-center gap-1.5 pl-2 border-l border-white/10">
                      <Terminal size={12} /> terminal
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {loadingInterpreter && (
                      <span className="text-[10px] font-black uppercase text-amber-500 animate-pulse flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                        Initializing
                      </span>
                    )}
                    {running && !loadingInterpreter && (
                      <span className="text-[10px] font-black uppercase text-primary animate-pulse flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md">
                        Running
                      </span>
                    )}
                    {error && (
                      <span className="text-[10px] font-black uppercase text-destructive flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-md">
                        Error
                      </span>
                    )}
                    {output && !error && (
                      <span className="text-[10px] font-black uppercase text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-md">
                        Success
                      </span>
                    )}
                    
                    {(output || error) && (
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
                        className="p-1 rounded bg-[#1e1e2e] border border-white/10 text-white/50 hover:text-white transition-colors"
                        title="Copy output"
                      >
                        {outputCopied ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Terminal Console Screen */}
                <div className="p-4 font-mono text-xs leading-relaxed min-h-[5rem] max-h-60 overflow-y-auto custom-scrollbar">
                  {loadingInterpreter ? (
                    <div className="flex flex-col gap-1.5 text-white/50">
                      <div className="flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-primary" />
                        <span>Initializing Python compiler in browser (WASM runtime)...</span>
                      </div>
                      <span className="text-[10px] text-white/30 pl-5">This downloads the light interpreter once. Subsequent runs are instantaneous!</span>
                    </div>
                  ) : running ? (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 size={12} className="animate-spin text-primary" />
                      <span>Executing script...</span>
                    </div>
                  ) : error ? (
                    <div className="space-y-1">
                      <div className="text-[#f38ba8] font-bold">&gt;_ ERROR:</div>
                      <pre className="whitespace-pre-wrap break-words text-[#f38ba8] opacity-90 select-text">
                        {error}
                      </pre>
                    </div>
                  ) : output ? (
                    <div className="space-y-1">
                      <div className="text-[#a6e3a1] font-bold">&gt;_ OUTPUT:</div>
                      <pre className="whitespace-pre-wrap break-words text-[#cdd6f4] select-text">
                        {output}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-white/30 italic">
                      &gt;_ Press "Run Code" above to execute and see console output.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodePlayground;
