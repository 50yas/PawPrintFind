import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { View } from '../types';

interface NotFoundProps {
    setView: (view: View) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ setView }) => {
    const { t } = useTranslation('common');

    const handleGoHome = () => {
        window.history.replaceState({}, '', '/');
        setView('home');
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 sm:p-12 relative">
            {/* Ambient glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-500/10 blur-[100px] pointer-events-none" />

            <div className="relative w-full max-w-lg animate-fade-in">
                <GlassCard className="p-8 sm:p-12 text-center border-white/5 bg-slate-950/40 relative overflow-hidden">
                    {/* Background grid pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />

                    <div className="relative z-10">
                        {/* Big 404 with overlaid paw emoji */}
                        <div className="mb-6 relative inline-block select-none">
                            <h1 className="text-[7rem] sm:text-[9rem] font-black text-white/[0.06] tracking-tighter leading-none">
                                404
                            </h1>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(20,184,166,0.3)]">🔍🐾</span>
                            </div>
                        </div>

                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-4">
                            {t('notFound.title')}
                        </h2>

                        <p className="text-slate-400 mb-10 leading-relaxed max-w-xs mx-auto text-sm md:text-base">
                            {t('notFound.subtitle')}
                        </p>

                        <GlassButton
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleGoHome}
                        >
                            {t('notFound.cta')}
                        </GlassButton>

                        {/* HUD-style status bar */}
                        <div className="mt-8 flex justify-center gap-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 animate-pulse" />
                                Signal Lost
                            </span>
                            <span className="text-white/10">•</span>
                            <span className="font-mono">ERR::0x404</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
