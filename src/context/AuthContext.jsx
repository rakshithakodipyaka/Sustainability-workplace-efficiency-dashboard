import { createContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../services/api';
import { hydrate, clear as clearCache } from '../services/dataCache';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: currentUser } = await api.get('/auth/me');
        await hydrate();
        if (!cancelled) setUser(currentUser);
      } catch {
        clearToken();
        clearCache();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (employeeId, password) => {
    try {
      const result = await api.post('/auth/login', { employeeId, password });
      setToken(result.token);
      await hydrate();
      setUser(result.user);
      return { success: true, user: result.user };
    } catch (err) {
      clearToken();
      clearCache();
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    }
    clearToken();
    clearCache();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
