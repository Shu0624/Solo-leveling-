import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { History, Clock, MessageSquare, Award, Bot, ArrowLeft, TrendingUp, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TOPIC_LABELS = {
  hr: 'Behavioral',
  java: 'Java Core',
  python: 'Python',
  dsa: 'DSA',
  fullstack: 'MERN Stack',
  systemdesign: 'System Design',
  sql: 'SQL',
  react: 'React',
  nodejs: 'Node.js'
};

const TOPIC_COLORS = {
  hr: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  java: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  python: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  dsa: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  fullstack: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  systemdesign: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  sql: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  react: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  nodejs: 'bg-lime-500/10 text-lime-600 border-lime-500/20'
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

const InterviewHistory = ({ embedded = false }) => {
  const { api } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/interview/history');
        setSessions(res.data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch interview history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [api]);

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    setDetailsLoading(true);
    setSessionDetails(null);
    try {
      const res = await api.get(`/interview/session/${session._id}`);
      setSessionDetails(res.data.session);
    } catch (err) {
      console.error('Failed to fetch session details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Stats
  const totalSessions = sessions.length;
  const totalTime = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const avgMessages = totalSessions > 0
    ? Math.round(sessions.reduce((acc, s) => acc + (s.messagesCount || 0), 0) / totalSessions)
    : 0;
  const topicCounts = sessions.reduce((acc, s) => {
    acc[s.topic] = (acc[s.topic] || 0) + 1;
    return acc;
  }, {});
  const mostPracticed = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className={`${embedded ? '' : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} animate-fade-in relative`}>
      {/* Background */}
      {!embedded && <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] -z-10 pointer-events-none" />}

      {!embedded && <header className="mb-10">
        <Link to="/interview" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Interview Studio
        </Link>
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
            <History size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Interview History</h1>
          <p className="text-muted-foreground">Track your mock interview practice sessions and see your progress over time.</p>
        </div>
      </header>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Sessions', value: totalSessions, icon: <Bot size={20} />, color: 'text-primary' },
          { label: 'Total Practice Time', value: formatDuration(totalTime), icon: <Clock size={20} />, color: 'text-accent' },
          { label: 'Avg Messages/Session', value: avgMessages, icon: <MessageSquare size={20} />, color: 'text-warning' },
          { label: 'Most Practiced', value: mostPracticed ? TOPIC_LABELS[mostPracticed[0]] || mostPracticed[0] : '—', icon: <TrendingUp size={20} />, color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-morphism rounded-2xl p-5 text-center"
          >
            <div className={`${stat.color} mb-2 flex justify-center`}>{stat.icon}</div>
            <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Session List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent animate-pulse" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading history...</p>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-morphism rounded-3xl p-12 text-center">
          <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center mb-6">
            <Bot size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No sessions yet</h2>
          <p className="text-muted-foreground mb-6">Start an AI mock interview to begin tracking your practice.</p>
          <Link
            to="/interview"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <Zap size={18} /> Start Practicing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleViewSession(session)}
              className="glass-morphism rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-secondary/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-border/10 hover:border-primary/20 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Bot size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${TOPIC_COLORS[session.topic] || 'bg-secondary text-foreground border-border'}`}>
                      {TOPIC_LABELS[session.topic] || session.topic}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    AI Mock Interview • {session.type === 'mock-interview' ? 'Solo' : 'Group'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm ml-16 sm:ml-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={14} />
                  <span className="font-medium">{formatDuration(session.durationSeconds)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageSquare size={14} />
                  <span className="font-medium">{session.messagesCount} msgs</span>
                </div>
                {session.aiScore > 0 && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <Award size={14} />
                    <span className="font-bold">{session.aiScore}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ===== DETAILED DIALOGUE MODAL ===== */}
      {selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-secondary/95 border border-border/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-background/20">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${TOPIC_COLORS[selectedSession.topic] || 'bg-secondary text-foreground border-border'}`}>
                  {TOPIC_LABELS[selectedSession.topic] || selectedSession.topic}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedSession.completedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 bg-secondary rounded-lg border border-border/50 hover:bg-secondary/85 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Score & Meta Bar */}
            <div className="px-6 py-4 bg-background/10 border-b border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDuration(selectedSession.durationSeconds)}</span>
                <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {selectedSession.messagesCount} answers</span>
              </div>
              {selectedSession.aiScore > 0 && (
                <div className="flex items-center gap-1.5 text-primary font-bold">
                  <Award size={14} /> Overall Score: {selectedSession.aiScore}%
                </div>
              )}
            </div>

            {/* Scrollable Dialogue */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/5">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium animate-pulse">Loading detailed conversation...</span>
                </div>
              ) : !sessionDetails || !sessionDetails.messages || sessionDetails.messages.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground space-y-2">
                  <Bot size={36} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold">Transcript Not Available</p>
                  <p className="text-xs max-w-xs mx-auto">This session was completed before conversation archiving was active, or no messages were exchanged.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionDetails.messages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-muted-foreground mb-1 ml-1 mr-1">
                        {m.role === 'user' ? 'You' : 'AI Mentor'}
                      </span>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm font-medium'
                          : 'bg-secondary/70 border border-border/40 text-foreground rounded-tl-sm whitespace-pre-wrap'
                      }`}>
                        {m.text}
                        {m.role === 'user' && m.score > 0 && (
                          <div className="mt-2 text-[11.5px] font-bold bg-background/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <Award size={12} /> Score: {m.score}/10
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-background/20 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-secondary border border-border/80 hover:bg-secondary/80 rounded-xl text-xs font-semibold transition-all"
              >
                Close Transcript
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
