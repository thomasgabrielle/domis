import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  department: string | null;
  district: string | null;
  role: { name: string; displayName: string } | null;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (...perms: string[]) => boolean;
  hasAnyPermission: (...perms: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.id) setUser(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Login failed");
    }
    const data = await res.json();
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (...perms: string[]) => {
      if (!user) return false;
      return perms.every((p) => user.permissions.includes(p));
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (...perms: string[]) => {
      if (!user) return false;
      return perms.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, hasPermission, hasAnyPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Route guard component — renders children only if user is authenticated and has permission */
export function ProtectedRoute({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: string | string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login
    setLocation("/login");
    return null;
  }

  // Check permissions if specified
  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission];
    const hasAccess = perms.some((p) => user.permissions.includes(p));
    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="text-primary underline text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
