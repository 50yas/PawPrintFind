import React, { forwardRef } from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'interactive';
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
    style?: React.CSSProperties;
}


export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
    children,
    className = '',
    variant = 'default',
    onClick,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    style
}, ref) => {
    const baseStyles = "backdrop-blur-xl bg-white/5 border border-white/20 shadow-2xl rounded-2xl overflow-hidden text-white outline-none ring-1 ring-white/5";
    const interactiveStyles = variant === 'interactive'
        ? "hover:scale-[1.02] hover:bg-surface-container transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        : "";

    return (
        <div
            ref={ref}
            data-testid="glass-card"
            role={variant === 'interactive' ? 'button' : undefined}
            tabIndex={variant === 'interactive' ? 0 : undefined}
            aria-pressed={variant === 'interactive' ? 'false' : undefined}
            className={`${baseStyles} ${interactiveStyles} ${className}`}
            onClick={onClick}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            style={style}
            onKeyDown={(e) => {
                if (variant === 'interactive' && onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
            }}
        >
            {children}
        </div>
    );
});

GlassCard.displayName = 'GlassCard';