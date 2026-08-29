import { createContext, useContext, useState, type ReactNode } from "react";
import { googleLogin, login as loginApi } from "../api/endpoints";
import { clearToken, setToken } from "../api/client";
import type { Role, TokenResponse } from "../api/types";

interface AuthState {
  role: Role;
  studentId: number | null;
  username: string;
  name: string | null;
}

interface AuthContextValue {
  auth: AuthState | null;
  login: (username: string, password: string) => Promise<AuthState>;
  loginWithGoogle: (idToken: string) => Promise<AuthState>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_STORAGE_KEY = "ready_auth_state";

function loadStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function applyToken(res: TokenResponse): AuthState {
  setToken(res.access_token);
  const state: AuthState = {
    role: res.role,
    studentId: res.student_id,
    username: res.username,
    name: res.name,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(loadStoredAuth());

  async function login(username: string, password: string): Promise<AuthState> {
    const state = applyToken(await loginApi(username, password));
    setAuth(state);
    return state;
  }

  async function loginWithGoogle(idToken: string): Promise<AuthState> {
    const state = applyToken(await googleLogin(idToken));
    setAuth(state);
    return state;
  }

  function logout() {
    clearToken();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, loginWithGoogle, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
