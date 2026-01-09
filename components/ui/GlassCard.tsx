import React, { forwardRef } from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'interactive';
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({ 
    children, 
    className = '', 
    variant = 'default',
    onClick,
    style
}, ref) => {
    const baseStyles = "backdrop-blur-xl bg-surface-container-low border border-outline-variant shadow-xl rounded-2xl overflow-hidden text-on-surface outline-none";
    const interactiveStyles = variant === 'interactive' 
        ? "hover:scale-[1.02] hover:bg-surface-container transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" 
        : "";

    return (
        <div 
            ref={ref}
            data-testid="glass-card"
            tabIndex={variant === 'interactive' ? 0 : undefined}
            className={`${baseStyles} ${interactiveStyles} ${className}`}
            onClick={onClick}
            style={style}
            onKeyDown={(e) => {
                if (variant === 'interactive' && onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            {children}
        </div>
    );
});

GlassCard.displayName = 'GlassCard';