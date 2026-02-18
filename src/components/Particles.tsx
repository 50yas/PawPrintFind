
import React, { memo } from 'react';

export const Particles: React.FC = memo(() => (
    <div id="particle-container" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
            const size = Math.random() * 4 + 2;
            const style = {
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 15}s`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5
            };
            return <div key={i} className="particle absolute bg-white/30 rounded-full" style={style}></div>;
        })}
    </div>
));
