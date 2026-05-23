import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { io as socketIO } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // Create a STABLE axios instance once (not on every render)
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

    // Response interceptor: only logout on genuine 401 auth failures
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          !error.config?.url?.includes('/auth/login') &&
          !error.config?.url?.includes('/auth/register')
        ) {
          // Token is truly invalid/expired — clear state
          localStorage.removeItem('token');
          // Use a custom event to trigger logout without circular deps
          window.dispatchEvent(new Event('auth-logout'));
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []); // Created exactly once

  // Listen for forced logout events
  useEffect(() => {
    const handleLogout = () => {
      setToken(null);
      setUser(null);
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
        } catch (error) {
          console.error('Error fetching user', error);
          // Only logout if it's a 401, not a network error
          if (error.response?.status === 401) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
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
    return res.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  // ---- Socket.IO Connection Management ----
  useEffect(() => {
    if (user && token && !socketRef.current) {
      const newSocket = socketIO(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('[Socket] Connected:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      newSocket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      // Don't disconnect on every re-render — only on unmount
    };
  }, [user, token]);

  const logout = () => {
    // Disconnect socket on logout
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, api, socket }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
