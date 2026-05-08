import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Activity, Trophy, Building, 
  BookOpen, Target, Clock, Star, Flame, BarChart3, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

const FacultyDashboard = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [api]);

  const getRoleTitle = (role) => {
    switch(role) {
      case 'principal': return 'College Principal Overview';
      case 'placement': return 'Placement Head Overview';
      case 'hod': return 'Department Head Analytics';
      case 'faculty': return 'Class Faculty Dashboard';
      default: return 'Admin Overview';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Activity className="animate-pulse mb-4 text-primary" size={48} />
        <p className="animate-pulse font-medium">Aggregating hierarchy data...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header Profile & Scope */}
      <header className="mb-10 pb-8 border-b border-border/50 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <Building size={14} /> {getRoleTitle(user.role)}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">Welcome, {user.name}</h1>
          <p className="text-muted-foreground font-medium flex gap-3 text-sm">
            <span className="flex items-center gap-1"><Target size={14}/> {data.scope.college}</span>
            <span className="flex items-center gap-1"><BookOpen size={14}/> {data.scope.department}</span>
            {user.role === 'faculty' && <span className="flex items-center gap-1"><Users size={14}/> Year {data.scope.year}</span>}
          </p>
        </div>

        {/* Analytics Dashboard CTA */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/analytics')}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <BarChart3 size={18} />
          {['hod', 'principal', 'placement'].includes(user.role) ? 'AI Analytics Dashboard' : 'View Analytics'}
          <ArrowRight size={16} />
        </motion.button>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.1}} className="glass-morphism p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{data.stats.totalStudents}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Students</div>
          <div className="text-xs text-success font-medium mt-2 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div> {data.stats.activeThisWeek} active this week
          </div>
        </motion.div>

        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} className="glass-morphism p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4">
            <Clock size={24} />
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{data.stats.totalStudyHours}<span className="text-lg text-muted-foreground font-semibold">h</span></div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aggregate Study Time</div>
        </motion.div>

        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.3}} className="glass-morphism p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
            <Trophy size={24} />
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{data.stats.avgQuizScore}%</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Quiz Score</div>
          <div className="text-xs text-muted-foreground mt-2">{data.stats.totalAttempts} total attempts</div>
        </motion.div>

        <motion.div initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4}} className="glass-morphism p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
            <Star size={24} />
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{data.stats.avgResumeScore}</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Avg Resume Score</div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Performers Leaderboard */}
        <div className="glass-morphism p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground"><Flame className="text-primary"/> Engagement Leaderboard</h2>
          </div>
          {data.leaderboard?.length > 0 ? (
            <div className="space-y-4">
              {data.leaderboard.map((student, i) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      i === 0 ? 'bg-warning text-warning-foreground' : 
                      i === 1 ? 'bg-slate-300 text-slate-800' : 
                      i === 2 ? 'bg-amber-600 text-white' : 
                      'bg-background text-foreground'
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{student.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{student.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-primary">
                      {student.hours}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {student.metric === 'attempts' ? ' quiz' : 'h'}
                      </span>
                    </p>
                    {student.avgScore > 0 && (
                      <p className="text-[10px] text-muted-foreground">{student.avgScore}% avg</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">No active students on leaderboard yet.</div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="glass-morphism p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground"><Activity className="text-accent"/> Live Quiz Feed</h2>
          </div>
          {data.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((act, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50 gap-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                       {act.studentName}
                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground uppercase">{act.department}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Completed a module quiz</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                    act.score >= 70 ? 'bg-success/10 text-success border border-success/20' : 
                    act.score >= 50 ? 'bg-warning/10 text-warning border border-warning/20' : 
                    'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {act.score}% Score
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">No recent quiz activity.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FacultyDashboard;
