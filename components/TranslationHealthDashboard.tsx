
import React, { useState, useEffect } from 'react';
import { translationService, I18nHealth } from '../services/translationService';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard, GlassButton } from './ui';
import { LoadingSpinner } from './LoadingSpinner';

export const TranslationHealthDashboard: React.FC = () => {
    const { t } = useTranslations();
    const [health, setHealth] = useState<I18nHealth | null>(null);
    const [isFixing, setIsFixing] = useState<string | null>(null);

    const refresh = () => {
        setHealth(translationService.auditHealth());
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleFix = async (lang: string) => {
        if (!health) return;
        setIsFixing(lang);
        try {
            const missing = health.missingKeys[lang];
            const results = await translationService.fixMissingKeys(lang, missing);
            console.log(`[i18n] Suggestions for ${lang}:`, results);
            alert(`Generated ${Object.keys(results).length} translations. Check console for results (Apply manually or via Script).`);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFixing(null);
        }
    };

    if (!health) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">i18n_Status</h3>
                <GlassButton onClick={refresh} variant="secondary" className="!py-2 text-[10px]">Refresh Audit</GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(health.stats).map(([lang, stats]) => (
                    <GlassCard key={lang} className="p-6 border-white/10 bg-black/40">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl uppercase font-black text-primary">{lang}</span>
                                <div className="h-10 w-px bg-white/10"></div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">Integrity</p>
                                    <p className="text-lg font-mono text-white font-bold">{stats.percent}%</p>
                                </div>
                            </div>
                            {stats.missing > 0 && (
                                <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 text-[8px] font-black uppercase border border-red-500/30">
                                    {stats.missing} Missing
                                </span>
                            )}
                        </div>

                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
                            <div 
                                className="bg-primary h-full transition-all duration-1000 shadow-[0_0_10px_#14b8a6]" 
                                style={{ width: `${stats.percent}%` }}
                            ></div>
                        </div>

                        <div className="space-y-4">
                            {stats.missing > 0 ? (
                                <>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                        Detecting desynchronized keys in {lang} namespace. Recommend immediate AI-assisted patching.
                                    </p>
                                    <GlassButton 
                                        onClick={() => handleFix(lang)} 
                                        variant="primary" 
                                        className="w-full !py-2 text-[10px]"
                                        disabled={!!isFixing}
                                    >
                                        {isFixing === lang ? <LoadingSpinner /> : `Patch ${lang.toUpperCase()} Keys`}
                                    </GlassButton>
                                </>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Synchronized</span>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
