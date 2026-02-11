
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'button';
  animate?: boolean;
}

/**
 * Base Skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'default',
  animate = true
}) => {
  const variantStyles = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-xl h-10'
  };

  return (
    <div
      className={`bg-white/5 relative overflow-hidden backdrop-blur-sm ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      {animate && (
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          }}
        />
      )}
    </div>
  );
};

/**
 * Pet Card Skeleton - matches PetCard layout
 */
export const PetCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className="glass-card-enhanced rounded-3xl p-4 md:p-6 flex flex-col gap-4 border border-white/10 h-full">
    <Skeleton className={`w-full rounded-2xl ${compact ? 'h-32' : 'h-40 md:h-48'}`} />
    <div className="space-y-3 flex-grow">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 md:h-7 w-2/3 rounded-lg" />
        <Skeleton className="h-6 w-6 rounded-full" variant="circular" />
      </div>
      <Skeleton className="h-4 w-1/2 rounded" />
      {!compact && (
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      )}
      <div className="flex gap-2 pt-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-10 md:h-12 w-full rounded-xl mt-auto" variant="button" />
  </div>
);

/**
 * Card Skeleton (legacy export)
 */
export const CardSkeleton = PetCardSkeleton;

/**
 * Dashboard Stats Skeleton
 */
export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="glass-panel p-4 md:p-5 rounded-2xl border border-white/10">
        <Skeleton className="h-3 w-1/2 rounded mb-3" />
        <Skeleton className="h-8 md:h-10 w-3/4 rounded-lg mb-2" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    ))}
  </div>
);

/**
 * Map Sidebar Skeleton
 */
export const MapSidebarSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3 md:space-y-4 p-3 md:p-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex gap-3 md:gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
        <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex-shrink-0" />
        <div className="flex-grow space-y-2 py-1 min-w-0">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Profile Header Skeleton
 */
export const ProfileHeaderSkeleton = () => (
  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 p-4 md:p-6">
    <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" variant="circular" />
    <div className="flex-grow space-y-3 text-center md:text-left w-full md:w-auto">
      <Skeleton className="h-6 md:h-8 w-48 mx-auto md:mx-0 rounded-lg" />
      <Skeleton className="h-4 w-32 mx-auto md:mx-0 rounded" />
      <div className="flex gap-2 justify-center md:justify-start pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <div className="flex items-center gap-4 p-4 border-b border-white/5">
    {[...Array(columns)].map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 rounded ${i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'flex-1'}`}
      />
    ))}
  </div>
);

/**
 * Table Skeleton with header and rows
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5
}) => (
  <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
    <div className="flex items-center gap-4 p-4 bg-white/5 border-b border-white/10">
      {[...Array(columns)].map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded ${i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'flex-1'}`}
        />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <TableRowSkeleton key={i} columns={columns} />
    ))}
  </div>
);

/**
 * Chat Message Skeleton
 */
export const ChatMessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
    {!isUser && <Skeleton className="w-8 h-8 flex-shrink-0 rounded-full" variant="circular" />}
    <div className={`space-y-2 max-w-[70%] ${isUser ? 'items-end' : ''}`}>
      <Skeleton className={`h-12 md:h-16 rounded-2xl ${isUser ? 'w-48' : 'w-64'}`} />
    </div>
  </div>
);

/**
 * Form Input Skeleton
 */
export const FormInputSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-3 w-24 rounded" />
    <Skeleton className="h-12 w-full rounded-xl" />
  </div>
);

/**
 * Dashboard Grid Skeleton - Full dashboard layout
 */
export const DashboardSkeleton = () => (
  <div className="space-y-6 md:space-y-8 p-4 md:p-6">
    {/* Stats Row */}
    <StatsSkeleton count={4} />

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <PetCardSkeleton key={i} compact={i > 2} />
      ))}
    </div>
  </div>
);

/**
 * Empty State with skeleton styling
 */
export const EmptyStateSkeleton = () => (
  <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
    <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6" variant="circular" />
    <Skeleton className="h-6 md:h-8 w-48 rounded-lg mb-3" />
    <Skeleton className="h-4 w-64 rounded mb-2" />
    <Skeleton className="h-4 w-56 rounded mb-6" />
    <Skeleton className="h-12 w-40 rounded-xl" variant="button" />
  </div>
);

/**
 * List Item Skeleton - for list views
 */
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 md:p-4 glass-panel rounded-xl border border-white/5">
    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex-shrink-0" />
    <div className="flex-grow space-y-2 min-w-0">
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
    <Skeleton className="w-6 h-6 rounded flex-shrink-0" />
  </div>
);

/**
 * Detail View Skeleton - for pet/patient detail pages
 */
export const DetailViewSkeleton: React.FC = () => (
  <div className="space-y-6 md:space-y-8 animate-fade-in">
    {/* Hero Image */}
    <Skeleton className="w-full h-64 md:h-96 rounded-3xl" />

    {/* Title Section */}
    <div className="space-y-3 px-4">
      <Skeleton className="h-8 md:h-10 w-1/2 rounded-lg" />
      <Skeleton className="h-4 w-1/3 rounded" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>

    {/* Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
      <div className="glass-panel p-4 rounded-2xl space-y-3 border border-white/10">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
      <div className="glass-panel p-4 rounded-2xl space-y-3 border border-white/10">
        <Skeleton className="h-5 w-1/3 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-3 px-4">
      <Skeleton className="h-12 flex-1 rounded-xl" variant="button" />
      <Skeleton className="h-12 flex-1 rounded-xl" variant="button" />
    </div>
  </div>
);

/**
 * Modal Skeleton - for loading modal content
 */
export const ModalSkeleton: React.FC = () => (
  <div className="space-y-4 p-6 animate-fade-in">
    {/* Header */}
    <div className="space-y-2 border-b border-white/10 pb-4">
      <Skeleton className="h-6 w-1/2 rounded-lg" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>

    {/* Content */}
    <div className="space-y-3 py-4">
      <FormInputSkeleton />
      <FormInputSkeleton />
      <FormInputSkeleton />
    </div>

    {/* Footer */}
    <div className="flex gap-3 pt-4 border-t border-white/10">
      <Skeleton className="h-12 flex-1 rounded-xl" variant="button" />
      <Skeleton className="h-12 flex-1 rounded-xl" variant="button" />
    </div>
  </div>
);

/**
 * Navigation Skeleton - for loading nav items
 */
export const NavigationSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="flex flex-col md:flex-row gap-2 md:gap-4">
    {[...Array(count)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full md:w-24 rounded-xl" />
    ))}
  </div>
);

/**
 * Appointment Card Skeleton - for appointment lists
 */
export const AppointmentCardSkeleton: React.FC = () => (
  <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-grow">
        <Skeleton className="h-5 w-2/3 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-32 rounded" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-8 flex-1 rounded-lg" variant="button" />
      <Skeleton className="h-8 flex-1 rounded-lg" variant="button" />
    </div>
  </div>
);

/**
 * Blog Post Card Skeleton - for blog listings
 */
export const BlogPostCardSkeleton: React.FC = () => (
  <div className="glass-card-enhanced rounded-2xl overflow-hidden border border-white/10">
    <Skeleton className="w-full h-48 md:h-56 rounded-none" />
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-full rounded-lg" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <div className="flex items-center justify-between pt-3">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" variant="button" />
      </div>
    </div>
  </div>
);

/**
 * Vet Clinic Card Skeleton - for vet listings
 */
export const VetClinicCardSkeleton: React.FC = () => (
  <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/10 space-y-4">
    <div className="flex items-start gap-4">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-grow space-y-2 min-w-0">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-xl" variant="button" />
  </div>
);

/**
 * Community Alert Skeleton - for alerts/notifications
 */
export const CommunityAlertSkeleton: React.FC = () => (
  <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-3">
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" variant="circular" />
      <div className="flex-grow space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-7 w-20 rounded-lg" variant="button" />
      <Skeleton className="h-7 w-20 rounded-lg" variant="button" />
    </div>
  </div>
);
