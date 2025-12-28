import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
    children, 
    className = '', 
    variant = 'primary', 
    isLoading = false,
    icon,
    disabled,
    ...props 
}) => {
    const baseStyles = "relative overflow-hidden backdrop-blur-md px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-teal-500/80 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20 border border-teal-400/30",
        secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40",
        danger: "bg-red-500/80 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 border border-red-400/30",
        ghost: "hover:bg-white/10 text-slate-200 hover:text-white"
    };

    return (
        <button 
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
};
