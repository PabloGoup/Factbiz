"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RiskBalanceChart({
  positives,
  risks
}: {
  positives: number;
  risks: number;
}) {
  const data = [
    { name: "Positivos", value: positives, fill: "#0e7490" },
    { name: "Riesgos", value: risks, fill: "#b45309" }
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[12, 12, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
