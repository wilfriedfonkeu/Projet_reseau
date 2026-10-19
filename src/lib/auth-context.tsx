"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getCurrentUser, login as authLogin, logout as authLogout, register as authRegister, updateProfile as authUpdateProfile, type DtUser, type UserRole } from "./auth-store";

interface AuthContextType {
  user: DtUser | null;
  login: (email: string, password: string) => { user: DtUser | null; error: string | null };
  logout: () => void;
  register: (data: { firstName: string; lastName: string; email: string; phone: string; password: string; role: UserRole; companyName?: string }) => { user: DtUser | null; error: string | null };
  updateProfile: (updates: Partial<DtUser>) => DtUser | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DtUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());

    const handler = () => setUser(getCurrentUser());
    window.addEventListener("focus", handler);
    window.addEventListener("dt-auth-change", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("dt-auth-change", handler);
    };
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = authLogin(email, password);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const register = useCallback((data: { firstName: string; lastName: string; email: string; phone: string; password: string; role: UserRole; companyName?: string }) => {
    const result = authRegister(data);
    setUser(result.user);
    return result;
  }, []);

  const updateProfile = useCallback((updates: Partial<DtUser>) => {
    const updated = authUpdateProfile(updates);
    if (updated) setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
