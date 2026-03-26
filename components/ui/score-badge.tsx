import { cn } from "@/lib/utils";

export function ScoreBadge({ score, classification }: { score: number; classification: string }) {
  const colorClass =
    classification === "Factible"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100"
      : classification === "Factible con riesgos"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100"
        : "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-100";

  return (
    <div className={cn("inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold", colorClass)}>
      <span>{classification}</span>
      <span className="rounded-full bg-white/80 px-2 py-1 text-xs dark:bg-slate-900/70">{score.toFixed(1)}/10</span>
    </div>
  );
}
