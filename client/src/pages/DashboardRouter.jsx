import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import PrincipalDashboard from './PrincipalDashboard';
import HODDashboard from './HODDashboard';

const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'student') {
    return <StudentDashboard />;
  } else if (user?.role === 'hod') {
    return <HODDashboard />;
  } else if (user?.role === 'principal' || user?.role === 'placement') {
    return <PrincipalDashboard />;
  } else if (user?.role === 'faculty') {
    return <FacultyDashboard />;
  }

  return <div>Unknown Role</div>;
};

export default DashboardRouter;
