
import React, { memo, lazy, Suspense } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';
import { CardSkeleton } from './ui/SkeletonLoader';

const SupportCard = lazy(() => import('./SupportCard').then(m => ({ default: m.SupportCard })));

export const SupportSection = memo(() => {
    const { t } = useTranslations();

    return (
        <section id="support-us" className="scroll-animation container mx-auto px-6 py-12 md:py-32 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-stretch">
                <GlassCard className="p-8 md:p-10 flex flex-col justify-between h-full border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl">
                    <div className="space-y-4 md:space-y-6">
                        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">{t('openSourceTitle')}</h2>
                        <p className="text-slate-300 leading-relaxed text-base md:text-lg font-medium">{t('openSourceDesc')}</p>
                    </div>
                    <div className="pt-8 md:pt-10">
                        <a
                            href="https://github.com/50yas"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-4 px-8 py-4 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl text-white bg-slate-800 hover:bg-slate-700 transition-all border border-white/10 shadow-xl hover:-translate-y-1 w-full sm:w-auto justify-center"
                            aria-label="Visit Paw Print GitHub Repository"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-4.51-2-7-2"></path></svg>
                            <span>{t('githubRepo')}</span>
                        </a>
                    </div>
                </GlassCard>
                <Suspense fallback={<CardSkeleton />}>
                    <SupportCard />
                </Suspense>
            </div>
        </section>
    );
});
