import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiJson } from "../api/client";

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
  ready: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const res = await apiJson("/api/me");
        if (!cancelled && res.ok) {
          const me = (await res.json()) as AuthUser;
          setUser({ name: me.name, email: me.email });
        } else if (!cancelled) {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await apiJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      return res.status === 201;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiJson("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, ready, login, register, logout }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
