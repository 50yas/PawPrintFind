import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';

import { Tooltip } from './ui/Tooltip';

const FeatureCard = memo(({ icon, title, description, color, delay, tooltip }: { icon: string; title: string; description: string; color: string; delay: number; tooltip?: string }) => {
    const card = (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-${color}-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-${color}-500/40 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] min-h-[280px] flex flex-col justify-center`}
        >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">{icon}</div>
            <h3 className={`text-xl md:text-2xl font-black text-white mb-3 group-hover:text-${color}-400 transition-colors`}>
                {title}
            </h3>
            <p className="text-slate-400 leading-relaxed">
                {description}
            </p>
        </motion.div>
    );

    if (tooltip) {
        return <Tooltip content={tooltip}>{card}</Tooltip>;
    }

    return card;
});

export const FeaturesGrid = memo(() => {
    const { t } = useTranslations();

    const features = [
        { 
            icon: "🤖", 
            title: t('features.aiMatching.title'), 
            description: t('features.aiMatching.description'), 
            color: "cyan",
            tooltip: "Gemini 2.0 Pro Multi-modal Analysis"
        },
        { 
            icon: "⚡", 
            title: t('features.realtime.title'), 
            description: t('features.realtime.description'), 
            color: "amber",
            tooltip: "Hyper-local Push Notification Protocol"
        },
        { 
            icon: "🤝", 
            title: t('features.community.title'), 
            description: t('features.community.description'), 
            color: "purple",
            tooltip: "Verified Global Search Network"
        },
        { 
            icon: "🏥", 
            title: t('features.vetNetwork.title'), 
            description: t('features.vetNetwork.description'), 
            color: "emerald",
            tooltip: "Direct API Access for Registered Clinics"
        },
        { 
            icon: "🔐", 
            title: t('features.blockchain.title'), 
            description: t('features.blockchain.description'), 
            color: "blue",
            tooltip: "Encrypted Biometric Data Storage"
        },
        { 
            icon: "📍", 
            title: t('features.geoFencing.title'), 
            description: t('features.geoFencing.description'), 
            color: "pink",
            tooltip: "Predictive Safe-Zone Monitoring"
        },
    ];

    return (
        <section id="features" className="relative z-10 py-16 md:py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16 md:mb-20">
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter"
                    >
                        {t('features.title')}
                    </motion.h2>
                    <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "6rem" }}
                        viewport={{ once: true }}
                        className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                    ></motion.div>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium"
                    >
                        {t('features.subtitle')}
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((f, i) => (
                        <FeatureCard key={i} {...f} delay={i * 0.1} />
                    ))}
                </div>
            </div>
        </section>
    );
});
