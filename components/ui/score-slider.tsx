import { cn } from "@/lib/utils";

export function ScoreSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Bajo</span>
        <span className="rounded-full bg-slate-900 px-2 py-1 font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
          {value}/10
        </span>
        <span>Alto</span>
      </div>
      <div className="relative h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
        <div
          className="pointer-events-none absolute inset-y-3 left-3 rounded-full bg-slate-900/10 dark:bg-white/10"
          style={{ width: `calc(${percent}% - 12px)` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(
            "relative z-10 h-full w-full cursor-pointer appearance-none bg-transparent",
            "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
            "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-900 dark:[&::-webkit-slider-thumb]:bg-slate-100"
          )}
        />
      </div>
    </div>
  );
}
