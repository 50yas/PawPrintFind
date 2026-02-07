import React, { forwardRef, useState, useCallback } from 'react';
import { triggerHaptic } from '../../hooks/useHaptic';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    haptic?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    haptic = true,
    disabled,
    onClick,
    ...props
}, ref) => {
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || isLoading) return;

        // Trigger haptic feedback on mobile
        if (haptic) {
            triggerHaptic('light');
        }

        // Create ripple effect
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRipple({ x, y });
        setTimeout(() => setRipple(null), 600);

        // Call original onClick
        onClick?.(e);
    }, [disabled, isLoading, haptic, onClick]);

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
        md: 'px-4 py-2.5 md:px-6 md:py-3 text-sm gap-2 rounded-xl',
        lg: 'px-6 py-3 md:px-8 md:py-4 text-base gap-3 rounded-2xl'
    };

    const baseStyles = `
        relative overflow-hidden backdrop-blur-xl font-bold tracking-wide
        transition-all duration-300 ease-out
        active:scale-[0.98] active:brightness-95
        flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none
        outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
        touch-manipulation select-none
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
    `.replace(/\s+/g, ' ').trim();

    const variants = {
        primary: `
            bg-primary/90 text-on-primary 
            shadow-[0_8px_32px_rgba(var(--primary-rgb),0.3)]
            border border-white/20
            hover:bg-primary hover:shadow-[0_8px_32px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-0.5
            focus-visible:ring-primary/50
        `,
        secondary: `
            bg-surface-container-high/60 text-on-surface 
            border border-white/10
            shadow-[0_8px_32px_rgba(0,0,0,0.1)]
            hover:bg-surface-container-highest/80 hover:border-white/20 hover:-translate-y-0.5
            focus-visible:ring-secondary
        `,
        danger: `
            bg-error/90 text-on-error 
            shadow-[0_8px_32px_rgba(var(--error-rgb),0.3)]
            border border-white/20
            hover:bg-error hover:shadow-[0_8px_32px_rgba(var(--error-rgb),0.4)] hover:-translate-y-0.5
            focus-visible:ring-error/50
        `,
        success: `
            bg-green-600/90 text-white 
            shadow-[0_8px_32px_rgba(22,163,74,0.3)]
            border border-white/20
            hover:bg-green-600 hover:shadow-[0_8px_32px_rgba(22,163,74,0.4)] hover:-translate-y-0.5
            focus-visible:ring-green-500/50
        `,
        ghost: `
            bg-transparent text-on-surface 
            hover:bg-white/10 hover:text-primary hover:backdrop-blur-lg
            focus-visible:bg-white/10 focus-visible:ring-primary
        `
    };

    const LoadingSpinner = () => (
        <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${variants[variant].replace(/\s+/g, ' ').trim()} ${className}`}
            disabled={disabled || isLoading}
            onClick={handleClick}
            {...props}
        >
            {/* Ripple effect */}
            {ripple && (
                <span
                    className="absolute rounded-full bg-white/30 animate-[ripple_0.6s_ease-out]"
                    style={{
                        left: ripple.x - 50,
                        top: ripple.y - 50,
                        width: 100,
                        height: 100,
                    }}
                />
            )}

            {isLoading ? (
                <>
                    <LoadingSpinner />
                    <span className="opacity-80">Loading...</span>
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <span className="text-[1.1em] flex-shrink-0">{icon}</span>
                    )}
                    {children && <span>{children}</span>}
                    {icon && iconPosition === 'right' && (
                        <span className="text-[1.1em] flex-shrink-0">{icon}</span>
                    )}
                </>
            )}

            {/* Shimmer effect overlay on hover */}
            <div
                className="absolute inset-0 -translate-x-full hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
            />
        </button>
    );
});

GlassButton.displayName = 'GlassButton';