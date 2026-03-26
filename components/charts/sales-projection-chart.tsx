"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatNumber } from "@/lib/utils";

export function SalesProjectionChart({
  data,
  currency
}: {
  data: { month: string; sales: number }[];
  currency: string;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="salesProjection" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.38} />
              <stop offset="95%" stopColor="#0f4c81" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip formatter={(value) => `${currency} ${formatNumber(Number(value))}`} />
          <Area type="monotone" dataKey="sales" stroke="#0f4c81" fill="url(#salesProjection)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
