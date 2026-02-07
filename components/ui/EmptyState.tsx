import React from 'react';
import { GlassButton } from './GlassButton';

interface EmptyStateProps {
    /** Icon or emoji to display */
    icon?: React.ReactNode;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** Action button text */
    actionLabel?: string;
    /** Action button handler */
    onAction?: () => void;
    /** Action button variant */
    actionVariant?: 'primary' | 'secondary' | 'ghost';
    /** Additional className */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState component for displaying empty content areas
 * with optional call-to-action button
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    actionVariant = 'primary',
    className = '',
    size = 'md',
}) => {
    const sizeClasses = {
        sm: {
            container: 'py-8 md:py-12',
            icon: 'text-4xl md:text-5xl mb-3',
            title: 'text-lg md:text-xl mb-1',
            description: 'text-sm max-w-xs',
            button: 'mt-4'
        },
        md: {
            container: 'py-12 md:py-16',
            icon: 'text-5xl md:text-6xl mb-4',
            title: 'text-xl md:text-2xl mb-2',
            description: 'text-base max-w-sm',
            button: 'mt-6'
        },
        lg: {
            container: 'py-16 md:py-24',
            icon: 'text-6xl md:text-7xl mb-5',
            title: 'text-2xl md:text-3xl mb-3',
            description: 'text-lg max-w-md',
            button: 'mt-8'
        }
    };

    const sizes = sizeClasses[size];

    return (
        <div
            className={`flex flex-col items-center justify-center text-center px-4 ${sizes.container} ${className}`}
            role="status"
            aria-label={title}
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            {/* Icon */}
            {icon && (
                <div
                    className={`${sizes.icon} animate-bounce-subtle relative z-10`}
                    aria-hidden="true"
                >
                    {icon}
                </div>
            )}

            {/* Title */}
            <h3 className={`font-bold text-foreground ${sizes.title} relative z-10`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className={`text-muted-foreground ${sizes.description} mx-auto relative z-10`}>
                    {description}
                </p>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <div className={`${sizes.button} relative z-10`}>
                    <GlassButton
                        variant={actionVariant}
                        onClick={onAction}
                        size={size === 'lg' ? 'lg' : 'md'}
                    >
                        {actionLabel}
                    </GlassButton>
                </div>
            )}
        </div>
    );
};

/**
 * Preset empty states for common scenarios
 */
export const EmptyStates = {
    NoPets: ({ onAction }: { onAction?: () => void }) => (
        <EmptyState
            icon="🐾"
            title="No Pets Yet"
            description="Start by registering your first pet to unlock all features and keep them safe."
            actionLabel="Register Pet"
            onAction={onAction}
        />
    ),

    NoResults: ({ query, onClear }: { query?: string; onClear?: () => void }) => (
        <EmptyState
            icon="🔍"
            title="No Results Found"
            description={query ? `No matches found for "${query}". Try adjusting your search.` : "Try adjusting your filters or search terms."}
            actionLabel={onClear ? "Clear Filters" : undefined}
            onAction={onClear}
            actionVariant="secondary"
        />
    ),

    NoMessages: () => (
        <EmptyState
            icon="💬"
            title="No Messages"
            description="When you receive messages or notifications, they'll appear here."
            size="sm"
        />
    ),

    NoSightings: () => (
        <EmptyState
            icon="👀"
            title="No Sightings Yet"
            description="Sightings from the community will appear here when someone spots your pet."
            size="sm"
        />
    ),

    NoAppointments: ({ onAction }: { onAction?: () => void }) => (
        <EmptyState
            icon="📅"
            title="No Upcoming Appointments"
            description="Schedule a vet visit to keep your pet healthy and happy."
            actionLabel="Book Appointment"
            onAction={onAction}
        />
    ),

    Error: ({ onRetry }: { onRetry?: () => void }) => (
        <EmptyState
            icon="⚠️"
            title="Something Went Wrong"
            description="We couldn't load this content. Please try again."
            actionLabel="Retry"
            onAction={onRetry}
            actionVariant="secondary"
        />
    ),

    Offline: () => (
        <EmptyState
            icon="📡"
            title="You're Offline"
            description="Please check your internet connection and try again."
            size="sm"
        />
    ),
};

export default EmptyState;
