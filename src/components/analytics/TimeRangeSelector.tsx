import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

export type TimeRange = 'today' | '7days' | '30days' | '90days' | 'custom';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange, startDate?: Date, endDate?: Date) => void;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  customStartDate,
  customEndDate
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(
    customStartDate ? format(customStartDate, 'yyyy-MM-dd') : format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [tempEndDate, setTempEndDate] = useState<string>(
    customEndDate ? format(customEndDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );

  const ranges: { id: TimeRange; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: '7days', label: 'Last 7 Days', icon: '📊' },
    { id: '30days', label: 'Last 30 Days', icon: '📈' },
    { id: '90days', label: 'Last 90 Days', icon: '📉' },
    { id: 'custom', label: 'Custom Range', icon: '🗓️' }
  ];

  const handleRangeClick = (rangeId: TimeRange) => {
    if (rangeId === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      onChange(rangeId);
    }
  };

  const handleApplyCustomRange = () => {
    const start = startOfDay(new Date(tempStartDate));
    const end = endOfDay(new Date(tempEndDate));
    onChange('custom', start, end);
    setShowCustomPicker(false);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (value) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case '7days':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30days':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90days':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      case 'custom':
        return {
          start: customStartDate || startOfDay(subDays(now, 7)),
          end: customEndDate || endOfDay(now)
        };
      default:
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    }
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-4">
      {/* Range Buttons */}
      <div className="flex flex-wrap gap-2">
        {ranges.map((range) => (
          <button
            key={range.id}
            onClick={() => handleRangeClick(range.id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              value === range.id
                ? 'bg-primary/20 text-primary border-primary/50 neon-glow-teal'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mr-1">{range.icon}</span>
            {range.label}
          </button>
        ))}
      </div>

      {/* Date Range Display */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 px-2">
        <span className="text-slate-500">📍</span>
        <span>
          {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
        </span>
      </div>

      {/* Custom Date Picker Modal */}
      <AnimatePresence>
        {showCustomPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-4"
          >
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🗓️</span>
              Custom Date Range
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  max={tempEndDate}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCustomPicker(false)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomRange}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary text-black border border-primary hover:bg-primary/90 transition-all neon-glow-teal"
              >
                Apply Range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { format, subDays, subMonths, startOfDay, endOfDay };
