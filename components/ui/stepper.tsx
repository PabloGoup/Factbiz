import { STEP_TITLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {STEP_TITLES.map((title, index) => {
        const step = index + 1;
        const completed = step < currentStep;
        const active = step === currentStep;

        return (
          <div
            key={title}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm transition",
              active &&
                "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950",
              completed &&
                "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/80 dark:bg-emerald-950/50 dark:text-emerald-100",
              !active &&
                !completed &&
                "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Paso {step}</p>
            <p className="mt-1 font-medium">{title}</p>
          </div>
        );
      })}
    </div>
  );
}
