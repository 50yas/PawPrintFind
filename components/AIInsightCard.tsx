
import React from 'react';
import { AIInsight } from '../types';
import { motion } from 'framer-motion';

interface AIInsightCardProps {
  insight: AIInsight;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'health':
        return (
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'behavior':
        return (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'safety':
        return (
          <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4"
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-foreground text-sm">{insight.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{insight.content}</p>
        <p className="text-[10px] text-muted-foreground/50 pt-1">
          {new Date(insight.timestamp).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};
