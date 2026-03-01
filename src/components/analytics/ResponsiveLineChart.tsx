import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface ResponsiveLineChartProps {
  data: DataPoint[];
  lines: {
    dataKey: string;
    stroke?: string;
    name?: string;
    strokeWidth?: number;
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showArea?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  yAxisLabel?: string;
}

export const ResponsiveLineChart: React.FC<ResponsiveLineChartProps> = ({
  data,
  lines,
  xAxisKey,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  showArea = false,
  loading = false,
  emptyMessage = 'No data available',
  yAxisLabel
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-bold text-white">
                {entry.name}:
              </span>
              <span className="text-xs font-mono text-primary">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm text-slate-400 font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {title}
        </h3>
      )}

      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4" style={{ height, minHeight: height, minWidth: 0 }}>
        <ResponsiveContainer width="99%" height="100%">
          <ChartComponent data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              label={
                yAxisLabel
                  ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'rgba(148, 163, 184, 0.8)', fontSize: 10, fontWeight: 'bold' }
                  }
                  : undefined
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                iconType="line"
              />
            )}
            {lines.map((line, index) => {
              if (showArea) {
                return (
                  <Area
                    key={line.dataKey}
                    type="monotone"
                    dataKey={line.dataKey}
                    stroke={line.stroke || `hsl(${index * 60}, 70%, 50%)`}
                    fill={line.stroke || `hsl(${index * 60}, 70%, 50%)`}
                    fillOpacity={0.2}
                    strokeWidth={line.strokeWidth || 2}
                    name={line.name || line.dataKey}
                    activeDot={{ r: 6, fill: line.stroke }}
                  />
                );
              }
              return (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke || `hsl(${index * 60}, 70%, 50%)`}
                  strokeWidth={line.strokeWidth || 2}
                  name={line.name || line.dataKey}
                  dot={{ fill: line.stroke, r: 3 }}
                  activeDot={{ r: 6, fill: line.stroke }}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
