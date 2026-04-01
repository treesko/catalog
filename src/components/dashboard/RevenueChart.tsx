"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="card p-6 animate-fade-in-up stagger-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-6">
          Revenue Over Time
        </h3>
        <div className="flex items-center justify-center h-56 text-sand text-sm">
          No data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 animate-fade-in-up stagger-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-muted mb-6">
        Revenue Over Time
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={32}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,0,0,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [`€${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Revenue"]}
              contentStyle={{
                background: "#1a1a1a",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "13px",
                color: "white",
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
              itemStyle={{ color: "white" }}
              labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginBottom: "2px" }}
              cursor={{ fill: "rgba(0,0,0,0.03)", radius: 8 }}
            />
            <Bar
              dataKey="revenue"
              fill="#064e3b"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
