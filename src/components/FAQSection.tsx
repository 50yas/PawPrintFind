
import React, { memo } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface FAQSectionProps {
    onNavigate: (view: any) => void;
}

export const FAQSection: React.FC<FAQSectionProps> = memo(({ onNavigate }) => {
    const { t } = useTranslations();

    return (
        <section className="scroll-animation relative z-10 py-16 md:py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">
                        {t('faq.title')}
                    </h2>
                    <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary via-secondary to-primary mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
                        {t('faq.subtitle')}
                    </p>
                </div>

                {/* FAQ Grid */}
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                    {/* Q1 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-cyan-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-cyan-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">❓</span>
                            {t('faq.q1.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q1.answer')}
                        </p>
                    </div>

                    {/* Q2 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-emerald-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">💰</span>
                            {t('faq.q2.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q2.answer')}
                        </p>
                    </div>

                    {/* Q3 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-purple-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-purple-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">⏰</span>
                            {t('faq.q3.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q3.answer')}
                        </p>
                    </div>

                    {/* Q4 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-amber-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-amber-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">🔒</span>
                            {t('faq.q4.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q4.answer')}
                        </p>
                    </div>

                    {/* Q5 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-pink-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-pink-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">👥</span>
                            {t('faq.q5.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q5.answer')}
                        </p>
                    </div>

                    {/* Q6 */}
                    <div className="glass-card-enhanced p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl hover:border-red-500/30 transition-all">
                        <h3 className="text-lg md:text-xl font-black text-red-400 mb-3 flex items-start gap-3">
                            <span className="text-2xl">🐛</span>
                            {t('faq.q6.question')}
                        </h3>
                        <p className="text-slate-400 leading-relaxed ps-10">
                            {t('faq.q6.answer')}
                        </p>
                    </div>
                </div>

                {/* CTA at bottom of FAQ */}
                <div className="text-center mt-12 md:mt-16">
                    <button
                        onClick={() => onNavigate('register')}
                        className="btn bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:scale-105 transition-all border border-white/20"
                    >
                        {t('beta.joinButton')}
                    </button>
                </div>
            </div>
        </section>
    );
});
