import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "clara-auth-user";
const KNOWN_USERS_KEY = "clara-known-users";

export const DEMO_ACCOUNT = {
  name: "Nghi yeu Duc",
  email: "demo@clara.app",
  password: "Demo@1234",
};

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthContext = createContext<AuthContextValue | null>(null);

const readStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

type KnownUsers = Record<string, string>;

const readKnownUsers = (): KnownUsers => {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KNOWN_USERS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as KnownUsers;
  } catch {
    return {};
  }
};

const rememberUserName = (email: string, name: string) => {
  const knownUsers = readKnownUsers();
  knownUsers[email] = name;
  window.localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(knownUsers));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Mock auth: there is no real backend, so "credentials" are just format-checked.
  const login = (email: string, password: string) => {
    if (!EMAIL_PATTERN.test(email) || password.length < 4) return false;

    const knownName = readKnownUsers()[email];
    const name =
      knownName ||
      (email === DEMO_ACCOUNT.email ? DEMO_ACCOUNT.name : email.split("@")[0] || "Người dùng");
    setUser({ name, email });
    return true;
  };

  // Registration only records the account; it does not log the user in.
  const register = (name: string, email: string, password: string) => {
    if (!EMAIL_PATTERN.test(email) || password.length < 4) return false;
    if (readKnownUsers()[email]) return false;

    rememberUserName(email, name);
    return true;
  };

  const logout = () => setUser(null);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
