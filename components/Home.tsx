import React, { useState, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { View, User, PetProfile, UserRole, Donation } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useCountUp, formatNumber } from '../hooks/useCountUp';
import { dbService } from '../services/firebase';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { LoadingSpinner } from './LoadingSpinner';
import { MapSidebarSkeleton, CardSkeleton } from './ui/SkeletonLoader';
import { optimizeUnsplashUrl, generateSrcSet, generateSizes } from '../src/utils/imageOptimizer';

const MissingPetsMap = lazy(() => import('./MissingPetsMap').then(m => ({ default: m.MissingPetsMap })));
const DonorTicker = lazy(() => import('./DonorTicker').then(m => ({ default: m.DonorTicker })));
const RoleExplorer = lazy(() => import('./RoleExplorer').then(m => ({ default: m.RoleExplorer })));
const SupportCard = lazy(() => import('./SupportCard').then(m => ({ default: m.SupportCard })));

interface HomeProps {
    setView: (view: View) => void;
    openLogin: () => void;
    currentUser: User | null;
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    onContactOwner?: (pet: PetProfile) => void;
    onViewPet?: (pet: PetProfile) => void;
}

const StatCard = memo(({ value, label, color, delay = 0 }: { value: number; label: string; color: string; delay?: number; }) => {
    const count = useCountUp(value, 2000, delay);
    const formattedValue = value >= 1000 ? formatNumber(value) : count.toString();

    const displayValue = value >= 1000
        ? formattedValue
        : count === value ? value.toString() : count.toString();

    return (
        <div className={`glass-panel p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl text-center hover:border-${color}-500/30 transition-all hover:scale-105`}>
            <div className={`text-4xl md:text-5xl font-black text-${color}-400 mb-2 font-mono-tech`}>
                {displayValue}
            </div>
            <div className="text-slate-400 text-sm md:text-base font-medium">
                {label}
            </div>
        </div>
    );
});

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

const FALLBACK_PETS = [
    { id: 'f1', img: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80", name: "Buddy", breed: "Golden Retriever" },
    { id: 'f2', img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80", name: "Mochi", breed: "Tabby Cat" },
];

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

export const Home: React.FC<HomeProps> = ({ setView, openLogin, currentUser, lostPets, petsForAdoption, onContactOwner, onViewPet }) => {
    const { t } = useTranslations();
    useScrollAnimation();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [shouldLoadHeavyContent, setShouldLoadHeavyContent] = useState(false);
    const featuresRef = useRef<HTMLElement>(null);

    // Defer donations subscription until needed
    useEffect(() => {
        if (!shouldLoadHeavyContent) return;
        const unsub = dbService.subscribeToDonations(setDonations);
        return () => unsub();
    }, [shouldLoadHeavyContent]);

    // Use Intersection Observer to defer below-the-fold content
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoadHeavyContent(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '400px' } // Start loading 400px before visible
        );

        if (featuresRef.current) {
            observer.observe(featuresRef.current);
        }

        // Fallback: Load after 2 seconds if user doesn't scroll
        const fallbackTimer = setTimeout(() => setShouldLoadHeavyContent(true), 2000);

        return () => {
            observer.disconnect();
            clearTimeout(fallbackTimer);
        };
    }, []);

    const handleNavigate = (view: View) => {
        if (currentUser) {
            setView(view);
        } else {
            openLogin();
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Sync React state with video element state to prevent desync on external events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVolumeChange = () => setIsMuted(video.muted);
        video.addEventListener('volumechange', handleVolumeChange);
        return () => video.removeEventListener('volumechange', handleVolumeChange);
    }, []);

    // Monitor fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleToggleAudio = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            if (!videoRef.current.muted && videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
            }
        }
    };

    const handleRestart = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
        }
    };

    const handleToggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await videoContainerRef.current?.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    return (
        <div className="overflow-x-hidden min-h-screen">

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900 pointer-events-none"></div>

                <HeroHUD />

                <div className="container mx-auto px-6 lg:px-16 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">

                        {/* Hero Text Content */}
                        <div className="lg:col-span-7 text-center lg:text-start relative">

                            {/* Beta Badge - Top Left Desktop */}
                            <div className="hidden lg:inline-flex absolute start-0 -top-20 items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                {t('beta.badge')} - {t('beta.earlyAccess')}
                            </div>

                            {/* Desktop Status Badge - High Right */}
                            <div className="hidden lg:inline-flex absolute end-0 -top-20 items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <span className="relative flex h-2 w-2 me-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                {t('coreSystemActive')}: {t('aiPoweredProtection')}
                            </div>

                                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-white leading-[0.95] tracking-tighter mb-4 flex flex-col pb-2">
                                    <span className="text-white drop-shadow-[0_8px_15px_rgba(0,0,0,0.5)]">{t('homeTitle1')}</span>
                                    <span className="hero-gradient-text drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                                        {t('homeTitle2')}
                                    </span>
                                </h1>

                            <div className="space-y-6 mb-10 max-w-lg md:max-w-xl mx-auto lg:mx-0">
                                <p className="text-base md:text-xl text-slate-400/90 font-medium leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
                                    {t('homeSubtitle')}
                                </p>

                                {/* Mobile Beta Badge - Under Subtitle */}
                                <div className="lg:hidden inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in shadow-[0_0_25px_rgba(168,85,247,0.4)] mb-3">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    {t('beta.badge')} - {t('beta.earlyAccess')}
                                </div>

                                {/* Mobile Status Badge */}
                                <div className="lg:hidden inline-flex items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                    <span className="relative flex h-2 w-2 me-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                    </span>
                                    {t('coreSystemActive')}: {t('aiPoweredProtection')}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '300ms' }}>
                                <button
                                    id="register-btn"
                                    onClick={() => handleNavigate('register')}
                                    className="btn btn-primary text-xs md:text-sm !px-6 md:!px-8 !py-3 md:!py-4 rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-3 group neon-glow-teal-strong uppercase tracking-widest font-black hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                                >
                                    {t('createImprontaButton')}
                                </button>

                                <button
                                    onClick={() => handleNavigate('lostPetsCenter')}
                                    className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl text-xs md:text-sm !px-6 md:!px-8 !py-3 md:!py-4 rounded-xl transition-all hover:scale-105 font-mono-tech flex items-center justify-center gap-4 uppercase tracking-widest font-black hover:border-primary/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
                                >
                                    {t('foundPetButton')}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-5 animate-fade-in flex justify-center lg:justify-end mt-8 md:mt-0" style={{ animationDelay: '400ms' }}>
                            <HeroScanner lostPets={lostPets} onViewPet={onViewPet} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Divider */}
            <div className="relative z-10 h-px w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            </div>

            {/* Beta Launch Banner */}
            <section className="scroll-animation relative z-10 py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-transparent pointer-events-none"></div>
                <div className="absolute top-10 start-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-10 end-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Beta Badge */}
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-[0.2em] mb-6 animate-fade-in shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400"></span>
                            </span>
                            {t('beta.testingPhase')}
                        </div>

                        {/* Title */}
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 animate-fade-in tracking-tighter" style={{ animationDelay: '100ms' }}>
                            {t('beta.title')}
                        </h2>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-purple-200 mb-4 font-medium animate-fade-in" style={{ animationDelay: '200ms' }}>
                            {t('beta.subtitle')}
                        </p>

                        {/* Description */}
                        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in" style={{ animationDelay: '300ms' }}>
                            {t('beta.description')}
                        </p>

                        {/* Timeline Badge */}
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white mb-10 animate-fade-in shadow-xl" style={{ animationDelay: '400ms' }}>
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-mono-tech text-sm font-bold tracking-wider">{t('beta.timeline')}</span>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '500ms' }}>
                            <button
                                onClick={() => handleNavigate('register')}
                                className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] hover:scale-105 transition-all border border-white/20"
                            >
                                {t('beta.joinButton')}
                            </button>
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="btn bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                            >
                                {t('beta.learnMore')}
                            </button>
                        </div>

                        {/* Limited Spots Notice */}
                        <p className="text-sm text-slate-500 mt-6 font-mono-tech animate-fade-in" style={{ animationDelay: '600ms' }}>
                            {t('beta.limitedSpots')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section ref={featuresRef} id="features" className="scroll-animation relative z-10 py-16 md:py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">
                            {t('features.title')}
                        </h2>
                        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Feature 1: AI Matching */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(6,182,212,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">🤖</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors">
                                {t('features.aiMatching.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.aiMatching.description')}
                            </p>
                        </div>

                        {/* Feature 2: Real-Time Alerts */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-amber-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(251,146,60,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">⚡</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-amber-400 transition-colors">
                                {t('features.realtime.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.realtime.description')}
                            </p>
                        </div>

                        {/* Feature 3: Community Network */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-purple-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(168,85,247,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">🤝</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-purple-400 transition-colors">
                                {t('features.community.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.community.description')}
                            </p>
                        </div>

                        {/* Feature 4: Vet Network */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-emerald-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">🏥</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-emerald-400 transition-colors">
                                {t('features.vetNetwork.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.vetNetwork.description')}
                            </p>
                        </div>

                        {/* Feature 5: Secure Digital ID */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-blue-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(59,130,246,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">🔐</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-blue-400 transition-colors">
                                {t('features.blockchain.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.blockchain.description')}
                            </p>
                        </div>

                        {/* Feature 6: Geofencing */}
                        <div className="glass-card-enhanced group p-6 md:p-8 rounded-2xl border border-pink-500/20 bg-slate-900/40 backdrop-blur-xl hover:border-pink-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(236,72,153,0.3)]">
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">📍</div>
                            <h3 className="text-xl md:text-2xl font-black text-white mb-3 group-hover:text-pink-400 transition-colors">
                                {t('features.geoFencing.title')}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('features.geoFencing.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platform Stats */}
            <section className="scroll-animation relative z-10 py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/10 to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 font-mono-tech text-white uppercase tracking-tighter">
                            {t('stats.title')}
                        </h2>
                        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary via-secondary to-primary mx-auto rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        <StatCard value={1200} label={t('stats.petsProtected')} color="cyan" delay={0} />
                        <StatCard value={847} label={t('stats.successfulMatches')} color="amber" delay={100} />
                        <StatCard value={5600} label={t('stats.communityMembers')} color="purple" delay={200} />
                        <StatCard value={342} label={t('stats.vetPartners')} color="emerald" delay={300} />
                    </div>

                    {/* Additional Stats Row */}
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-6 md:mt-8 max-w-2xl mx-auto">
                        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl text-center hover:border-pink-500/30 transition-all hover:scale-105">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="text-3xl md:text-4xl font-black text-pink-400 font-mono-tech">
                                    <span className="text-5xl">{useCountUp(12, 1500, 400)}</span>
                                </div>
                                <div className="text-lg text-slate-500 font-medium">
                                    {t('stats.minutes')}
                                </div>
                            </div>
                            <div className="text-slate-400 text-sm md:text-base font-medium">
                                {t('stats.responseTime')}
                            </div>
                        </div>

                        <StatCard value={23} label={t('stats.activeCities')} color="blue" delay={500} />
                    </div>
                </div>
            </section>

            {/* Main Content Sections */}
            <section id="how-it-works" className="scroll-animation relative z-10 py-12 md:py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">{t('howItWorksTitle')}</h2>
                        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary via-secondary to-primary mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
                        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">{t('ecosystemDesc')}</p>
                    </div>
                    <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner /></div>}>
                        <RoleExplorer />
                    </Suspense>
                </div>
            </section>

            {/* Italian Explainer Video - Ecosystem - Only load if heavy content is ready */}
            {shouldLoadHeavyContent && (
            <section className="scroll-animation relative z-10 py-10 md:py-20 container mx-auto px-6">
                <div className="glass-panel p-4 rounded-[2rem] border border-cyan-500/30 bg-black/40 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                    <div className="text-center mb-8">
                  <div className="absolute top-6 start-6 z-20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold tracking-widest text-white uppercase">{t('demoVideo')}</span>
                  </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('ecosystemTitle')}</h2>
                    </div>
                    <div ref={videoContainerRef} className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black group">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            muted={isMuted}
                            playsInline
                            loop
                            preload="none"
                            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000000' width='1920' height='1080'/%3E%3C/svg%3E"
                            onClick={() => setIsMuted(!isMuted)} // Allow clicking video to toggle sound
                        >
                            <source src="/IT.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Custom Control Overlay */}
                        <div className={`absolute bottom-6 end-6 flex flex-col gap-3 transition-opacity duration-500 ${!isMuted ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>

                            {/* Audio Toggle */}
                            <button
                                onClick={handleToggleAudio}
                                className={`flex items-center justify-center gap-3 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:scale-105 transition-all w-full ${isMuted ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md'}`}
                            >
                                {isMuted ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        <span>{t('enableAudio')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                                        <span>{t('disableAudio')}</span>
                                    </>
                                )}
                            </button>

                            {/* Restart Button (Visible mainly when audio is active, but kept for utility) */}
                            <button
                                onClick={handleRestart}
                                className="flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all w-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                <span>{t('restartVideo')}</span>
                            </button>

                            {/* Fullscreen Button */}
                            <button
                                onClick={handleToggleFullscreen}
                                className="flex items-center justify-center gap-3 px-6 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 backdrop-blur-md text-cyan-300 rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all w-full shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                            >
                                {isFullscreen ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        <span>{t('exitFullscreen')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        <span>{t('fullscreen')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* Missing Pets Map - Defer until heavy content is ready */}
            {shouldLoadHeavyContent && (
            <section id="missing-pets-map" className="scroll-animation container mx-auto px-6 relative z-10 py-12 md:py-32">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">{t('missingPetsMapTitle')}</h2>
                    <p className="max-w-xl mx-auto text-base md:text-lg text-slate-400 font-medium">{t('missingPetsMapDesc')}</p>
                </div>
                <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 p-1 bg-black/20">
                    <div className="rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden relative h-[400px] md:h-[650px] w-full">
                        <Suspense fallback={<MapSidebarSkeleton />}>
                            <MissingPetsMap lostPets={lostPets} adoptablePets={petsForAdoption} onContactOwner={onContactOwner} onViewPet={onViewPet} />
                        </Suspense>
                    </div>
                </div>
            </section>
            )}

            {/* Vet Section - Defer until heavy content is ready */}
            {shouldLoadHeavyContent && (
            <section className="scroll-animation container mx-auto px-6 py-12 md:py-32 z-10">
                <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 end-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-500/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">
                        <div className="space-y-4 md:space-y-6">
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-[1] tracking-tighter">{t('forVetsTitle')}</h2>
                            <p className="text-base md:text-xl text-slate-200 leading-relaxed font-medium opacity-90">{t('forVetsDesc')}</p>
                            <button
                                onClick={openLogin}
                                className="btn btn-primary !bg-gradient-to-r from-emerald-500 to-teal-600 !px-8 md:!px-10 !py-4 md:!py-5 text-xs md:text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all rounded-xl w-full sm:w-auto"
                            >
                                {t('registerClinicButton')}
                            </button>
                        </div>
                        <div className="hidden md:block">
                            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl">
                                <CinematicImage
                                    src={optimizeUnsplashUrl("https://images.unsplash.com/photo-1576091160550-2173dba999ef", { width: 800, quality: 75 })}
                                    srcset={generateSrcSet("https://images.unsplash.com/photo-1576091160550-2173dba999ef", [400, 800])}
                                    sizes="(max-width: 768px) 0px, 400px"
                                    alt="Veterinarian"
                                    className="w-full h-full object-cover grayscale-[0.2] brightness-90 hover:grayscale-0 transition-all duration-1000"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* Donor Ticker - Defer until heavy content is ready */}
            {shouldLoadHeavyContent && (
            <Suspense fallback={<div className="h-20 bg-white/5 animate-pulse" />}>
                <DonorTicker onViewAll={() => setView('donors')} donations={donations} />
            </Suspense>
            )}

            {/* FAQ Section */}
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
                            onClick={() => handleNavigate('register')}
                            className="btn bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white !px-8 !py-4 text-sm rounded-xl font-black uppercase tracking-widest shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] hover:scale-105 transition-all border border-white/20"
                        >
                            {t('beta.joinButton')}
                        </button>
                    </div>
                </div>
            </section>

            <section id="support-us" className="scroll-animation container mx-auto px-6 py-12 md:py-32 relative z-10">
                <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-stretch">
                    <GlassCard className="p-8 md:p-10 flex flex-col justify-between h-full border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl">
                        <div className="space-y-4 md:space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">{t('openSourceTitle')}</h2>
                            <p className="text-slate-300 leading-relaxed text-base md:text-lg font-medium">{t('openSourceDesc')}</p>
                        </div>
                        <div className="pt-8 md:pt-10">
                            <a 
                                href="https://github.com/50yas" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center space-x-4 px-8 py-4 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-xl text-white bg-slate-800 hover:bg-slate-700 transition-all border border-white/10 shadow-xl hover:-translate-y-1 w-full sm:w-auto justify-center"
                                aria-label="Visit Paw Print GitHub Repository"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-4.51-2-7-2"></path></svg>
                                <span>{t('githubRepo')}</span>
                            </a>
                        </div>
                    </GlassCard>
                    <Suspense fallback={<CardSkeleton />}>
                        <SupportCard />
                    </Suspense>
                </div>
            </section>

            <style>{`
        @keyframes scan-laser {
            0% { top: 0%; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
            animation: scan-laser 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .animate-blink {
            animation: blink 0.8s step-end infinite;
        }
        @keyframes typewriter {
            from { width: 0; }
            to { width: 100%; }
        }
        .animate-typewriter {
            display: inline-block;
            animation: typewriter 0.4s steps(40, end);
        }
      `}</style>
        </div>
    );
};