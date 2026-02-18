import React from 'react';
import { GlassButton } from './GlassButton';

interface EnhancedEmptyStateProps {
    type?: 'pets' | 'sightings' | 'messages' | 'favorites' | 'default';
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: string; // Emoji or image URL
    className?: string;
}

/**
 * Enhanced Empty State Component
 * Professional empty states with illustrations and clear CTAs
 */
export const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
    type = 'default',
    title,
    description,
    actionLabel,
    onAction,
    icon,
    className = '',
}) => {
    // Default configurations for common scenarios
    const defaults = {
        pets: {
            icon: '🐾',
            title: 'No Pets Found',
            description: 'Try adjusting your filters or check back later for new arrivals.',
            actionLabel: 'Clear Filters',
        },
        sightings: {
            icon: '📍',
            title: 'No Sightings Yet',
            description: 'Be the first to report a sighting in your area.',
            actionLabel: 'Report Sighting',
        },
        messages: {
            icon: '💬',
            title: 'No Messages',
            description: 'Your inbox is empty. Start a conversation!',
            actionLabel: 'Browse Pets',
        },
        favorites: {
            icon: '❤️',
            title: 'No Favorites Yet',
            description: 'Save your favorite pets to see them here.',
            actionLabel: 'Explore Pets',
        },
        default: {
            icon: '📭',
            title: 'Nothing Here',
            description: 'There\'s nothing to show right now.',
            actionLabel: 'Go Back',
        },
    };

    const config = defaults[type];
    const displayTitle = title || config.title;
    const displayDescription = description || config.description;
    const displayIcon = icon || config.icon;
    const displayActionLabel = actionLabel || config.actionLabel;

    return (
        <div
            className={`
        flex flex-col items-center justify-center 
        py-16 md:py-24 px-6 text-center
        bg-white/5 backdrop-blur-xl rounded-3xl
        border border-white/10
        animate-fade-in
        ${className}
      `}
            role="status"
            aria-live="polite"
        >
            {/* Icon/Illustration */}
            <div className="mb-6 relative">
                {displayIcon.startsWith('http') ? (
                    <img
                        src={displayIcon}
                        alt=""
                        className="w-32 h-32 md:w-48 md:h-48 opacity-60 animate-bounce-subtle"
                        aria-hidden="true"
                    />
                ) : (
                    <div
                        className="text-6xl md:text-8xl opacity-70 animate-bounce-subtle"
                        aria-hidden="true"
                    >
                        {displayIcon}
                    </div>
                )}

                {/* Decorative glow */}
                <div
                    className="absolute inset-0 bg-primary/20 blur-3xl -z-10 opacity-30"
                    aria-hidden="true"
                />
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                {displayTitle}
            </h3>

            {/* Description */}
            <p className="text-sm md:text-base text-slate-300 max-w-md mb-8 leading-relaxed">
                {displayDescription}
            </p>

            {/* Action Button */}
            {onAction && (
                <GlassButton
                    variant="primary"
                    size="md"
                    onClick={onAction}
                    className="shadow-2xl"
                >
                    {displayActionLabel}
                </GlassButton>
            )}
        </div>
    );
};

export default EnhancedEmptyState;
