import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { io as socketIO } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Safe resolution of WebSocket URL to avoid Mixed Content errors in production on HTTPS
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');

  // Local development
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return 'http://localhost:5000';
    // When served over HTTPS on Vercel, don't attempt insecure http://localhost
    if (window.location.protocol === 'https:') {
      return null; // Disabled unless explicit VITE_SOCKET_URL is set
    }
  }
  return null;
};

// Kept in step with DEMO_IDENTITIES in server/middleware/auth.js.
// Using valid 24-hex ObjectIds prevents Mongoose CastError across all features.
export const DEMO_ACCOUNTS = {
  student: {
    _id: '65f1a1a1a1a1a1a1a1a10001',
    name: 'Alex Chen',
    email: 'alex.chen@student.levelup.edu',
    role: 'student',
    classroomCode: 'CSE-3A',
    department: 'Computer Science & Engineering',
    year: 3,
    section: 'A',
    college: 'Apex Institute of Technology',
    enrollmentId: '21BCE1042',
    cgpa: 8.85,
    streak: 12,
    skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'Data Structures'],
    resumeScore: 88,
    isDemo: true
  },
  faculty: {
    _id: '65f1a1a1a1a1a1a1a1a10002',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@faculty.levelup.edu',
    role: 'faculty',
    department: 'Computer Science & Engineering',
    assignedClassrooms: ['CSE-3A', 'CSE-4B'],
    college: 'Apex Institute of Technology',
    employeeId: 'FAC-2024-089',
    isDemo: true
  },
  hod: {
    _id: '65f1a1a1a1a1a1a1a1a10003',
    name: 'Dr. Ramesh Kulkarni',
    email: 'hod.cse@apex.edu.in',
    role: 'hod',
    department: 'Computer Science & Engineering',
    college: 'Apex Institute of Technology',
    employeeId: 'HOD-CSE-001',
    isDemo: true
  },
  principal: {
    _id: '65f1a1a1a1a1a1a1a1a10004',
    name: 'Dr. A. R. Sundaram',
    email: 'principal@apex.edu.in',
    role: 'principal',
    department: 'Administration',
    college: 'Apex Institute of Technology',
    employeeId: 'PRIN-2024-001',
    isDemo: true
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('levelup_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Self-heal legacy demo ids stored in user's browser localStorage
        if (parsed?._id === 'demo_student_01') {
          parsed._id = '65f1a1a1a1a1a1a1a1a10001';
          localStorage.setItem('levelup_user', JSON.stringify(parsed));
        } else if (parsed?._id === 'demo_faculty_01') {
          parsed._id = '65f1a1a1a1a1a1a1a1a10002';
          localStorage.setItem('levelup_user', JSON.stringify(parsed));
        } else if (parsed?._id === 'demo_hod_01') {
          parsed._id = '65f1a1a1a1a1a1a1a1a10003';
          localStorage.setItem('levelup_user', JSON.stringify(parsed));
        } else if (parsed?._id === 'demo_principal_01') {
          parsed._id = '65f1a1a1a1a1a1a1a1a10004';
          localStorage.setItem('levelup_user', JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // Create a STABLE axios instance once
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
    });

    // Request interceptor: always read fresh token from localStorage
    instance.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: only logout on genuine 401 auth failures (and not in demo mode)
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          !error.config?.url?.includes('/auth/login') &&
          !error.config?.url?.includes('/auth/register')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('levelup_user');
          window.dispatchEvent(new Event('auth-logout'));
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  // Listen for forced logout events
  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('levelup_user');
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('levelup_user', JSON.stringify(res.data));
        } catch (error) {
          console.warn('[Auth] Session validation note:', error.message);
          if (error.response?.status === 401) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('levelup_user');
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token, api]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    localStorage.setItem('levelup_user', JSON.stringify(res.data));
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    localStorage.setItem('levelup_user', JSON.stringify(res.data));
    return res.data;
  };

  // Socket.IO Connection Management — guarded against mixed content
  useEffect(() => {
    const resolvedSocketUrl = getSocketUrl();
    if (user && token && !socketRef.current && resolvedSocketUrl) {
      try {
        const newSocket = socketIO(resolvedSocketUrl, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 3000,
          transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
          console.log('[Socket] Connected to server');
        });

        newSocket.on('connect_error', (err) => {
          console.warn('[Socket] Connection status:', err.message);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (err) {
        console.warn('[Socket] Init skipped:', err.message);
      }
    }

    return () => {};
  }, [user, token]);

  // 1-Click Demo Login for quick testing without database dependencies
  const demoLogin = (role = 'student') => {
    const demoUser = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.student;
    const demoToken = `demo_token_${role}_${Date.now()}`;
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem('token', demoToken);
    localStorage.setItem('levelup_user', JSON.stringify(demoUser));
    return demoUser;
  };

  const logout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('levelup_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, demoLogin, logout, api, socket }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
