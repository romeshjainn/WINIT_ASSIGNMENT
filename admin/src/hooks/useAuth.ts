import { useState } from 'react';
import Cookies from 'js-cookie';
import { TOKEN_KEY } from '@/constants/env';
import type { User } from '@/types/index';

const USER_KEY = 'auth_user';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });

  function login(newToken: string, newUser: User) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    Cookies.set(TOKEN_KEY, newToken, { expires: 7 });
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    Cookies.remove(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return { token, user, login, logout, isAuthenticated: !!token };
}
