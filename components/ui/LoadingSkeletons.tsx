import React from 'react';

/**
 * Loading Skeletons - Glassmorphism 2.0 Style
 * Provides professional loading states for data-fetching components
 */

interface SkeletonProps {
    className?: string;
}

/**
 * Base skeleton component with glassmorphic pulse animation
 */
export const SkeletonBlock: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`bg-white/10 rounded-xl animate-pulse ${className}`}
            style={{
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
        />
    );
};

/**
 * Pet Card Skeleton - matches PetCard component layout
 */
export const PetCardSkeleton: React.FC = () => {
    return (
        <div className="glass-card-enhanced rounded-3xl p-6 overflow-hidden">
            {/* Image skeleton */}
            <SkeletonBlock className="h-48 w-full mb-4 rounded-2xl" />

            {/* Title skeleton */}
            <SkeletonBlock className="h-6 w-3/4 mb-3 rounded-lg" />

            {/* Subtitle skeleton */}
            <SkeletonBlock className="h-4 w-1/2 mb-4 rounded-md" />

            {/* Tags skeleton */}
            <div className="flex gap-2 mb-4">
                <SkeletonBlock className="h-6 w-16 rounded-full" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>

            {/* Button skeleton */}
            <SkeletonBlock className="h-10 w-full rounded-xl" />
        </div>
    );
};

/**
 * Dashboard Stats Skeleton - for stats cards
 */
export const StatsCardSkeleton: React.FC = () => {
    return (
        <div className="glass-panel rounded-2xl p-6">
            <SkeletonBlock className="h-4 w-1/3 mb-3 rounded-md" />
            <SkeletonBlock className="h-8 w-1/2 mb-2 rounded-lg" />
            <SkeletonBlock className="h-3 w-2/3 rounded-md" />
        </div>
    );
};

/**
 * List Item Skeleton - for linear lists
 */
export const ListItemSkeleton: React.FC = () => {
    return (
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 mb-3">
            {/* Avatar */}
            <SkeletonBlock className="h-12 w-12 rounded-full flex-shrink-0" />

            {/* Content */}
            <div className="flex-1">
                <SkeletonBlock className="h-4 w-3/4 mb-2 rounded-md" />
                <SkeletonBlock className="h-3 w-1/2 rounded-md" />
            </div>

            {/* Action */}
            <SkeletonBlock className="h-8 w-20 rounded-lg" />
        </div>
    );
};

/**
 * Grid Skeleton - renders multiple skeleton cards in a responsive grid
 */
interface GridSkeletonProps {
    count?: number;
    variant?: 'card' | 'stats' | 'list';
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
    count = 6,
    variant = 'card'
}) => {
    const SkeletonComponent =
        variant === 'card' ? PetCardSkeleton :
            variant === 'stats' ? StatsCardSkeleton :
                ListItemSkeleton;

    const gridClass = variant === 'list'
        ? 'flex flex-col'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

    return (
        <div className={gridClass}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
};

/**
 * Table Row Skeleton - for admin tables
 */
export const TableRowSkeleton: React.FC = () => {
    return (
        <tr className="border-b border-white/10">
            <td className="p-4">
                <SkeletonBlock className="h-4 w-full rounded-md" />
            </td>
            <td className="p-4">
                <SkeletonBlock className="h-4 w-full rounded-md" />
            </td>
            <td className="p-4">
                <SkeletonBlock className="h-4 w-full rounded-md" />
            </td>
            <td className="p-4">
                <SkeletonBlock className="h-8 w-20 rounded-lg" />
            </td>
        </tr>
    );
};

/**
 * Table Skeleton - renders multiple table rows
 */
interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 4
}) => {
    return (
        <table className="w-full">
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                ))}
            </tbody>
        </table>
    );
};

/**
 * Full Page Skeleton - for dashboard layouts
 */
export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 px-4 md:px-6 py-8">
            {/* Header */}
            <div>
                <SkeletonBlock className="h-8 w-64 mb-2 rounded-lg" />
                <SkeletonBlock className="h-4 w-96 rounded-md" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Content Grid */}
            <GridSkeleton count={6} variant="card" />
        </div>
    );
};

export default {
    Block: SkeletonBlock,
    PetCard: PetCardSkeleton,
    StatsCard: StatsCardSkeleton,
    ListItem: ListItemSkeleton,
    Grid: GridSkeleton,
    TableRow: TableRowSkeleton,
    Table: TableSkeleton,
    Dashboard: DashboardSkeleton,
};
