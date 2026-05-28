import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RouteTracker = () => {
  const location = useLocation();
  const { user, api } = useAuth();
  
  const entryTimeRef = useRef(Date.now());
  const currentPathRef = useRef(location.pathname);

  // Helper to determine category from pathname
  const getCategoryFromPath = (path) => {
    if (path.startsWith('/dashboard') || path === '/') return 'dashboard';
    if (path.includes('/modules') || path.includes('/learn')) {
      if (path.includes('/java')) return 'java';
      if (path.includes('/c')) return 'c';
      if (path.includes('/python')) return 'python';
      if (path.includes('/dsa')) return 'dsa';
      if (path.includes('/ai')) return 'ai';
      return 'learn';
    }
    if (path.includes('/resume')) return 'resume';
    if (path.includes('/interview')) return 'interview';
    if (path.includes('/assessment') || path.includes('/quiz')) return 'assessment';
    if (path.includes('/roadmap')) return 'roadmap';
    if (path.includes('/language')) return 'programs';
    if (path.includes('/benefits')) return 'benefits';
    if (path.includes('/activities')) return 'timepass';
    return 'other'; 
  };

  const getLabelFromPath = (path) => {
    if (path.startsWith('/dashboard') || path === '/') return 'Dashboard';
    if (path.includes('/modules') || path.includes('/learn')) {
      if (path.includes('/java')) return 'Java Module';
      if (path.includes('/c')) return 'C Programming Module';
      if (path.includes('/python')) return 'Python Module';
      if (path.includes('/dsa')) return 'DSA Module';
      if (path.includes('/ai')) return 'AI/GenAI Module';
      return 'Learning Modules';
    }
    if (path.includes('/resume')) return 'Resume Builder & Analysis';
    if (path.includes('/interview')) return 'Interview Studio';
    if (path.includes('/assessment') || path.includes('/quiz')) return 'Assessments & Quizzes';
    if (path.includes('/roadmap')) return 'Career Roadmaps';
    if (path.includes('/language')) return 'Language Hub';
    if (path.includes('/benefits')) return 'Benefits & Perks';
    return 'General App Engagement';
  };

  const logActivity = (path, durationSeconds) => {
    if (!user || durationSeconds < 5) return; // Track spent time starting from 5 seconds

    const category = getCategoryFromPath(path);
    const activityData = {
      category,
      label: getLabelFromPath(path),
      duration: durationSeconds,
      type: 'auto'
    };

    api.post('/activity', activityData)
      .then(() => {
        window.dispatchEvent(new Event('activity-logged'));
      })
      .catch(err => {
        console.warn('Failed to log auto-tracked activity:', err);
      });
  };

  useEffect(() => {
    // If the path has changed explicitly
    if (currentPathRef.current !== location.pathname) {
      const exitTime = Date.now();
      const durationSeconds = Math.round((exitTime - entryTimeRef.current) / 1000);
      
      logActivity(currentPathRef.current, durationSeconds);
      
      // Reset for new path
      entryTimeRef.current = exitTime;
      currentPathRef.current = location.pathname;
    }
  }, [location.pathname, user, api]);

  // Handle page unload (closing tab/browser or reloading)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const exitTime = Date.now();
      const durationSeconds = Math.round((exitTime - entryTimeRef.current) / 1000);
      
      if (user && durationSeconds >= 5) {
        const category = getCategoryFromPath(currentPathRef.current);
        const data = JSON.stringify({
          category,
          label: getLabelFromPath(currentPathRef.current),
          duration: durationSeconds,
          type: 'auto'
        });
        
        const token = localStorage.getItem('token');
        if (token) {
          const apiBase = import.meta.env.VITE_API_URL || '/api';
          const fullUrl = apiBase.startsWith('http') ? `${apiBase}/activity` : `${window.location.origin}${apiBase}/activity`;
          
          try {
            fetch(fullUrl, {
              method: 'POST',
              body: data,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              keepalive: true
            });
          } catch (e) {
            console.error('Fetch beacon error:', e);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  return null;
};

export default RouteTracker;
