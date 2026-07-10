import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, Trophy, Building,
  Clock, Star, Flame, BarChart3, ArrowRight
} from 'lucide-react';
import LiveStudentGrid from '../components/dashboard/LiveStudentGrid';
import { PageHeader, StatTile, Button, Skeleton, SkeletonCard, EmptyState } from '../components/ui';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-11 w-44 rounded-2xl" rounded="rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" rounded="rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" rounded="rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header Profile & Scope */}
      <PageHeader
        icon={<Building size={22} />}
        eyebrow={getRoleTitle(user.role)}
        title={`Welcome, ${user.name}`}
        subtitle={[data.scope.college, data.scope.department, user.role === 'faculty' ? `Year ${data.scope.year}` : null].filter(Boolean).join('  •  ')}
        actions={
          <Button variant="primary" onClick={() => navigate('/analytics')}>
            <BarChart3 size={18} />
            {['hod', 'principal', 'placement'].includes(user.role) ? 'AI Analytics' : 'View Analytics'}
            <ArrowRight size={16} />
          </Button>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatTile
          label="Total Students"
          value={data.stats.totalStudents}
          icon={<Users size={16} />}
          tone="primary"
          hero
          delta={`${data.stats.activeThisWeek} active`}
          trend="up"
        />
        <StatTile
          label="Aggregate Study Time"
          value={data.stats.totalStudyHours}
          suffix="h"
          icon={<Clock size={16} />}
          tone="warning"
        />
        <StatTile
          label="Avg Quiz Score"
          value={data.stats.avgQuizScore}
          suffix="%"
          icon={<Trophy size={16} />}
          tone="success"
          delta={`${data.stats.totalAttempts} attempts`}
        />
        <StatTile
          label="Avg Resume Score"
          value={data.stats.avgResumeScore}
          icon={<Star size={16} />}
          tone="accent"
        />
      </div>

      {/* Live Monitoring Station */}
      <div className="mb-8">
        <LiveStudentGrid classroomCode={user.role === 'faculty' && user.assignedClassrooms?.length > 0 ? user.assignedClassrooms[0] : 'all'} />
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
                      <Link to={`/my-analytics?studentId=${student.id}`} className="font-bold text-foreground text-sm hover:underline hover:text-primary transition-all">
                        {student.name}
                      </Link>
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
             <EmptyState icon={<Flame size={24} />} title="No engagement yet" message="Once students start studying, your top performers will appear here." />
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="glass-morphism p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground"><Activity className="text-accent"/> Live Student Activity Feed</h2>
          </div>
          {data.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((act, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50 gap-3">
                  <div>
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                       {act.studentId ? (
                         <Link to={`/my-analytics?studentId=${act.studentId}`} className="hover:underline hover:text-primary transition-all">
                           {act.studentName}
                         </Link>
                       ) : (
                         act.studentName
                       )}
                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border/50 text-muted-foreground uppercase">{act.department}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{act.description}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap ${
                    act.score >= 70 ? 'bg-success/10 text-success border border-success/20' : 
                    act.score >= 50 ? 'bg-warning/10 text-warning border border-warning/20' : 
                    'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {act.score}% {act.scoreLabel || 'Score'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Activity size={24} />} title="Nothing recent" message="Live student activity — quizzes, interviews, study sessions — will stream in here." />
          )}
        </div>

      </div>
    </div>
  );
};

export default FacultyDashboard;
