"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("factibiz.theme") as Theme | null;
    const initialTheme = stored ?? "light";

    setTheme(initialTheme);
    document.body.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme = theme === "light" ? "dark" : "light";

        setTheme(nextTheme);
        document.body.classList.toggle("dark", nextTheme === "dark");
        window.localStorage.setItem("factibiz.theme", nextTheme);
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
