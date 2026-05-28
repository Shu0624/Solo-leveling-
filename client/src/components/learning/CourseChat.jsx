import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, Send, X, Users, Brain, Sparkles, Download, Loader2 } from 'lucide-react';

const CourseChat = ({ slug, moduleTitle, lessonTitle, lessonContent }) => {
  const { user, socket, api } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('group'); // 'group' or 'ai'
  
  // Group Chat States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  
  // AI Tutor States
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const messagesEndRef = useRef(null);
  const room = slug;

  // Load persisted AI Chat history from localStorage
  useEffect(() => {
    if (!lessonTitle) return;
    const cacheKey = `ai-chat-${slug}-${lessonTitle}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setAiMessages(JSON.parse(cached));
      } catch (e) {
        setAiMessages([]);
      }
    } else {
      setAiMessages([
        {
          role: 'assistant',
          content: `### Welcome to your **AI Study Companion**! 🧠\n\nI am your personal AI Tutor for **${moduleTitle}**. I have read the current lesson **${lessonTitle}**.\n\nAsk me:\n* To explain a specific part in detail\n* For additional code examples\n* A quick quiz question to test your knowledge\n* Interview questions related to this topic`,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [slug, lessonTitle, moduleTitle]);

  // Persist AI Messages when they change
  useEffect(() => {
    if (!lessonTitle || aiMessages.length === 0) return;
    const cacheKey = `ai-chat-${slug}-${lessonTitle}`;
    localStorage.setItem(cacheKey, JSON.stringify(aiMessages));
  }, [aiMessages, slug, lessonTitle]);

  // Group Socket connection
  useEffect(() => {
    if (!open || !socket || activeTab !== 'group') return;

    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onHistory = (history) => setMessages(history);
    const onMessage = (msg) => setMessages(prev => [...prev, msg]);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('course-chat-history', onHistory);
    socket.on('course-message', onMessage);

    socket.emit('join-course-chat', room);

    return () => {
      socket.emit('leave-course-chat', room);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('course-chat-history', onHistory);
      socket.off('course-message', onMessage);
    };
  }, [open, room, socket, activeTab]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiMessages, activeTab, loadingAI]);

  // Send Group Message
  const sendGroupMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('course-message', {
      room,
      userId: user?._id,
      userName: user?.name || 'Anonymous',
      message: input.trim(),
    });
    setInput('');
  };

  // Send AI Tutor Message
  const sendAIMessage = async () => {
    if (!aiInput.trim() || loadingAI) return;
    const userText = aiInput.trim();
    setAiInput('');

    // Append user message
    const userMsg = {
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    setAiMessages(prev => [...prev, userMsg]);
    setLoadingAI(true);

    try {
      // Map state messages to match required format for endpoint
      const formattedHistory = aiMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/ai/module-tutor', {
        moduleTitle,
        lessonTitle,
        lessonContent,
        question: userText,
        chatHistory: formattedHistory
      });

      const assistantMsg = {
        role: 'assistant',
        content: res.data.response || 'No response received.',
        createdAt: new Date().toISOString()
      };
      setAiMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setAiMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ *Sorry, I ran into an error while processing your request. Please try again.*',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  // Export AI conversation as Markdown cheat sheet
  const exportAIChat = () => {
    const header = `# AI Tutor Session: ${lessonTitle}\nModule: ${moduleTitle}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    const body = aiMessages
      .map(m => `**${m.role === 'user' ? 'Student' : 'AI Tutor'}**:\n${m.content}\n\n`)
      .join('---\n\n');
    
    const blob = new Blob([header + body], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Tutor_${lessonTitle.replace(/\s+/g, '_')}_Cheatsheet.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
          open
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-primary text-primary-foreground shadow-primary/30'
        }`}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] glass-morphism rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  {activeTab === 'group' ? <Users size={16} /> : <Brain size={16} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-foreground truncate">
                    {activeTab === 'group' ? 'Study Group' : 'AI Coding Tutor'}
                  </h3>
                  <p className="text-[9px] text-muted-foreground">
                    {activeTab === 'group' 
                      ? (connected ? '🟢 Live Classroom Chat' : '⚪ Connecting...') 
                      : '🤖 Llama 3.3 Assistant'}
                  </p>
                </div>
              </div>
              
              {activeTab === 'ai' && aiMessages.length > 1 && (
                <button
                  onClick={exportAIChat}
                  className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Download Chat Cheatsheet"
                >
                  <Download size={14} />
                </button>
              )}
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-border/30 bg-muted/30 p-1">
              <button
                onClick={() => setActiveTab('group')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'group' 
                    ? 'bg-background text-primary shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Study Group
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'ai' 
                    ? 'bg-background text-accent shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles size={10} className="text-accent" />
                AI Tutor
              </button>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30 custom-scrollbar">
              
              {/* Group Chat Messages */}
              {activeTab === 'group' && (
                <>
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-8">
                      No messages yet. Start the group conversation! 💬
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isOwn = msg.userId === user?._id;
                    return (
                      <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 text-xs shadow-sm ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                            : 'bg-secondary/80 border border-border/50 text-foreground rounded-2xl rounded-tl-sm'
                        }`}>
                          {!isOwn && (
                            <div className="text-[9px] font-black text-primary mb-0.5 opacity-80">
                              {msg.userName}
                            </div>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <div className={`text-[8px] mt-1 text-right ${isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* AI Tutor Messages */}
              {activeTab === 'ai' && (
                <>
                  {aiMessages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[88%] px-3 py-2 text-xs shadow-sm leading-relaxed ${
                          isUser
                            ? 'bg-accent text-white rounded-2xl rounded-tr-sm'
                            : 'bg-secondary/80 border border-border/50 text-foreground rounded-2xl rounded-tl-sm'
                        }`}>
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 font-sans prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:p-2 prose-pre:rounded-lg prose-code:font-mono prose-code:text-[10px]">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          <div className={`text-[8px] mt-1 text-right ${isUser ? 'text-white/60' : 'text-muted-foreground'}`}>
                            {msg.createdAt ? formatTime(msg.createdAt) : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {loadingAI && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/80 border border-border/50 text-muted-foreground rounded-2xl rounded-tl-sm px-4 py-3 text-xs flex items-center gap-2 shadow-sm">
                        <Loader2 size={12} className="animate-spin text-accent" />
                        <span>AI Tutor is formulating explanation...</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-background/80 backdrop-blur-md border-t border-border/50">
              {activeTab === 'group' ? (
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); } }}
                    placeholder="Ask study group..."
                    className="flex-1 bg-secondary border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground"
                  />
                  <button
                    onClick={sendGroupMessage}
                    disabled={!input.trim()}
                    className={`p-2 rounded-xl transition-all ${
                      input.trim()
                        ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Send size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } }}
                    placeholder="Ask AI Tutor (e.g. explain indexing)..."
                    disabled={loadingAI}
                    className="flex-1 bg-secondary border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/50 text-foreground disabled:opacity-50"
                  />
                  <button
                    onClick={sendAIMessage}
                    disabled={!aiInput.trim() || loadingAI}
                    className={`p-2 rounded-xl transition-all ${
                      aiInput.trim() && !loadingAI
                        ? 'bg-accent text-white hover:opacity-90 shadow-sm'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {loadingAI ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CourseChat;
