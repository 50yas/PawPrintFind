import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface ResponsivePieChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export const ResponsivePieChart: React.FC<ResponsivePieChartProps> = ({
  data,
  title,
  height = 300,
  colors = ['#14B8A6', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'],
  showLegend = true,
  loading = false,
  emptyMessage = 'No data available',
  innerRadius = 0,
  outerRadius = 80
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = payload[0].payload.total || data.value;
      const percentage = ((data.value / total) * 100).toFixed(1);

      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.payload.fill }}
            />
            <span className="text-xs font-bold text-white">{data.name}</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono text-primary">
              Count: {data.value.toLocaleString()}
            </p>
            <p className="text-xs font-mono text-slate-400">
              {percentage}% of total
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 rounded-2xl border border-white/10"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 rounded-2xl border border-dashed border-white/10"
        style={{ height }}
      >
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-3 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="text-sm text-slate-400 font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Calculate total for percentage display
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithTotal = data.map(entry => ({ ...entry, total }));

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {title}
        </h3>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  stroke="rgba(15, 23, 42, 0.8)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                formatter={(value, entry: any) => {
                  const percentage = ((entry.payload.value / total) * 100).toFixed(1);
                  return `${value} (${percentage}%)`;
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
