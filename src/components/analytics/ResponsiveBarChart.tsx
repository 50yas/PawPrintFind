import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DataPoint {
  [key: string]: string | number;
}

interface ResponsiveBarChartProps {
  data: DataPoint[];
  bars: {
    dataKey: string;
    fill?: string;
    name?: string;
  }[];
  xAxisKey: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  colors?: string[];
  horizontal?: boolean;
}

export const ResponsiveBarChart: React.FC<ResponsiveBarChartProps> = ({
  data,
  bars,
  xAxisKey,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  loading = false,
  emptyMessage = 'No data available',
  colors = ['#14B8A6', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B'],
  horizontal = false
}) => {
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
                style={{ backgroundColor: entry.fill }}
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
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 20, left: horizontal ? 60 : 0, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            )}
            {horizontal ? (
              <>
                <XAxis
                  type="number"
                  stroke="rgba(148, 163, 184, 0.5)"
                  tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  stroke="rgba(148, 163, 184, 0.5)"
                  tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
                  width={100}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  stroke="rgba(148, 163, 184, 0.5)"
                  tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="rgba(148, 163, 184, 0.5)"
                  tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 11, fontFamily: 'monospace' }}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                wrapperStyle={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
              />
            )}
            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.fill || colors[index % colors.length]}
                name={bar.name || bar.dataKey}
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={bar.fill || colors[idx % colors.length]} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
