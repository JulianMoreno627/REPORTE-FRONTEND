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
  const [signedOut, setSignedOut] = useState(false);

  const endSession = useCallback((byUser) => {
    api.setToken(null);
    storeUser(null);
    setSignedOut(byUser);
    setUser(null);
  }, []);

  const logout = useCallback(() => endSession(true), [endSession]);
  const expireSession = useCallback(() => endSession(false), [endSession]);

  useEffect(() => {
    api.onUnauthorized(expireSession);
    if (!api.token) return undefined;
    const controller = new AbortController();
    authApi.me({ signal: controller.signal })
      .then(({ user: current }) => {
        storeUser(current);
        setUser(current);
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && error.isUnauthorized) expireSession();
      })
      .finally(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, [expireSession]);

  const startSession = useCallback(({ token, user: account }) => {
    api.setToken(token);
    storeUser(account);
    setSignedOut(false);
    setUser(account);
    return account;
  }, []);

  const updateUser = useCallback((account) => {
    storeUser(account);
    setUser(account);
    return account;
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    isAuthenticated: Boolean(user),
    isOfficial: user?.role === 'OFFICIAL',
    signedOut,
    login: async (credentials) => startSession(await authApi.login(credentials)),
    register: async (data) => startSession(await authApi.register(data)),
    updateUser,
    logout,
  }), [user, ready, signedOut, startSession, updateUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
