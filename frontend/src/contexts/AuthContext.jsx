import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('finance_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setBooting(false);
  }, []);

  async function register(payload) {
    const resp = await api.post('/auth/register', payload);
    const data = resp.data.data;
    localStorage.setItem('finance_token', data.token);
    localStorage.setItem('finance_user', JSON.stringify(data.user));
    setUser(data.user);
    return data; // return data so caller can access totpUri and backupCodes
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    localStorage.setItem('finance_token', data.data.token);
    localStorage.setItem('finance_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }

  async function refreshProfile() {
    const { data } = await api.get('/users/me');
    localStorage.setItem('finance_user', JSON.stringify(data.data));
    setUser(data.data);
  }

  function logout() {
    localStorage.removeItem('finance_token');
    localStorage.removeItem('finance_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, booting, register, login, logout, refreshProfile }), [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
