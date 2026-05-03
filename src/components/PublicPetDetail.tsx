import React, { useEffect, useState, useMemo } from 'react';
import { PetProfile, User, Sighting } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { ShareButton } from './ShareButton';
import { aiBridgeService } from '../services/aiBridgeService';
import { analyticsService } from '../services/analyticsService';

interface PublicPetDetailProps {
    pet: PetProfile;
    goBack: () => void;
    onContactOwner: (pet: PetProfile) => void;
    onReportSighting?: (pet: PetProfile) => void;
    currentUser: User | null;
}

export const PublicPetDetail: React.FC<PublicPetDetailProps> = ({ 
    pet, goBack, onContactOwner, onReportSighting, currentUser 
}) => {
    console.log("[PublicPetDetail] Rendering for pet:", pet?.id);
    const { t } = useTranslations();
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'community' | 'medical'>('details');

    useEffect(() => {
        const fetchAiInsight = async () => {
            if (pet.status === 'forAdoption') {
                try {
                    const explanation = await aiBridgeService.generateMatchExplanation(pet, {});
                    setAiExplanation(explanation);
                } catch (e) {
                    console.error("AI Insight failed:", e);
                }
            }
        };
        fetchAiInsight();
        analyticsService.trackPetView(pet.id, pet.name, pet.status);
    }, [pet]);

    const sightingsCount = pet.sightings?.length || 0;

    return (
        <div className="min-h-screen bg-transparent pb-20 pt-10 px-4 md:px-6 relative animate-fade-in">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Navigation & Actions Header */}
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={goBack}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 font-black uppercase tracking-widest text-xs transition-all hover:-translate-x-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        {t('backButton')}
                    </button>
                    <div className="flex gap-3">
                        <ShareButton pet={pet} variant="text" className="!bg-white/5 !border-white/10" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Visuals */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <CinematicImage 
                                src={pet.photos[0]?.url} 
                                alt={pet.name} 
                                className="w-full h-full object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            
                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                                        {pet.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-lg ${pet.isLost ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-emerald-500 border-emerald-400 text-white'}`}>
                                            {pet.isLost ? t('statusLost') : t('statusSafe')}
                                        </span>
                                        <span className="text-white/80 font-mono text-xs uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                            {pet.breed}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Photo Gallery (if more than one) */}
                        {pet.photos.length > 1 && (
                            <div className="grid grid-cols-4 gap-4">
                                {pet.photos.slice(1, 5).map((photo, i) => (
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all cursor-pointer group">
                                        <img src={photo.url} alt={`${pet.name} view ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tabs Navigation */}
                        <div className="flex gap-6 border-b border-white/10 pb-2">
                            {([
                                { id: 'details', label: t('tabOverview') },
                                { id: 'community', label: pet.isLost ? t('communityReports') || 'Community Reports' : t('communityComments') || 'Comments' },
                                { id: 'medical', label: t('tabMedical') }
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-xs font-black uppercase tracking-[0.2em] pb-2 transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_#2dd4bf]" />}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[300px]">
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-fade-in">
                                    <GlassCard className="p-6 border-white/5 bg-white/5">
                                        <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t('aboutPet')}</h3>
                                        <p className="text-slate-200 leading-relaxed text-lg italic">"{pet.behavior || t('noDescriptionAvailable')}"</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('ageLabel')}</p>
                                                <p className="text-white font-black">{pet.age}</p>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('genderLabel')}</p>
                                                <p className="text-white font-black">{pet.gender || 'N/A'}</p>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('weightLabel')}</p>
                                                <p className="text-white font-black">{pet.weight}</p>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('sizeLabel')}</p>
                                                <p className="text-white font-black">{pet.size || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </GlassCard>

                                    {pet.lastSeenLocation && (
                                        <GlassCard className="p-6 border-white/5 bg-white/5">
                                            <h3 className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                                {pet.isLost ? t('lastSeenLocation') : t('homeLocation')}
                                            </h3>
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{pet.lastSeenLocation.address || t('addressUnknown')}</p>
                                                    <p className="text-slate-400 text-xs mt-1">
                                                        {pet.lastSeenLocation.latitude.toFixed(4)}, {pet.lastSeenLocation.longitude.toFixed(4)}
                                                    </p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    )}
                                </div>
                            )}

                            {activeTab === 'community' && (
                                <div className="space-y-4 animate-fade-in">
                                    {pet.isLost ? (
                                        <>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-white font-black uppercase tracking-widest text-sm">
                                                    {t('sightingsTimeline')} ({sightingsCount})
                                                </h3>
                                                <GlassButton 
                                                    onClick={() => onReportSighting?.(pet)} 
                                                    variant="primary" 
                                                    className="!py-2 !px-4 text-[10px]"
                                                >
                                                    {t('reportSightingButton')}
                                                </GlassButton>
                                            </div>
                                            
                                            {pet.sightings && pet.sightings.length > 0 ? (
                                                <div className="space-y-4">
                                                    {pet.sightings.map((sighting, idx) => (
                                                        <GlassCard key={idx} className="p-4 border-white/5 bg-white/5 flex gap-4">
                                                            {sighting.photo && (
                                                                <img src={sighting.photo.url} className="w-20 h-20 rounded-xl object-cover border border-white/10" alt="Sighting" />
                                                            )}
                                                            <div>
                                                                <p className="text-white text-sm font-bold">{sighting.location.address || t('orbitalUnknown')}</p>
                                                                <p className="text-slate-400 text-xs mt-1">{new Date(sighting.timestamp).toLocaleString()}</p>
                                                                <p className="text-slate-300 text-sm mt-2 italic">"{sighting.notes}"</p>
                                                            </div>
                                                        </GlassCard>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                                    <p className="text-slate-400 text-sm">{t('noSightingsYet')}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('communityComments')}</h3>
                                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center">
                                                <span className="text-4xl mb-4">💬</span>
                                                <p className="text-slate-400 text-sm max-w-xs">{t('commentsComingSoon') || "Community discussions and inquiries for this pet will appear here."}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'medical' && (
                                <div className="animate-fade-in">
                                    <GlassCard className="p-6 border-white/5 bg-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            </div>
                                            <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('healthStatus')}</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl">
                                                <span className="text-slate-400 text-xs font-bold uppercase">{t('vaccinationsLabel')}</span>
                                                <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">
                                                    {pet.medicalRecord?.vaccinations?.length ? t('statusUpToDate') : t('noDataAvailable')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl">
                                                <span className="text-slate-400 text-xs font-bold uppercase">{t('allergiesLabel')}</span>
                                                <span className="text-white text-xs font-bold">{pet.medicalRecord?.allergies || t('noneReported')}</span>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI & Actions */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* AI Match Card */}
                        <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-primary/20 rounded-lg border border-primary/40 animate-pulse">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <h2 className="text-primary text-sm font-black uppercase tracking-[0.2em]">{t('aiInsightTitle')}</h2>
                                </div>

                                {aiExplanation ? (
                                    <p className="text-white text-lg leading-relaxed font-medium italic drop-shadow-sm">
                                        "{aiExplanation}"
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="h-4 bg-primary/10 rounded-full w-full animate-pulse" />
                                        <div className="h-4 bg-primary/10 rounded-full w-3/4 animate-pulse" />
                                        <div className="h-4 bg-primary/10 rounded-full w-1/2 animate-pulse" />
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-primary/10 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {i}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[10px] text-primary/60 font-mono uppercase tracking-widest">{t('verifiedByAi')}</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Primary Action Card */}
                        <GlassCard className="p-8 border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl">
                            <h3 className="text-white text-xl font-black uppercase tracking-tight mb-6">{t('takeAction')}</h3>
                            
                            <div className="space-y-4">
                                <GlassButton 
                                    onClick={() => onContactOwner(pet)}
                                    variant="primary"
                                    className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(45,212,191,0.2)]"
                                >
                                    {pet.status === 'forAdoption' ? t('inquireToAdoptButton') : t('contactOwnerButton')}
                                </GlassButton>

                                {pet.isLost && (
                                    <GlassButton 
                                        onClick={() => onReportSighting?.(pet)}
                                        variant="secondary"
                                        className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                        {t('reportSightingButton')}
                                    </GlassButton>
                                )}
                                
                                <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest mt-4">
                                    {t('secureCommunicationDisclaimer')}
                                </p>
                            </div>
                        </GlassCard>

                        {/* Owner Info Summary (Minimal for Privacy) */}
                        <div className="px-4 py-6 border border-white/5 rounded-3xl bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xl">
                                    👤
                                </div>
                                <div>
                                    <p className="text-white text-sm font-bold uppercase tracking-widest">{t('ownerInformation')}</p>
                                    <p className="text-slate-500 text-xs font-mono">{t('verifiedMemberSince')} 2026</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
