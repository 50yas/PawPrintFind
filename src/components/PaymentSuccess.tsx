import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../services/analyticsService';
import { GlassCard } from './ui/GlassCard';

interface PaymentSuccessProps {
    setView: (view: any) => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setView }) => {
    const { t } = useTranslation('common');

    useEffect(() => {
        analyticsService.logEvent('donation_completed', { timestamp: Date.now() });
    }, []);

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-soft" />

            <div className="relative text-center max-w-lg w-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-scale-in">

                {/* Hero Icon */}
                <div className="w-32 h-32 bg-gradient-to-tr from-primary to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(20,184,166,0.3)] mb-8 relative border-4 border-white/5 animate-bounce-slow">
                    <span className="text-6xl relative z-10 drop-shadow-md">🎉</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 uppercase tracking-tight drop-shadow-sm">
                    {t('thankYou.title')}
                </h1>

                <p className="text-lg text-slate-300 mb-10 leading-relaxed font-medium">
                    {t('thankYou.message')}
                </p>

                <div className="w-full bg-black/40 p-5 rounded-2xl mb-10 border border-white/5 shadow-inner">
                    <p className="text-xs font-mono font-bold text-primary mb-2 flex items-center justify-center gap-2">
                        <span className="opacity-50 text-slate-400">{t('thankYou.transactionId')}:</span>
                        #PAW-{Math.floor(Math.random() * 1000000)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {t('thankYou.receiptNote')}
                    </p>
                </div>

                <button
                    onClick={() => { window.history.replaceState({}, '', '/'); setView('home'); }}
                    className="w-full bg-gradient-to-r from-primary to-teal-500 text-slate-900 font-black tracking-widest uppercase rounded-2xl py-5 text-lg shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                    {t('thankYou.homeCta')}
                </button>

                {/* HUD Footer Decor */}
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-center w-full">
                    <div className="flex flex-col items-center bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest mb-1.5">Network Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-wider">Payment Confirmed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
