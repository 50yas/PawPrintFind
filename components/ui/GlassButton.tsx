import React, { forwardRef } from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(({ 
    children, 
    className = '', 
    variant = 'primary', 
    isLoading = false,
    icon,
    disabled,
    ...props 
}, ref) => {
    const baseStyles = "relative overflow-hidden backdrop-blur-md px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
    
    const variants = {
        primary: "bg-primary text-on-primary shadow-lg shadow-primary/20 border border-primary/30 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
        secondary: "bg-secondary-container text-on-secondary-container border border-secondary/20 hover:bg-secondary-container/90",
        danger: "bg-error text-on-error shadow-lg shadow-error/20 border border-error/30 hover:bg-error/90 hover:shadow-xl hover:shadow-error/30",
        ghost: "hover:bg-surface-container-highest/80 text-on-surface hover:text-primary focus-visible:bg-surface-container-highest/80"
    };

    return (
        <button 
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    {icon && <span className="text-lg">{icon}</span>}
                    {children}
                </>
            )}
            
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </button>
    );
});

GlassButton.displayName = 'GlassButton';