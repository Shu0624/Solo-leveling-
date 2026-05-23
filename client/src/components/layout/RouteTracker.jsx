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
    if (path.includes('/interview')) return 'interview';
    if (path.includes('/resume')) return 'resume';
    if (path.includes('/modules/java') || path.includes('/learn/java')) return 'java';
    if (path.includes('/modules/python') || path.includes('/learn/python')) return 'python';
    if (path.includes('/modules/dsa') || path.includes('/learn/dsa')) return 'dsa';
    if (path.includes('/modules/ai') || path.includes('/learn/ai')) return 'ai';
    if (path.includes('/activities') || path.includes('/quiz')) return 'quiz';
    return 'other'; 
  };

  const getLabelFromPath = (path) => {
    return `Auto-tracked: ${path}`;
  };

  const logActivity = (path, durationSeconds) => {
    if (!user || durationSeconds < 120) return; // Only log if spent 2+ minutes on a page

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

  // Handle page unload (closing tab/browser)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const exitTime = Date.now();
      const durationSeconds = Math.round((exitTime - entryTimeRef.current) / 1000);
      
      if (user && durationSeconds >= 10) {
        const category = getCategoryFromPath(currentPathRef.current);
        const data = JSON.stringify({
          category,
          label: getLabelFromPath(currentPathRef.current),
          duration: durationSeconds,
          type: 'study'
        });
        
        const token = localStorage.getItem('levelup_token'); // Or however they store it 
        // fallback to just normal send if we can't reliably token sendBeacon
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
