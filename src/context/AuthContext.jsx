import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { authApi } from '../api/endpoints.js';
import { USER_STORAGE_KEY } from '../config.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return api.token ? JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [ready, setReady] = useState(!api.token || Boolean(readStoredUser()));

  const logout = useCallback(() => {
    api.setToken(null);
    storeUser(null);
    setUser(null);
  }, []);

  useEffect(() => {
    api.onUnauthorized(logout);
    if (!api.token) return undefined;
    const controller = new AbortController();
    authApi.me({ signal: controller.signal })
      .then(({ user: current }) => {
        storeUser(current);
        setUser(current);
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && error.isUnauthorized) logout();
      })
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, [logout]);

  const startSession = useCallback(({ token, user: account }) => {
    api.setToken(token);
    storeUser(account);
    setUser(account);
    return account;
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    isAuthenticated: Boolean(user),
    isOfficial: user?.role === 'OFFICIAL',
    login: async (credentials) => startSession(await authApi.login(credentials)),
    register: async (data) => startSession(await authApi.register(data)),
    logout,
  }), [user, ready, startSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
