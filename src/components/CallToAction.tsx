
import React, { memo } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface CallToActionProps {
    onNavigate: (view: any) => void;
}

export const CallToAction: React.FC<CallToActionProps> = memo(({ onNavigate }) => {
    const { t } = useTranslations();

    return (
        <section className="scroll-animation relative z-10 py-16 md:py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent pointer-events-none"></div>
            <div className="absolute top-10 start-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-10 end-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Beta Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-[0.2em] mb-6 animate-fade-in shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400"></span>
                        </span>
                        {t('beta.testingPhase')}
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 animate-fade-in tracking-tighter" style={{ animationDelay: '100ms' }}>
                        {t('beta.title')}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-purple-200 mb-4 font-medium animate-fade-in" style={{ animationDelay: '200ms' }}>
                        {t('beta.subtitle')}
                    </p>

                    {/* Description */}
                    <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '300ms' }}>
                        {t('beta.description')}
                    </p>

                    {/* Timeline Badge */}
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white mb-10 animate-fade-in shadow-xl" style={{ animationDelay: '400ms' }}>
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-mono-tech text-sm font-bold tracking-wider">{t('beta.timeline')}</span>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '500ms' }}>
                        <button
                            onClick={() => onNavigate('register')}
                            className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:scale-105 transition-all border border-white/20"
                        >
                            {t('beta.joinButton')}
                        </button>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            {t('beta.learnMore')}
                        </button>
                    </div>

                    {/* Limited Spots Notice */}
                    <p className="text-sm text-slate-500 mt-6 font-mono-tech animate-fade-in" style={{ animationDelay: '600ms' }}>
                        {t('beta.limitedSpots')}
                    </p>
                </div>
            </div>
        </section>
    );
});
