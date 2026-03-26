"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function FinalScoreDonut({ score }: { score: number }) {
  const data = [
    { name: "score", value: score },
    { name: "restante", value: 10 - score }
  ];

  return (
    <div className="relative h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={72}
            outerRadius={96}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill="#0f4c81" />
            <Cell fill="#dbe7f5" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif text-5xl font-semibold text-slate-950 dark:text-slate-50">{score.toFixed(1)}</span>
        <span className="mt-2 text-sm text-slate-500 dark:text-slate-400">Score de factibilidad</span>
      </div>
    </div>
  );
}
