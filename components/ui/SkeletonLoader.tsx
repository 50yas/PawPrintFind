
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-white/10 rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col gap-4 border border-white/10 h-full">
    <Skeleton className="h-48 w-full rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 py-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl mt-4" />
    </div>
  </div>
);

export const MapSidebarSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-grow space-y-2 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
