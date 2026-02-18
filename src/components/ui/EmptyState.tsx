import React from 'react';
import { useTranslation } from 'react-i18next';
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
            <h3 className={`font-bold text-white ${sizes.title} relative z-10`}>
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className={`text-slate-400 ${sizes.description} mx-auto relative z-10`}>
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
 * Now fully internationalized (i18n)
 */
export const EmptyStates = {
    NoPets: ({ onAction }: { onAction?: () => void }) => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="🐾"
                title={t('emptyState.noPets.title')}
                description={t('emptyState.noPets.description')}
                actionLabel={t('emptyState.noPets.action')}
                onAction={onAction}
            />
        );
    },

    NoResults: ({ query, onClear }: { query?: string; onClear?: () => void }) => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="🔍"
                title={t('emptyState.noResults.title')}
                description={query ? t('emptyState.noResults.descriptionWithQuery', { query }) : t('emptyState.noResults.description')}
                actionLabel={onClear ? t('emptyState.noResults.action') : undefined}
                onAction={onClear}
                actionVariant="secondary"
            />
        );
    },

    NoMessages: () => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="💬"
                title={t('emptyState.noMessages.title')}
                description={t('emptyState.noMessages.description')}
                size="sm"
            />
        );
    },

    NoSightings: () => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="👀"
                title={t('emptyState.noSightings.title')}
                description={t('emptyState.noSightings.description')}
                size="sm"
            />
        );
    },

    NoAppointments: ({ onAction }: { onAction?: () => void }) => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="📅"
                title={t('emptyState.noAppointments.title')}
                description={t('emptyState.noAppointments.description')}
                actionLabel={t('emptyState.noAppointments.action')}
                onAction={onAction}
            />
        );
    },

    Error: ({ onRetry }: { onRetry?: () => void }) => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="⚠️"
                title={t('emptyState.error.title')}
                description={t('emptyState.error.description')}
                actionLabel={t('emptyState.error.action')}
                onAction={onRetry}
                actionVariant="secondary"
            />
        );
    },

    Offline: () => {
        const { t } = useTranslation();
        return (
            <EmptyState
                icon="📡"
                title={t('emptyState.offline.title')}
                description={t('emptyState.offline.description')}
                size="sm"
            />
        );
    },
};

export default EmptyState;
