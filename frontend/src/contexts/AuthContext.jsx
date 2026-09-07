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
    localStorage.setItem('finance_access_token', data.accessToken);
    localStorage.setItem('finance_refresh_token', data.refreshToken);
    localStorage.setItem('finance_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function login(payload) {
    const { data } = await api.post('/auth/login', payload);
    const authData = data.data;
    localStorage.setItem('finance_access_token', authData.accessToken);
    localStorage.setItem('finance_refresh_token', authData.refreshToken);
    localStorage.setItem('finance_user', JSON.stringify(authData.user));
    setUser(authData.user);
  }

  async function backupLogin(payload) {
    const { data } = await api.post('/auth/totp/backup-login', payload);
    const authData = data.data;
    localStorage.setItem('finance_access_token', authData.accessToken);
    localStorage.setItem('finance_refresh_token', authData.refreshToken);
    localStorage.setItem('finance_user', JSON.stringify(authData.user));
    setUser(authData.user);
  }

  async function refreshProfile() {
    const { data } = await api.get('/users/me');
    localStorage.setItem('finance_user', JSON.stringify(data.data));
    setUser(data.data);
  }

  async function logout() {
    const refreshToken = localStorage.getItem('finance_refresh_token');

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignora falha de logout no backend, mas limpa sessão local para evitar bloqueio.
    }

    localStorage.removeItem('finance_access_token');
    localStorage.removeItem('finance_refresh_token');
    localStorage.removeItem('finance_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, booting, register, login, backupLogin, logout, refreshProfile }), [user, booting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
