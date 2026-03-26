"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

import type { BlockScore } from "@/types";

export function BlocksRadarChart({ blocks }: { blocks: BlockScore[] }) {
  const data = blocks.map((block) => ({
    subject: block.label,
    score: block.score
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#cbd5e1" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
          <Radar dataKey="score" fill="#0f4c81" fillOpacity={0.22} stroke="#0f4c81" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
