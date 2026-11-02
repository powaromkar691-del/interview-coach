import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthTokenGetter } from "@/lib/authToken";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const apiUrl = (path: string) => `${API_ORIGIN}/api${path}`;

interface User {
  id: string;
  fullName: string;
  primaryEmailAddress: { emailAddress: string };
  imageUrl?: string;
}
interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: User | null;
  signOut: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
}
const TOKEN_KEY = "interview_coach_token";
const USER_KEY = "interview_coach_user";
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false, isLoaded: false, user: null,
  signOut: () => {}, signIn: async () => {}, signUp: async () => {},
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  return {
    isSignedIn: ctx.isSignedIn,
    isLoaded: ctx.isLoaded,
    userId: ctx.user?.id ?? null,
    getToken: async () => localStorage.getItem(TOKEN_KEY),
    signOut: ctx.signOut,
    signIn: ctx.signIn,
    signUp: ctx.signUp,
  };
};
export const useUser = () => {
  const ctx = useContext(AuthContext);
  return { isSignedIn: ctx.isSignedIn, isLoaded: ctx.isLoaded, user: ctx.user };
};
export function Show({ when, children }: { when: "signed-in" | "signed-out"; children: ReactNode }) {
  const { isSignedIn, isLoaded } = useContext(AuthContext);
  if (!isLoaded) return null;
  if (when === "signed-in" && isSignedIn) return <>{children}</>;
  if (when === "signed-out" && !isSignedIn) return <>{children}</>;
  return null;
}
export function UserButton() {
  const { user, signOut } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  return <div className="relative">
    <button type="button" onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none ring-2 ring-indigo-200" title={user?.fullName || "Student Account"}>
      {(user?.fullName || "Student").charAt(0).toUpperCase()}
    </button>
    {open && <div className="absolute right-0 z-50 mt-2 w-56 animate-in fade-in zoom-in-95 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2 border-b border-slate-100 pb-2"><p className="text-sm font-medium text-slate-900">{user?.fullName || "Student"}</p><p className="truncate text-xs text-slate-500">{user?.primaryEmailAddress.emailAddress || ""}</p></div>
      <button type="button" onClick={() => { setOpen(false); signOut(); }} className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50">Sign out</button>
    </div>}
  </div>;
}

export default function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(async () => localStorage.getItem(TOKEN_KEY));
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoaded(true); return; }
    fetch(apiUrl("/users/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session expired");
        const data = await response.json();
        const nextUser: User = { id: data.user_id, fullName: data.name, primaryEmailAddress: { emailAddress: data.email }, imageUrl: data.picture || undefined };
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser); setIsSignedIn(true);
      })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); setIsSignedIn(false); })
      .finally(() => setIsLoaded(true));
  }, []);

  const acceptSession = (data: { token: string; user: { id: string; name: string; email: string } }) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    const nextUser: User = { id: data.user.id, fullName: data.user.name, primaryEmailAddress: { emailAddress: data.user.email } };
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setAuthTokenGetter(async () => localStorage.getItem(TOKEN_KEY));
    setUser(nextUser); setIsSignedIn(true);
  };
  const signIn = async (email: string, password: string) => {
    const response = await fetch(apiUrl("/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unable to sign in.");
    acceptSession(data); navigate("/dashboard");
  };
  const signUp = async (name: string, email: string, password: string) => {
    const response = await fetch(apiUrl("/auth/register"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unable to create account.");
    acceptSession(data); navigate("/onboarding");
  };
  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setUser(null); setIsSignedIn(false); navigate("/sign-in");
  };
  return <AuthContext.Provider value={{ isSignedIn, isLoaded, user, signOut, signIn, signUp }}>{children}</AuthContext.Provider>;
}
