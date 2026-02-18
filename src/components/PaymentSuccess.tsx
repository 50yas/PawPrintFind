
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../services/analyticsService';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';

interface PaymentSuccessProps {
    setView: (view: any) => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setView }) => {
    const { t } = useTranslation('common');

    useEffect(() => {
        analyticsService.logEvent('donation_completed', { timestamp: Date.now() });
    }, []);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[150px] pointer-events-none" />

            <GlassCard className="p-8 md:p-12 text-center max-w-xl w-full border-green-500/20 shadow-[0_0_80px_rgba(34,197,94,0.1)] relative z-10 animate-scale-in">
                {/* Hero Icon */}
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative border border-green-500/30 group">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl animate-pulse-soft rounded-full" />
                    <span className="text-5xl relative z-10">🌟</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight">
                    {t('thankYou.title')}
                </h1>

                <p className="text-lg text-slate-300 mb-10 leading-relaxed font-medium">
                    {t('thankYou.message')}
                </p>

                <div className="bg-slate-900/40 p-5 rounded-2xl mb-10 border border-white/5 backdrop-blur-md">
                    <p className="text-xs font-mono font-bold text-primary mb-2 flex items-center justify-center gap-2">
                        <span className="opacity-50">{t('thankYou.transactionId')}:</span>
                        #PAW-{Math.floor(Math.random() * 1000000)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {t('thankYou.receiptNote')}
                    </p>
                </div>

                <GlassButton
                    variant="success"
                    size="lg"
                    fullWidth
                    onClick={() => { window.history.replaceState({}, '', '/'); setView('home'); }}
                    className="shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                    {t('thankYou.homeCta')}
                </GlassButton>

                {/* HUD Footer Decor */}
                <div className="mt-10 pt-6 border-t border-white/5 flex justify-center gap-6 items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest mb-1">Status</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-500 uppercase">Confirmed</span>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
