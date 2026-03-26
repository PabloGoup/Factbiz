import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  error,
  children,
  className
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</span>
        {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span> : null}
    </label>
  );
}
