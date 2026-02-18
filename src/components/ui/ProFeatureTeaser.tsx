import React from 'react';

interface ProFeatureTeaserProps {
    title: string;
    desc: string;
    icon: string;
    screenshot?: string;
    onUpgrade?: () => void;
}

export const ProFeatureTeaser: React.FC<ProFeatureTeaserProps> = ({ title, desc, icon, screenshot, onUpgrade }) => {
    return (
        <div className="relative group">
            {/* Glassmorphic Card */}
            <div className="bg-slate-900/50 border-2 border-primary/30 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-lg group-hover:shadow-primary/20">

                {/* Lock Overlay */}
                <div className="absolute top-4 right-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                {/* Icon */}
                <div className="text-5xl mb-4 opacity-70">{icon}</div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 mb-4">{desc}</p>

                {/* Pro Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-primary to-cyan-500 rounded-full text-xs font-bold text-black mb-4">
                    <span>👑</span>
                    <span>PRO ONLY</span>
                </div>

                {/* Screenshot Preview (Blurred) */}
                {screenshot && (
                    <div className="relative mt-4 rounded-lg overflow-hidden">
                        <img
                            src={screenshot}
                            alt={title}
                            className="w-full h-32 object-cover blur-sm grayscale opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    </div>
                )}

                {/* CTA Button */}
                <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-primary to-cyan-500 rounded-xl font-bold text-black transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/50">
                    Upgrade to Pro 🚀
                </button>

                {/* Pulse Animation Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/30 animate-pulse pointer-events-none" />
            </div>
        </div>
    );
};
