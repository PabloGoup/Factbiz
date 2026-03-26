"use client";

import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
        "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      {theme === "light" ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}
