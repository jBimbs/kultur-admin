"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from "recharts";

type ChartData = {
  name: string;
  value: number;
  color: string;
};

const RADIAN = Math.PI / 180;

export function UserPieChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-slate-500">
        No data available
      </div>
    );
  }

  const totalValue = data.reduce((sum, entry) => sum + entry.value, 0);

  const renderCenterLabel = (props: any) => {
    const viewBox = props.viewBox ?? props;
    const cx = Number.isFinite(viewBox?.cx) ? viewBox.cx : Number(viewBox?.x ?? 0);
    const cy = Number.isFinite(viewBox?.cy) ? viewBox.cy : Number(viewBox?.y ?? 0);

    if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
      return null;
    }

    return (
      <g>
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" fill="#000" fontSize={18} fontWeight={700}>
          100%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" fill="#475569" fontSize={12}>
          {totalValue}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={false}
          labelLine={false}
        >
          <Label content={renderCenterLabel} position="center" />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}