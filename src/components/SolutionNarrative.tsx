
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';
import { GlassCard } from './ui/GlassCard';

const SolutionLink = ({ problem, solution, icon, featureId }: { problem: string; solution: string; icon: string; featureId: string }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group"
        >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                {icon}
            </div>
            <div className="flex-1 text-center md:text-left">
                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">The Problem: {problem}</div>
                <h4 className="text-xl font-bold text-white mb-2">{solution}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Our advanced neural network and distributed community protocols ensure that no signal is ever truly lost.</p>
            </div>
            <button 
                onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 text-[10px] font-black text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-black transition-all uppercase tracking-widest"
            >
                Protocol Details
            </button>
        </motion.div>
    );
};

export const SolutionNarrative: React.FC = () => {
    const { t } = useTranslations();

    return (
        <section id="our-solution" className="relative py-20 md:py-32 bg-slate-900/30 backdrop-blur-3xl border-y border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">The Paw Print <span className="text-primary">Ecosystem</span></h2>
                    <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary via-secondary to-primary mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
                        We don't just find pets. We create a permanent, digital link between families and their companions through a global, AI-powered safety net.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                    <SolutionLink 
                        problem="90% Identification Failure"
                        solution="AI Biometric Fingerprinting"
                        icon="👁️"
                        featureId="ai-matching"
                    />
                    <SolutionLink 
                        problem="1 in 3 Probability"
                        solution="Predictive Smart Geofencing"
                        icon="📍"
                        featureId="geofencing"
                    />
                    <SolutionLink 
                        problem="Delayed Response Times"
                        solution="Real-Time Community Uplink"
                        icon="📡"
                        featureId="realtime"
                    />
                </div>

                {/* Performance HUD Ornament */}
                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    <div className="text-center">
                        <div className="text-2xl font-mono-tech text-white mb-1">60 FPS</div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Neural Render</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-mono-tech text-white mb-1">&lt; 200ms</div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">AI Latency</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-mono-tech text-white mb-1">AES-256</div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Data Encryption</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-mono-tech text-white mb-1">24/7/365</div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Uplink Status</div>
                    </div>
                </div>
            </div>
        </section>
    );
};
