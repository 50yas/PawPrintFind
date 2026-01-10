
import React, { useState, useEffect, useRef, memo } from 'react';
import { View, User, PetProfile, UserRole, Donation } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { MissingPetsMap } from './MissingPetsMap';
import { DonorTicker } from './DonorTicker';
import { RoleExplorer } from './RoleExplorer';
import { SupportCard } from './SupportCard';
import { dbService } from '../services/firebase';
import { CinematicImage, GlassCard, GlassButton } from './ui';

interface HomeProps {
    setView: (view: View) => void;
    openLogin: () => void;
    currentUser: User | null;
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
}

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

const HeroScanner = memo(({ lostPets }: { lostPets: PetProfile[] }) => {
    const { t } = useTranslations();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<ScanPhase>('scanning');
    const timerRef = useRef<number>(0);

    // Filter pets that actually have photos
    const scanPool = lostPets.filter(p => p.photos?.[0]?.url).length > 0 
        ? lostPets.filter(p => p.photos?.[0]?.url).map(p => ({
            id: p.id,
            img: p.photos[0].url,
            name: p.name,
            breed: p.breed
        }))
        : FALLBACK_PETS;

    useEffect(() => {
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

    const pet = scanPool[currentIndex];
    const isTransitioning = phase === 'transition';

    return (
        <div className="relative w-full max-w-xs md:max-w-sm aspect-square mx-auto lg:mx-0 z-20">
            <div className={`relative w-full h-full rounded-[2rem] overflow-hidden bg-slate-900 border-[4px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <CinematicImage src={pet.img} alt={pet.name} className="w-full h-full object-cover filter brightness-90 grayscale-[0.1]" />

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

export const Home: React.FC<HomeProps> = ({ setView, openLogin, currentUser, lostPets, petsForAdoption }) => {
    const { t } = useTranslations();
    useScrollAnimation();
    const [donations, setDonations] = useState<Donation[]>([]);

    useEffect(() => {
        const unsub = dbService.subscribeToDonations(setDonations);
        return () => unsub();
    }, []);

    const handleNavigate = (view: View) => {
        if (currentUser) {
            setView(view);
        } else {
            openLogin();
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    // Sync React state with video element state to prevent desync on external events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleVolumeChange = () => setIsMuted(video.muted);
        video.addEventListener('volumechange', handleVolumeChange);
        return () => video.removeEventListener('volumechange', handleVolumeChange);
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

    return (
        <div className="overflow-x-hidden min-h-screen">

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none"></div>

                <HeroHUD />

                <div className="container mx-auto px-6 lg:px-16 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-center">

                        {/* Hero Text Content */}
                        <div className="lg:col-span-7 text-center lg:text-start relative">

                            {/* Desktop Status Badge - High Right */}
                            <div className="hidden lg:inline-flex absolute end-0 -top-20 items-center px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.15em] animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <span className="relative flex h-2 w-2 me-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                {t('coreSystemActive')}: {t('aiPoweredProtection')}
                            </div>

                                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-foreground leading-[0.95] tracking-tighter mb-4 flex flex-col pb-2">
                                    <span className="text-white drop-shadow-[0_8px_15px_rgba(0,0,0,0.5)]">{t('homeTitle1')}</span>
                                    <span className="hero-gradient-text">
                                        {t('homeTitle2')}
                                    </span>
                                </h1>

                            <div className="space-y-6 mb-10 max-w-lg md:max-w-xl mx-auto lg:mx-0">
                                <p className="text-base md:text-xl text-muted-foreground/90 font-medium leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
                                    {t('homeSubtitle')}
                                </p>

                                {/* Mobile Status Badge - Under Subtitle */}
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
                                    onClick={() => handleNavigate('register')}
                                    className="btn btn-primary text-xs md:text-sm !px-6 md:!px-8 !py-3 md:!py-4 rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-3 group shadow-[0_15px_30px_-10px_rgba(6,182,212,0.4)] uppercase tracking-widest font-black"
                                >
                                    {t('createImprontaButton')}
                                </button>

                                <button
                                    onClick={() => handleNavigate('find')}
                                    className="btn bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-xl text-xs md:text-sm !px-6 md:!px-8 !py-3 md:!py-4 rounded-xl transition-all hover:scale-105 font-mono-tech flex items-center justify-center gap-4 uppercase tracking-widest font-black"
                                >
                                    {t('foundPetButton')}
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-5 animate-fade-in flex justify-center lg:justify-end mt-8 md:mt-0" style={{ animationDelay: '400ms' }}>
                            <HeroScanner lostPets={lostPets} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Sections */}
            <section id="how-it-works" className="scroll-animation relative z-10 py-12 md:py-32 bg-card/10 backdrop-blur-3xl border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24">
                        <h3 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-foreground uppercase tracking-tighter">{t('howItWorksTitle')}</h3>
                        <div className="h-1 w-16 md:w-20 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 md:mb-8 rounded-full"></div>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">{t('ecosystemDesc')}</p>
                    </div>
                    <RoleExplorer />
                </div>
            </section>

            {/* Italian Explainer Video - Ecosystem */}
            <section className="scroll-animation relative z-10 py-10 md:py-20 container mx-auto px-6">
                <div className="glass-panel p-4 rounded-[2rem] border border-cyan-500/30 bg-black/40 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                    <div className="text-center mb-8">
                  <div className="absolute top-6 start-6 z-20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold tracking-widest text-white uppercase">{t('demoVideo')}</span>
                  </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">{t('ecosystemTitle')}</h3>
                    </div>
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black group">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            muted={isMuted}
                            autoPlay
                            playsInline
                            loop
                            preload="auto"
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
                        </div>
                    </div>
                </div>
            </section>

            <section id="missing-pets-map" className="scroll-animation container mx-auto px-6 relative z-10 py-12 md:py-32">
                <div className="text-center mb-12 md:mb-16">
                    <h3 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-foreground uppercase tracking-tighter">{t('missingPetsMapTitle')}</h3>
                    <p className="max-w-xl mx-auto text-base md:text-lg text-muted-foreground font-medium">{t('missingPetsMapDesc')}</p>
                </div>
                <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 p-1 bg-black/20">
                    <div className="rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden relative h-[400px] md:h-[650px] w-full">
                        <MissingPetsMap lostPets={lostPets} adoptablePets={petsForAdoption} />
                    </div>
                </div>
            </section>

            <section className="scroll-animation container mx-auto px-6 py-12 md:py-32 z-10">
                <div className="glass-panel rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 end-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-emerald-500/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-3xl md:text-5xl font-black text-white leading-[1] tracking-tighter">{t('forVetsTitle')}</h3>
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
                                <CinematicImage src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" alt="Veterinarian" className="w-full h-full object-cover grayscale-[0.2] brightness-90 hover:grayscale-0 transition-all duration-1000" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <DonorTicker onViewAll={() => setView('donors')} donations={donations} />

            <section id="support-us" className="scroll-animation container mx-auto px-6 py-12 md:py-32 relative z-10">
                <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-stretch">
                    <GlassCard className="p-8 md:p-10 flex flex-col justify-between h-full border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl">
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">{t('openSourceTitle')}</h3>
                            <p className="text-slate-300 leading-relaxed text-base md:text-lg font-medium">{t('openSourceDesc')}</p>
                        </div>
                        <div className="pt-8 md:pt-10">
                            <a 
                                href="https://github.com/google/aistudio-apps" 
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
                    <SupportCard />
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
