import React from 'react';

export const CinematicLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* Background elements for cinematic feel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-50" />
            <div className="bg-scanlines" />
            
            <div className="relative animate-lens-zoom flex flex-col items-center">
                <div className="flex items-baseline gap-1 text-5xl md:text-7xl font-bold tracking-tighter">
                    <span className="text-white">Paw</span>
                    <span className="text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">Print</span>
                </div>
                
                <div className="mt-4 h-[2px] w-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-teal-400 to-transparent" style={{ animation: 'grow 1.5s ease-out forwards' }} />
                
                <p className="mt-6 text-slate-400 font-mono-tech text-xs uppercase tracking-[0.3em] opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
                    Initializing AI Biometric Protection
                </p>
            </div>

            <style>{`
                @keyframes grow {
                    from { width: 0; }
                    to { width: 200px; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
