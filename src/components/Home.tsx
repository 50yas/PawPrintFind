
import React, { lazy, Suspense } from 'react';
import { View, User, PetProfile } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { LoadingSpinner } from './LoadingSpinner';
import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { ProblemStats } from './ProblemStats';
import { SolutionNarrative } from './SolutionNarrative';
import { CallToAction } from './CallToAction';
import { FAQSection } from './FAQSection';
import { SupportSection } from './SupportSection';
import { useHomeLogic } from '../hooks/useHomeLogic';

const MissingPetsMap = lazy(() => import('./MissingPetsMap').then(m => ({ default: m.MissingPetsMap })));
const RoleExplorer = lazy(() => import('./RoleExplorer').then(m => ({ default: m.RoleExplorer })));
const DonorTicker = lazy(() => import('./DonorTicker').then(m => ({ default: m.DonorTicker })));

interface HomeProps {
    setView: (view: View) => void;
    openLogin: () => void;
    currentUser: User | null;
    lostPets: PetProfile[];
    petsForAdoption: PetProfile[];
    onContactOwner?: (pet: PetProfile) => void;
    onViewPet?: (pet: PetProfile) => void;
}

export const Home: React.FC<HomeProps> = ({ setView, openLogin, currentUser, lostPets, petsForAdoption, onContactOwner, onViewPet }) => {
    const { t } = useTranslations();
    const {
        donations,
        shouldLoadHeavyContent,
        featuresRef,
        handleNavigate
    } = useHomeLogic({ currentUser, setView, openLogin });

    return (
        <div className="overflow-x-hidden min-h-screen">
            {/* Hero Section */}
            <HeroSection lostPets={lostPets} onViewPet={onViewPet} onNavigate={handleNavigate} />

            {/* Section Divider */}
            <div className="relative z-10 h-px w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            </div>

            {/* Beta Launch Banner */}
            <CallToAction onNavigate={handleNavigate} />

            {/* Features Showcase */}
            <FeaturesGrid />

            {/* Problem & Urgency Narrative */}
            <ProblemStats />

            {/* Solution Narrative */}
            <SolutionNarrative />

            {/* Ecosystem Hub / How It Works */}
            <section id="how-it-works" ref={featuresRef} className="scroll-animation relative z-10 py-12 md:py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">{t('howItWorksTitle')}</h2>
                        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-primary via-secondary to-primary mx-auto mb-6 md:mb-8 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
                        <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium mb-10">{t('ecosystemDesc')}</p>
                        
                        <button 
                            onClick={() => setView('ecosystemHub')}
                            className="btn btn-secondary !px-10 !py-4 text-[10px] uppercase tracking-[0.3em] font-black"
                        >
                            {t('exploreEcosystem')}
                        </button>
                    </div>
                    <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner /></div>}>
                        <RoleExplorer />
                    </Suspense>
                </div>
            </section>

            {/* Missing Pets Map - Defer until heavy content is ready */}
            {shouldLoadHeavyContent && (
                <section id="missing-pets-map" className="scroll-animation container mx-auto px-6 relative z-10 py-12 md:py-32">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 font-mono-tech text-white uppercase tracking-tighter">{t('missingPetsMapTitle')}</h2>
                        <p className="max-w-xl mx-auto text-base md:text-lg text-slate-400 font-medium">{t('missingPetsMapDesc')}</p>
                    </div>
                    <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 p-1 bg-black/20">
                        <div className="rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden relative h-[400px] md:h-[650px] w-full">
                            <Suspense fallback={<LoadingSpinner />}>
                                <MissingPetsMap lostPets={lostPets} adoptablePets={petsForAdoption} onContactOwner={onContactOwner} onViewPet={onViewPet} />
                            </Suspense>
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
            <FAQSection onNavigate={handleNavigate} />

            {/* Support Us Section */}
            <SupportSection />

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
