import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'interactive';
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
    children, 
    className = '', 
    variant = 'default',
    onClick
}) => {
    const baseStyles = "backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl overflow-hidden";
    const interactiveStyles = variant === 'interactive' 
        ? "hover:scale-[1.02] hover:bg-white/20 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-teal-500/10" 
        : "";

    return (
        <div 
            className={`${baseStyles} ${interactiveStyles} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
