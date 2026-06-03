import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import PrincipalDashboard from './PrincipalDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'student') {
    return <StudentDashboard />;
  } else if (['principal', 'hod', 'placement'].includes(user?.role)) {
    return <PrincipalDashboard />;
  } else if (user?.role === 'faculty') {
    return <FacultyDashboard />;
  }

  return <div>Unknown Role</div>;
};

export default DashboardRouter;
