import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
          "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:border-slate-500 dark:focus:ring-slate-800",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
