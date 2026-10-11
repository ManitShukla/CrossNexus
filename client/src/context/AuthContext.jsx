import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nsut_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Verify token integrity and fetch fresh cadet profile
   */
  const verifySession = useCallback(async (authToken) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return false;
    }

    try {
      setLoading(true);
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (res.data?.user) {
        setUser(res.data.user);
        setError(null);
        return true;
      }
      throw new Error('Malformed telemetry payload.');
    } catch (err) {
      console.warn('[AUTH_SESSION_INVALID]', err.message || err);
      localStorage.removeItem('nsut_token');
      setToken(null);
      setUser(null);
      setError(err.message || 'Session expired or rejected.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial verification on mount
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  /**
   * Establish authenticated session from inbound token
   */
  const login = async (newToken) => {
    localStorage.setItem('nsut_token', newToken);
    setToken(newToken);
    return await verifySession(newToken);
  };

  /**
   * Disengage active session
   */
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (err) {
      console.warn('[LOGOUT_TX_ERR]', err);
    } finally {
      localStorage.removeItem('nsut_token');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  /**
   * Development / Test Mock Authenticator
   */
  const loginDev = async (email = 'cadet@nsut.ac.in', role = 'student') => {
    try {
      setLoading(true);
      const res = await api.post('/auth/dev-login', { email, role });
      if (res.data?.token) {
        localStorage.setItem('nsut_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setError(null);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      setError(err.message || 'Dev login handshake failed.');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user && !!token,
    isOnboarded: !!user?.isOnboarded,
    loading,
    error,
    login,
    logout,
    loginDev,
    verifySession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an active <AuthProvider>');
  }
  return context;
};

export default AuthContext;