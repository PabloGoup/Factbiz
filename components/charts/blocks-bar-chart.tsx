"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { BlockScore } from "@/types";

export function BlocksBarChart({ blocks }: { blocks: BlockScore[] }) {
  const data = blocks.map((block) => ({
    name: block.label,
    score: block.score
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.10)" }} />
          <Bar dataKey="score" radius={[12, 12, 0, 0]} fill="#0f4c81" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
