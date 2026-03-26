"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, PencilRuler } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/evaluacion", label: "Evaluación", icon: PencilRuler },
  { href: "/resultado", label: "Resultados", icon: BarChart3 },
  { href: "/informe", label: "Informe", icon: FileText }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-950">
            F
          </div>
          <div>
            <p className="font-serif text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Factibiz
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Evaluación de factibilidad académica</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
