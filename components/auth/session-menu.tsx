"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export function SessionMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback((options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    return fetch("/api/auth/session", {
      cache: "no-store"
    })
      .then((response) => response.json())
      .then((payload: { user?: SessionUser | null }) => {
        setUser(payload.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void loadSession({ silent: true });
  }, [loadSession, pathname]);

  useEffect(() => {
    const refreshSession = () => {
      void loadSession({ silent: true });
    };

    window.addEventListener("factibiz-auth-changed", refreshSession);
    window.addEventListener("focus", refreshSession);

    return () => {
      window.removeEventListener("factibiz-auth-changed", refreshSession);
      window.removeEventListener("focus", refreshSession);
    };
  }, [loadSession]);

  const signOut = async () => {
    await fetch("/api/auth/session", {
      method: "DELETE"
    });
    setUser(null);
    window.dispatchEvent(new Event("factibiz-auth-changed"));
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="hidden h-10 w-24 rounded-full bg-slate-100 dark:bg-slate-900 md:block" aria-label="Cargando sesion" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn(
          "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
          "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
        )}
      >
        <LogIn className="mr-2 h-4 w-4" />
        Ingresar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 lg:flex">
        <UserRound className="h-4 w-4" />
        <span className="max-w-36 truncate">{user.name || user.email}</span>
      </div>
      <Button variant="ghost" onClick={() => void signOut()} aria-label="Cerrar sesion">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
