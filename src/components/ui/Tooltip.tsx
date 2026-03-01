
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg shadow-xl whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
                    >
                        {content}
                        <div className={`absolute w-2 h-2 bg-slate-900 border-b border-r border-white/10 rotate-45 ${
                            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' :
                            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' :
                            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2' :
                            'right-full top-1/2 -translate-y-1/2 translate-x-1/2'
                        }`}></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
