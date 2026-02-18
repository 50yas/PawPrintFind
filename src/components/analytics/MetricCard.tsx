import React, { useEffect, useState } from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  trend?: 'up' | 'down' | 'neutral';
  decimals?: number;
  loading?: boolean;
  onClick?: () => void;
  sparklineData?: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  suffix = '',
  prefix = '',
  icon,
  colorClass = 'bg-primary/10 text-primary',
  trend,
  decimals = 0,
  loading = false,
  onClick,
  sparklineData = []
}) => {
  const [startValue, setStartValue] = useState(0);

  useEffect(() => {
    setStartValue(previousValue || 0);
  }, [previousValue]);

  const calculateTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return change;
  };

  const trendValue = trend ? calculateTrend() : null;
  const trendIcon = trendValue !== null ? (
    trendValue > 0 ? '↑' : trendValue < 0 ? '↓' : '→'
  ) : null;

  const trendColor = trendValue !== null ? (
    trendValue > 0 ? 'text-green-400' : trendValue < 0 ? 'text-red-400' : 'text-slate-400'
  ) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      } overflow-hidden group`}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">
              {title}
            </p>
            {sparklineData.length > 0 && (
              <div className="flex gap-0.5 h-6 items-end">
                {sparklineData.slice(-12).map((val, i) => {
                  const maxVal = Math.max(...sparklineData);
                  const height = (val / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/30 rounded-t-sm transition-all group-hover:bg-primary/50"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform shadow-lg`}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-2">
          {loading ? (
            <div className="h-10 w-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
          ) : (
            <>
              <h3 className="text-4xl font-black text-white tracking-tight font-mono">
                {prefix}
                <CountUp
                  start={startValue}
                  end={value}
                  duration={1.5}
                  decimals={decimals}
                  separator=","
                  suffix={suffix}
                />
              </h3>
              {trendValue !== null && (
                <span className={`text-sm font-bold ${trendColor} flex items-center gap-1`}>
                  {trendIcon} {Math.abs(trendValue).toFixed(1)}%
                </span>
              )}
            </>
          )}
        </div>

        {/* Trend indicator */}
        {previousValue !== undefined && !loading && (
          <p className="text-[9px] text-slate-500 font-mono">
            vs. previous period: {prefix}{previousValue.toFixed(decimals)}{suffix}
          </p>
        )}
      </div>

      {/* Scan line animation */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </motion.div>
  );
};
