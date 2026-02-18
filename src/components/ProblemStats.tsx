
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';
import { useCountUp } from '../hooks/useCountUp';

const ProblemCard = memo(({ value, label, sublabel, color, suffix = "" }: { value: number; label: string; sublabel: string; color: 'red' | 'amber'; suffix?: string }) => {
    const count = useCountUp(value, 2500);
    const colorClass = color === 'red' ? 'text-red-500' : 'text-amber-500';
    const borderClass = color === 'red' ? 'border-red-500/30' : 'border-amber-500/30';
    const shadowClass = color === 'red' ? 'shadow-red-500/20' : 'shadow-amber-500/20';
    const glowClass = color === 'red' ? 'bg-red-500/5' : 'bg-amber-500/5';

    return (
        <GlassCard className={`p-6 md:p-8 flex flex-col items-center text-center border ${borderClass} ${glowClass} relative overflow-hidden group`}>
            {/* Pulsing Alert Indicator */}
            <div className="absolute top-4 right-4">
                <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color === 'red' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${color === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                </span>
            </div>

            <div className={`text-4xl md:text-6xl font-black font-mono-tech mb-2 ${colorClass} drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]`}>
                {count}{suffix}
            </div>
            <h4 className="text-white font-bold uppercase tracking-widest text-sm md:text-base mb-2">{label}</h4>
            <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">{sublabel}</p>
            
            {/* HUD Scanning Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10 group-hover:opacity-30 transition-opacity"></div>
        </GlassCard>
    );
});

export const ProblemStats: React.FC = () => {
    const { t } = useTranslations();

    return (
        <section className="relative py-20 md:py-32 overflow-hidden bg-slate-950/50">
            {/* Background Narrative Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444405_1px,transparent_1px),linear-gradient(to_bottom,#ef444405_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                    >
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Critical Global Alert
                    </motion.div>
                    
                    <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
                        Every year, millions of families <span className="text-red-500 italic">lose their connection.</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                        Traditional methods are failing. Lost pet recovery rates haven't changed in decades, despite advances in technology. Until now.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <ProblemCard 
                        value={10} 
                        suffix="M"
                        label="Lost Annually" 
                        sublabel="Ten million pets go missing every single year across the globe." 
                        color="red" 
                    />
                    <ProblemCard 
                        value={1} 
                        suffix=" in 3"
                        label="Missing Probability" 
                        sublabel="A staggering 33% of all pets will disappear at least once in their lifetime." 
                        color="red" 
                    />
                    <ProblemCard 
                        value={90} 
                        suffix="%"
                        label="Identification Gap" 
                        sublabel="Without digital identification, 90% of lost pets are never reunited with their owners." 
                        color="amber" 
                    />
                </div>

                {/* Transition to Solution CTA */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 flex flex-col items-center"
                >
                    <div className="w-px h-24 bg-gradient-to-b from-red-500/50 to-primary/50 animate-pulse"></div>
                    <p className="text-[10px] font-mono-tech text-slate-500 uppercase tracking-[0.5em] mt-4 mb-8">Initiating Recovery Protocols</p>
                    <button 
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative px-10 py-5 bg-primary text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(6,182,212,0.4)]"
                    >
                        See the Solution
                        <div className="absolute inset-0 border-2 border-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </motion.div>
            </div>
        </section>
    );
};
