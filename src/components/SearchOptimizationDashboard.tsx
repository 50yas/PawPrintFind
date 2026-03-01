import React, { useState, useEffect } from 'react';
import { optimizationService } from '../services/optimizationService';
import { OptimizationTrial, SearchConfig } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard, GlassButton } from './ui';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchOptimizationDashboard: React.FC = () => {
    const { t } = useTranslations();
    const [trials, setTrials] = useState<OptimizationTrial[]>([]);
    const [config, setConfig] = useState<SearchConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'trials' | 'controls'>('overview');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [trialsData, configData] = await Promise.all([
                optimizationService.getAllTrials(20),
                optimizationService.getSearchConfig()
            ]);
            setTrials(trialsData);
            setConfig(configData);
        } catch (error) {
            console.error("Failed to fetch optimization data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReset = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = async () => {
        setShowResetConfirm(false);
        await optimizationService.setSearchConfig({
            breedMatchWeight: 0.5,
            locationWeight: 0.3,
            ageWeight: 0.2,
            isAutoOptimized: false
        });
        fetchData();
    };

    const handleManualOverride = async (params: Partial<SearchConfig>) => {
        await optimizationService.setSearchConfig({
            ...params,
            isAutoOptimized: false
        });
        fetchData();
    };

    const TrialChart: React.FC<{ data: OptimizationTrial[] }> = ({ data }) => {
        if (data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500 italic">No trials recorded yet</div>;

        const maxScore = Math.max(...data.map(t => t.score), 1);
        const points = data.slice().reverse().map((t, i) => ({
            x: (i / (data.length - 1)) * 100,
            y: 100 - (t.score / maxScore) * 100
        }));

        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
            <div className="relative h-48 w-full bg-slate-950/50 rounded-xl border border-white/5 p-4 overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <path d={pathData} fill="none" stroke="var(--color-primary)" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(0,210,255,0.5)]" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--color-primary)" />
                    ))}
                </svg>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-primary uppercase">Convergence Trend</div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                        Search <span className="text-primary">Optimization</span> HUD
                    </h2>
                    <p className="text-slate-400 text-sm font-mono uppercase tracking-widest mt-1">Autonomous Hyperparameter Tuning Engine</p>
                </div>
                <div className="flex gap-2">
                    {(['overview', 'trials', 'controls'] as const).map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-black' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-96 flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="text-primary font-mono text-[10px] animate-pulse">SYNCHRONIZING NEURAL WEIGHTS...</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Current Config */}
                        <GlassCard className="md:col-span-1 p-6 space-y-6">
                            <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Active Configuration</h3>
                            {config ? (
                                <div className="space-y-4 font-mono">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">STATUS</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.isAutoOptimized ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {config.isAutoOptimized ? 'AUTO-OPTIMIZED' : 'MANUAL OVERRIDE'}
                                        </span>
                                    </div>
                                    {[
                                        { label: 'BREED WEIGHT', value: config.breedMatchWeight },
                                        { label: 'LOCATION WEIGHT', value: config.locationWeight },
                                        { label: 'AGE WEIGHT', value: config.ageWeight }
                                    ].map(param => (
                                        <div key={param.label} className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span>{param.label}</span>
                                                <span className="text-primary">{(param.value * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${param.value * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-4 text-[8px] text-slate-500">
                                        LAST UPDATED: {new Date(config.lastUpdated).toLocaleString()}
                                    </div>
                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Neural Impact Analysis</h4>
                                        <div className="flex gap-2 h-20 items-end">
                                            {[
                                                { label: 'BRD', val: config.breedMatchWeight * 100 },
                                                { label: 'LOC', val: config.locationWeight * 100 },
                                                { label: 'AGE', val: config.ageWeight * 100 }
                                            ].map((d, i) => (
                                                <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative group overflow-hidden border border-white/5">
                                                    <div className="w-full bg-primary/30 absolute bottom-0 transition-all duration-1000" style={{ height: `${d.val}%` }}></div>
                                                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">{d.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[8px] text-slate-500 italic">Relative influence of biometric parameters on match scoring.</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-slate-500 italic text-center py-10">No active configuration found. Defaults in use.</p>
                            )}
                        </GlassCard>

                        {/* Convergence Graph */}
                        <GlassCard className="md:col-span-2 p-6 space-y-4">
                            <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Optimization History</h3>
                            <TrialChart data={trials} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-mono">TOTAL TRIALS</p>
                                    <p className="text-xl font-black text-white">{trials.length}</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-mono">AVG SCORE</p>
                                    <p className="text-xl font-black text-white">
                                        {(trials.reduce((acc, t) => acc + t.score, 0) / (trials.length || 1)).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-mono">BEST SCORE</p>
                                    <p className="text-xl font-black text-green-400">
                                        {Math.max(...trials.map(t => t.score), 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-[8px] text-slate-500 font-mono">SAMPLING STRATEGY</p>
                                    <p className="text-xl font-black text-primary uppercase tracking-tighter">TPE</p>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Trials Table */}
                        {activeTab === 'trials' && (
                            <GlassCard className="md:col-span-3 p-6">
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-4 mb-4">Trial Registry</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-mono text-[10px]">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-white/5">
                                                <th className="pb-2">TRIAL ID</th>
                                                <th className="pb-2 text-center">BREED</th>
                                                <th className="pb-2 text-center">LOC</th>
                                                <th className="pb-2 text-center">AGE</th>
                                                <th className="pb-2 text-right">SCORE</th>
                                                <th className="pb-2 text-right">TIME</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {trials.map(trial => (
                                                <tr key={trial.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 text-slate-400 truncate max-w-[100px]">{trial.id}</td>
                                                    <td className="py-3 text-center">{trial.params.breedMatchWeight.toFixed(2)}</td>
                                                    <td className="py-3 text-center">{trial.params.locationWeight.toFixed(2)}</td>
                                                    <td className="py-3 text-center">{trial.params.ageWeight.toFixed(2)}</td>
                                                    <td className="py-3 text-right font-black text-primary">{trial.score.toFixed(2)}</td>
                                                    <td className="py-3 text-right text-slate-500">{new Date(trial.timestamp).toLocaleTimeString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        )}

                        {/* Manual Controls */}
                        {activeTab === 'controls' && (
                            <GlassCard className="md:col-span-3 p-6 space-y-6">
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-primary/20 pb-2">Administrative Overrides</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] text-slate-400 italic">Caution: Manual overrides will disable autonomous sampling until the next optimization cycle or manual reset.</p>
                                        <div className="flex gap-4">
                                            <GlassButton onClick={() => handleManualOverride({ breedMatchWeight: 0.8, locationWeight: 0.1, ageWeight: 0.1 })} variant="secondary" className="text-[8px] flex-1">PRECISION MODE</GlassButton>
                                            <GlassButton onClick={() => handleManualOverride({ breedMatchWeight: 0.3, locationWeight: 0.6, ageWeight: 0.1 })} variant="secondary" className="text-[8px] flex-1">LOCAL MODE</GlassButton>
                                            <GlassButton onClick={() => handleManualOverride({ breedMatchWeight: 0.33, locationWeight: 0.33, ageWeight: 0.33 })} variant="secondary" className="text-[8px] flex-1">BALANCED</GlassButton>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center items-end border-l border-white/5 pl-8">
                                        <GlassButton onClick={handleReset} variant="primary" className="bg-red-500 text-white border-red-500/50 hover:bg-red-600 w-full mb-2">RESET OPTIMIZER</GlassButton>
                                        <p className="text-[8px] text-slate-500">EMERGENCY KILL SWITCH: REVERTS TO GLOBAL DEFAULTS</p>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inline reset confirmation — replaces native window.confirm() */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowResetConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-white font-bold text-center mb-1">Reset Search Optimizer?</p>
                            <p className="text-slate-400 text-xs text-center mb-5">All trial data will be ignored for future sampling. This cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                                <button onClick={confirmReset} className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-bold transition-colors text-sm">Reset</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
