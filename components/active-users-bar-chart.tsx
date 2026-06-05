"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CardContent } from "@/components/ui/card";

type Props = {
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  activeThisYear: number;
};

export function ActiveUsersBarChart({
  activeToday,
  activeThisWeek,
  activeThisMonth,
  activeThisYear,
}: Props) {
  const data = [
    { period: "Day", value: activeToday },
    { period: "Week", value: activeThisWeek },
    { period: "Month", value: activeThisMonth },
    { period: "Year", value: activeThisYear },
  ];

  const maxValue = Math.max(0, ...data.map((d) => d.value));

  return (
    <div className="h-[260px] w-full">
      {maxValue === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          No active user data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

