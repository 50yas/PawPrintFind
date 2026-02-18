
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { DonationModal } from './DonationModal';
import { CinematicImage } from './ui/CinematicImage';

export const SupportCard: React.FC = () => {
    const { t } = useTranslations();
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

    // Mock progress for "Server Goal" to encourage donations
    const progress = 78;

    return (
        <>
            <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center h-full relative overflow-hidden hover-lift border border-white/10 group scan-hover hud-grid-bg">
                {/* Ambient Background Effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>

                <div className="relative z-10 flex flex-col items-center w-full h-full">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary to-secondary mb-6 shadow-lg shadow-primary/20 neon-glow-teal">
                        <CinematicImage
                            src="https://firebasestorage.googleapis.com/v0/b/pawprint-50.firebasestorage.app/o/uploads%2Fassets%2F50.jpg?alt=media"
                            alt={t('supportImageAlt')}
                            className="w-full h-full rounded-full"
                        />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground font-mono-tech">{t('supportUsTitle')}</h3>
                    <p className="mt-3 text-muted-foreground text-sm text-center leading-relaxed mb-6">
                        {t('supportUsDesc')}
                    </p>

                    {/* Server Goal Widget */}
                    <div className="w-full bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                            <span className="text-muted-foreground">{t('monthlyServerGoal')}</span>
                            <span className="text-primary">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            {t('serverGoalDesc')}
                        </p>
                    </div>

                    <div className="mt-auto w-full">
                        <button
                            onClick={() => setIsDonationModalOpen(true)}
                            className="w-full relative overflow-hidden group/btn px-4 py-4 font-bold rounded-xl text-white bg-gradient-to-r from-primary to-teal-600 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                <span>{t('donateWithBitcoin')} / {t('paymentMethodCard')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
