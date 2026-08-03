'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** User roles map to access tiers across the app */
export type UserRole = 'admin' | 'gestao' | 'vendedor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Initials derived from user name (e.g. "João Silva" → "JS") */
  initials: string;
  avatarUrl?: string;
  /** Sales folder/region the user belongs to (A–F) */
  pasta?: string;
  /** Route identifier within the folder (e.g. "ST-08") */
  route?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** True while authentication state is being resolved */
  isLoading: boolean;
  /** Attempt to log in with email and password. Returns true on success. */
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

/* ------------------------------------------------------------------ */
/*  Demo users (Phase 1 — hard-coded credentials)                      */
/* ------------------------------------------------------------------ */

interface DemoUser extends User {
  password: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: '1',
    name: 'Kayo',
    email: 'kayo@seekpi.com',
    password: 'admin123',
    role: 'admin',
    initials: 'KA',
  },
  {
    id: '2',
    name: 'Carlos Silva',
    email: 'carlos@seekpi.com',
    password: 'gestao123',
    role: 'gestao',
    initials: 'CS',
    pasta: 'E',
  },
  {
    id: '3',
    name: 'Natan Abner',
    email: 'natan@seekpi.com',
    password: 'gestao123',
    role: 'gestao',
    initials: 'NA',
    pasta: 'E',
    route: 'ST',
  },
  {
    id: '4',
    name: 'Gabriel Cavalcante',
    email: 'gabriel@seekpi.com',
    password: 'vend123',
    role: 'vendedor',
    initials: 'GC',
    pasta: 'E',
    route: 'ST-08',
  },
];

/* ------------------------------------------------------------------ */
/*  LocalStorage key                                                    */
/* ------------------------------------------------------------------ */

const AUTH_STORAGE_KEY = 'seekpi_auth_user';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Rehydrate auth from localStorage on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Attempt to log in with email + password. Returns true on success. */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate network latency for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    const match = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (!match) return false;

    // Strip password before storing the user object
    const { password: _pw, ...safeUser } = match;
    setUser(safeUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));

    return true;
  }, []);

  /** Log out — clear state and storage */
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
