
import React, { memo, useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage } from './ui/CinematicImage';
import { PetProfile } from '../types';
import { optimizeUnsplashUrl, generateSrcSet, generateSizes } from '../utils/imageOptimizer';

const HeroHUD = memo(() => {
    const { t } = useTranslations();
    const [bootStep, setBootStep] = useState(0);
    const lines = [
        "INITIALIZING CORE...",
        "SYNC SATELLITE UPLINK...",
        "NEURAL NET LOADED",
        "ENCRYPTION ACTIVE",
        "SYSTEM READY V2.5"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setBootStep(prev => (prev < lines.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Top Left System Status - Terminal Animation - HIDDEN ON MOBILE TO REDUCE CHAOS */}
            <div className="hidden md:block absolute bottom-8 start-12 p-4 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md text-[10px] font-mono-tech text-cyan-400 min-w-[180px] shadow-2xl z-20">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
                    <span className="text-white font-bold tracking-widest uppercase">{t('consoleOutput')}</span>
                </div>
                <div className="space-y-1.5 opacity-90">
                    {lines.slice(0, bootStep + 1).map((line, i) => (
                        <div key={i} className={`${i === bootStep ? 'animate-typewriter overflow-hidden whitespace-nowrap' : ''}`}>
                            <span className="text-cyan-600 me-1">&gt;</span>
                            <span className={i === lines.length - 1 ? 'text-emerald-400 font-bold' : ''}>
                                {line}
                            </span>
                            {i === bootStep && <span className="inline-block w-1 h-2.5 md:w-1.5 md:h-3 bg-cyan-400 ms-1 animate-blink"></span>}
                        </div>
                    ))}
                </div>

                {bootStep === lines.length - 1 && (
                    <div className="mt-2 md:mt-3 pt-2 border-t border-white/5 animate-fade-in hidden xs:block">
                        <div className="flex justify-between items-center text-[7px] md:text-[8px] text-cyan-500/50">
                            <span>{t('uplinkStable')}</span>
                            <span>{t('systemNode')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute top-1/2 -start-12 w-24 h-[1px] bg-cyan-500/10 rotate-90 hidden lg:block"></div>
            <div className="absolute bottom-40 end-12 w-24 h-24 border-b border-e border-purple-500/10 rounded-be-3xl hidden lg:block"></div>
        </div>
    );
});

type ScanPhase = 'scanning' | 'analyzing' | 'match' | 'transition';

const HeroScanner = memo(({ lostPets, onViewPet }: { lostPets: PetProfile[], onViewPet?: (pet: PetProfile) => void }) => {
    const { t } = useTranslations();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<ScanPhase>('scanning');
    const timerRef = useRef<number>(0);

    // Filter pets that actually have photos
    const scanPool = lostPets.filter(p => p.photos?.[0]?.url).length > 0
        ? lostPets.filter(p => p.photos?.[0]?.url)
        : lostPets.length > 0 ? lostPets : [];

    useEffect(() => {
        if (scanPool.length === 0) return;
        let isMounted = true;
        const runSequence = async () => {
            const sequence: { phase: ScanPhase, duration: number }[] = [
                { phase: 'scanning', duration: 2500 },
                { phase: 'analyzing', duration: 1500 },
                { phase: 'match', duration: 2000 },
                { phase: 'transition', duration: 800 },
            ];

            for (const step of sequence) {
                if (!isMounted) return;
                setPhase(step.phase);
                await new Promise(resolve => {
                    timerRef.current = window.setTimeout(resolve, step.duration);
                });
            }

            if (isMounted) {
                setCurrentIndex(prev => (prev + 1) % scanPool.length);
            }
        };
        runSequence();
        return () => { isMounted = false; window.clearTimeout(timerRef.current); };
    }, [currentIndex, scanPool.length]);

    if (scanPool.length === 0) return null;
    const pet = scanPool[currentIndex];
    const isTransitioning = phase === 'transition';

    // Optimize image URLs
    const fallbackUrl = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80";
    const imageUrl = pet.photos[0]?.url || fallbackUrl;
    const optimizedUrl = optimizeUnsplashUrl(imageUrl, { width: 600, quality: 80 });
    const srcSet = generateSrcSet(imageUrl, [300, 600, 900]);
    const sizes = generateSizes('600px');

    return (
        <div
            className="relative w-full max-w-xs md:max-w-sm aspect-square mx-auto lg:mx-0 z-20 cursor-pointer active:scale-95 transition-transform"
            onPointerDown={() => onViewPet?.(pet)}
        >
            <div className={`relative w-full h-full rounded-[2rem] overflow-hidden bg-slate-900 border-[4px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <CinematicImage
                    src={optimizedUrl}
                    srcset={srcSet}
                    sizes={sizes}
                    alt={pet.name}
                    className="w-full h-full object-cover filter brightness-90 grayscale-[0.1]"
                    priority={currentIndex === 0}
                />

                <div className="absolute top-4 start-4 z-20">
                    <div className={`px-2 py-1 text-[8px] md:text-[9px] font-mono-tech rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-cyan-400 tracking-[0.2em] shadow-lg ${phase === 'scanning' ? 'animate-pulse' : ''}`}>
                        {t(phase === 'scanning' ? 'scanning' : phase === 'analyzing' ? 'analyzing' : 'identified')}
                    </div>
                </div>

                {phase === 'scanning' && (
                    <div className="absolute inset-0 z-30 pointer-events-none">
                        <div className="w-full h-1 bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-scan-laser absolute top-0"></div>
                        <div className="absolute inset-0 border-[1px] border-cyan-500/10 m-4 rounded-xl"></div>
                    </div>
                )}

                {phase === 'match' && (
                    <div className="absolute inset-0 z-40 bg-cyan-500/10 backdrop-blur-[2px] animate-fade-in flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-cyan-500 text-white px-4 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-tighter mb-2 animate-pop-in shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                            {t('visualIdLocked')}
                        </div>
                        <div className="text-white font-mono-tech text-xs md:text-sm font-bold bg-black/70 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-xl shadow-xl">
                            {pet.breed}
                        </div>
                    </div>
                )}

                <div className="absolute top-0 start-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-s-2 border-cyan-500/40 m-3 rounded-ts-xl pointer-events-none"></div>
                <div className="absolute bottom-0 end-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-e-2 border-cyan-500/40 m-3 rounded-be-xl pointer-events-none"></div>
            </div>
        </div>
    );
});

interface HeroSectionProps {
    lostPets: PetProfile[];
    onViewPet?: (pet: PetProfile) => void;
    onNavigate: (view: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = memo(({ lostPets, onViewPet, onNavigate }) => {
    const { t } = useTranslations();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900 pointer-events-none"></div>

            <HeroHUD />

            <div className="container mx-auto px-6 lg:px-16 relative z-10">
                <motion.div 
                    className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >

                    {/* Hero Text Content */}
                    <div className="lg:col-span-7 text-center lg:text-start relative">

                        {/* Beta Badge - Top Left Desktop */}
                        <motion.div 
                            variants={itemVariants}
                            className="hidden lg:inline-flex absolute start-0 -top-20 items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            {t('beta.badge')} - {t('beta.earlyAccess')}
                        </motion.div>

                        {/* Desktop Status Badge - High Right */}
                        <motion.div 
                            variants={itemVariants}
                            className="hidden lg:inline-flex absolute end-0 -top-20 items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        >
                            <span className="relative flex h-2 w-2 me-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            {t('coreSystemActive')}: {t('aiPoweredProtection')}
                        </motion.div>

                        <motion.h1 
                            variants={itemVariants}
                            className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-white leading-[0.95] tracking-tighter mb-4 flex flex-col pb-2"
                        >
                            <span className="text-white drop-shadow-[0_8px_15px_rgba(0,0,0,0.5)]">{t('homeTitle1')}</span>
                            <span className="hero-gradient-text drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                {t('homeTitle2')}
                            </span>
                        </motion.h1>

                        <div className="space-y-6 mb-10 max-w-lg md:max-w-xl mx-auto lg:mx-0">
                            <motion.p 
                                variants={itemVariants}
                                className="text-base md:text-xl text-slate-400/90 font-medium leading-relaxed"
                            >
                                {t('homeSubtitle')}
                            </motion.p>

                            {/* Mobile Beta Badge - Under Subtitle */}
                            <motion.div 
                                variants={itemVariants}
                                className="lg:hidden inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-3 shadow-[0_0_25px_rgba(168,85,247,0.4)]"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                {t('beta.badge')} - {t('beta.earlyAccess')}
                            </motion.div>

                            {/* Mobile Status Badge */}
                            <motion.div 
                                variants={itemVariants}
                                className="lg:hidden inline-flex items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            >
                                <span className="relative flex h-2 w-2 me-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                {t('coreSystemActive')}: {t('aiPoweredProtection')}
                            </motion.div>
                        </div>

                        <motion.div 
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                id="register-btn"
                                onClick={() => onNavigate('register')}
                                className="btn btn-primary text-xs md:text-sm !px-6 md:!px-8 !py-4 rounded-xl transition-all flex items-center justify-center gap-3 group neon-glow-teal-strong uppercase tracking-widest font-black hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] min-h-[48px]"
                            >
                                {t('createImprontaButton')}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onNavigate('lostPetsCenter')}
                                className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl text-xs md:text-sm !px-6 md:!px-8 !py-4 rounded-xl transition-all font-mono-tech flex items-center justify-center gap-4 uppercase tracking-widest font-black hover:border-primary/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] min-h-[48px]"
                            >
                                {t('foundPetButton')}
                            </motion.button>
                        </motion.div>
                    </div>

                    <motion.div 
                        variants={itemVariants}
                        className="lg:col-span-5 flex justify-center lg:justify-end mt-8 md:mt-0"
                    >
                        <HeroScanner lostPets={lostPets} onViewPet={onViewPet} />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
});
