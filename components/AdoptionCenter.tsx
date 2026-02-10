import React, { useState, useMemo, lazy, Suspense, useEffect, useCallback, memo } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { CardSkeleton, MapSidebarSkeleton } from './ui/SkeletonLoader';
import { SmartSearchBar } from './SmartSearchBar';
import { analyticsService } from '../services/analyticsService';
import { searchService, SearchFilters } from '../services/searchService';
import { optimizationService } from '../services/optimizationService';
import { aiBridgeService } from '../services/aiBridgeService';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';

const AdoptionMap = lazy(() => import('./AdoptionMap').then(m => ({ default: m.AdoptionMap })));

type ViewMode = 'grid' | 'list' | 'carousel' | 'map';

export interface AdoptionCenterProps {
    petsForAdoption: PetProfile[];
    onInquire: (pet: PetProfile) => void;
    onViewPet: (pet: PetProfile) => void;
    goBack: () => void;
    currentUser: User | null;
    isLoading: boolean;
    predefinedFilters?: Partial<SearchFilters>;
}

const AdoptionCard: React.FC<{ 
    pet: PetProfile; 
    mode?: ViewMode; 
    onView: (pet: PetProfile) => void;
    onInquire: (pet: PetProfile) => void;
    explanation?: string;
}> = memo(({ pet, mode = 'grid', onView, onInquire, explanation }) => {
    const { t } = useTranslations();
    
    const handleCardClick = (e: React.MouseEvent | React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onView(pet);
    };

    return (
        <GlassCard 
            variant="interactive" 
            className={`flex ${mode === 'list' ? 'flex-row h-48' : 'flex-col h-full'} border-white/10 bg-white/10 backdrop-blur-2xl overflow-hidden group shadow-2xl relative cursor-pointer active:scale-95 transition-transform`}
            onPointerDown={handleCardClick}
        >
            <div className={`${mode === 'list' ? 'w-48' : 'w-full h-64'} relative overflow-hidden`}>
                <CinematicImage className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={pet.photos[0]?.url} alt={pet.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <span className="text-white text-xs font-bold uppercase tracking-widest drop-shadow-md">{pet.breed}</span>
                </div>
                {/* Action Overlays */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <FavoriteButton petId={pet.id} className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white" />
                    <ShareButton pet={pet} className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white" />
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md truncate">{pet.name}</h2>
                        <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mt-1 drop-shadow-sm truncate">{pet.breed}</p>
                    </div>                    
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md flex-shrink-0 ml-2">{pet.age}</span>
                </div>
                
                {explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-pulse-slow">
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">{t('aiMatchReason')}</p>
                        <p className="text-xs text-slate-100 italic">"{explanation}"</p>
                    </div>
                )}

                <p className="text-sm text-slate-200 mt-4 flex-grow leading-relaxed line-clamp-3 drop-shadow-sm">{pet.behavior}</p>
                
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                     <div className="flex gap-2">
                        {pet.weight && <span className="bg-white/10 text-slate-300 px-2 py-1 rounded text-[10px] uppercase font-bold border border-white/5">{pet.weight}</span>}
                     </div>
                     <GlassButton onClick={() => onInquire(pet)} className="text-[10px] uppercase tracking-[0.2em] font-black shadow-lg" variant="primary">
                        {t('inquireToAdoptButton')}
                     </GlassButton>
                </div>
            </div>
        </GlassCard>
    );
});

export const AdoptionCenter: React.FC<AdoptionCenterProps> = ({ petsForAdoption, onInquire, onViewPet, goBack, currentUser, isLoading, predefinedFilters }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterBreed, setFilterBreed] = useState(predefinedFilters?.breed || '');
  const [filterAge, setFilterAge] = useState(predefinedFilters?.age || '');
  const [filterSize, setFilterSize] = useState(predefinedFilters?.size || '');
  const [filterLocation, setFilterLocation] = useState(predefinedFilters?.location || '');
  const [sortBy, setSortBy] = useState<'newest' | 'relevance' | 'distance'>('relevance');
  const [aiFilters, setAiFilters] = useState<any>(predefinedFilters || null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [rankedPets, setRankedPets] = useState<PetProfile[]>(petsForAdoption);
  const [isRanking, setIsRanking] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateRanking = async () => {
        // Only show ranking skeleton if filters are actually applied
        const hasFilters = filterBreed || filterAge || filterSize || filterLocation || (aiFilters && Object.keys(aiFilters).length > 0);
        if (hasFilters) setIsRanking(true);
        
        const filters: SearchFilters = {
            breed: filterBreed,
            age: filterAge,
            size: filterSize,
            location: filterLocation,
            sortBy,
            ...aiFilters
        };
        const results = await searchService.rankPets(petsForAdoption, filters);
        setRankedPets(results);
        setIsRanking(false);

        // Generate match explanation for the top match if filters are active
        if (hasFilters && results.length > 0) {
            const topPet = results[0];
            if (!explanations[topPet.id]) {
                try {
                    const explanation = await aiBridgeService.generateMatchExplanation(topPet, filters);
                    setExplanations(prev => ({ ...prev, [topPet.id]: explanation }));
                } catch (e) {
                    console.error("Failed to generate match explanation:", e);
                }
            }
        }
    };
    updateRanking();
  }, [petsForAdoption, filterBreed, filterAge, filterSize, filterLocation, sortBy, aiFilters]);

  const uniqueBreeds = useMemo(() => [...new Set(petsForAdoption.map((p: PetProfile) => p.breed))], [petsForAdoption]);
  const uniqueAges = useMemo(() => [...new Set(petsForAdoption.map((p: PetProfile) => p.age))], [petsForAdoption]);
  const uniqueSizes = useMemo(() => [...new Set(petsForAdoption.map((p: PetProfile) => p.size).filter(Boolean))], [petsForAdoption]);

  const handleInquire = useCallback((pet: PetProfile) => {
    if (!currentUser) {
        addSnackbar(t('loginToAdoptWarning'), 'error');
        return;
    }
    analyticsService.trackAdoptionInquiry(pet.id, pet.name);
    optimizationService.recordSearchInteraction(pet.id, 'inquiry');
    onInquire(pet);
  }, [currentUser, addSnackbar, t, onInquire]);

  const handlePetView = useCallback((pet: PetProfile) => {
    console.log("[AdoptionCenter] View Pet triggered:", pet.id);
    analyticsService.trackPetView(pet.id, pet.name, pet.status);
    optimizationService.recordSearchInteraction(pet.id, 'view');
    onViewPet(pet);
  }, [onViewPet]);

      const nextSlide = useCallback(() => setCarouselIndex(prev => (prev + 1) % rankedPets.length), [rankedPets.length]);

      const prevSlide = useCallback(() => setCarouselIndex(prev => (prev - 1 + rankedPets.length) % rankedPets.length), [rankedPets.length]);

  

      return (

          <div className="min-h-screen bg-transparent pb-20 pt-24 px-6 relative">

  
          <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            
                    {/* Header & Controls */}
            
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-8 border-b border-white/10">
            
                        <div>
            
                            <button onClick={goBack} className="text-primary hover:text-primary/80 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 transition-colors">
            
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            
                                {t('homeButton')}
            
                            </button>
            
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{t('adoptionLink')}</h1>
            
                            <p className="text-lg text-slate-200 mt-2 max-w-2xl drop-shadow-md font-medium">{t('adoptionCenterDescPublic')}</p>
            
                        </div>
            
            
            
                        <div className="flex flex-col gap-4 w-full md:w-auto">
            
                            <div role="group" aria-label="View selection" className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/10">
            
                                {(['grid', 'list', 'carousel', 'map'] as ViewMode[]).map(m => (
            
                                    <button 
            
                                        key={m}
            
                                        onClick={() => setViewMode(m)}
            
                                        aria-label={`Switch to ${m} view`}
            
                                        className={`p-2 rounded-lg transition-all ${viewMode === m ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            
                                    >
            
                                        {m === 'grid' && <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
            
                                        {m === 'list' && <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>}
            
                                        {m === 'carousel' && <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>}
            
                                        {m === 'map' && <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
            
                                    </button>
            
                                ))}
            
                            </div>
            
                        </div>
            
                    </div>
            
            
            
                    {/* Smart AI Search */}
                    <div className="pb-4">
                        <SmartSearchBar onSearch={setAiFilters} />
                        {(aiFilters || filterBreed || filterAge) && (
                            <div className="flex justify-center mt-4 gap-4">
                                <button 
                                    onClick={async () => {
                                        if (!currentUser) {
                                            addSnackbar(t('loginToSaveSearchWarning'), 'error');
                                            return;
                                        }
                                        const name = prompt(t('searchNamePrompt'), t('defaultSearchName'));
                                        if (name) {
                                            await searchService.saveSearch(currentUser.email, name, {
                                                breed: filterBreed,
                                                age: filterAge,
                                                ...aiFilters
                                            });
                                            addSnackbar(t('searchSavedSuccess'), 'success');
                                        }
                                    }}
                                    className="text-xs text-primary hover:text-primary/80 uppercase tracking-[0.2em] font-black flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 transition-all hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    {t('saveSearchButton')}
                                </button>
                                <button 
                                    onClick={() => {
                                        setAiFilters(null);
                                        setFilterBreed('');
                                        setFilterAge('');
                                        setFilterSize('');
                                        setFilterLocation('');
                                    }} 
                                    className="text-xs text-slate-400 hover:text-white uppercase tracking-[0.2em] font-black flex items-center gap-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    {t('clearAiSearch')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
            
                    <div className="flex flex-wrap gap-4 items-center">
            
                        <div className="flex flex-col gap-1">
            
                            <label htmlFor="breed-filter" className="sr-only">{t('filterByBreedLabel')}</label>
            
                            <select 
            
                                id="breed-filter"
            
                                value={filterBreed} 
            
                                onChange={(e) => {
                                    setFilterBreed(e.target.value);
                                    analyticsService.logEvent('smart_search_performed', { breed: e.target.value, filter_type: 'standard' });
                                }}
            
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            
                            >
            
                                <option value="">{t('dashboard:adoption.allBreeds')}</option>
            
                                {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
            
                            </select>
            
                        </div>
            
                        
            
                        <div className="flex flex-col gap-1">
            
                            <label htmlFor="age-filter" className="sr-only">{t('filterByAgeLabel')}</label>
            
                            <select 
            
                                id="age-filter"
            
                                value={filterAge} 
            
                                onChange={(e) => {
                                    setFilterAge(e.target.value);
                                    analyticsService.logEvent('smart_search_performed', { age: e.target.value, filter_type: 'standard' });
                                }}
            
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            
                            >
            
                                <option value="">{t('dashboard:adoption.allAges')}</option>
            
                                {uniqueAges.map(a => <option key={a} value={a}>{a}</option>)}
            
                            </select>
            
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="size-filter" className="sr-only">{t('filterBySizeLabel')}</label>
                            <select 
                                id="size-filter"
                                value={filterSize} 
                                onChange={(e) => {
                                    setFilterSize(e.target.value);
                                    analyticsService.logEvent('smart_search_performed', { size: e.target.value, filter_type: 'standard' });
                                }}
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="">{t('dashboard:adoption.allSizes')}</option>
                                {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                             <label htmlFor="location-filter" className="sr-only">{t('filterByLocationLabel')}</label>
                             <input 
                                type="text"
                                id="location-filter"
                                placeholder={t('filterByLocationPlaceholder')}
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                             />
                        </div>

                         <div className="flex flex-col gap-1">
                            <label htmlFor="sort-by" className="sr-only">{t('sortByLabel')}</label>
                            <select 
                                id="sort-by"
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="relevance">{t('dashboard:adoption.sortRelevance')}</option>
                                <option value="newest">{t('dashboard:adoption.sortNewest')}</option>
                                <option value="distance">{t('dashboard:adoption.sortDistance')}</option>
                            </select>
                        </div>
            
                        
            
                        <div className="ml-auto text-sm text-muted-foreground font-mono">
            
                            {t('dashboard:adoption.matchesFound', { count: rankedPets.length })}
            
                        </div>
            
                    </div>
        
        {/* Content */}
        {isLoading || isRanking ? (
            <div data-testid="loading-state" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
            </div>
        ) : rankedPets.length > 0 ? (
            <>
                {viewMode === 'grid' && (
                    <div data-testid="pets-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                        {rankedPets.map(pet => (
                            <AdoptionCard key={pet.id} pet={pet} onView={handlePetView} onInquire={handleInquire} explanation={explanations[pet.id]} />
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="space-y-4 animate-fade-in">
                        {rankedPets.map(pet => (
                            <AdoptionCard key={pet.id} pet={pet} mode="list" onView={handlePetView} onInquire={handleInquire} explanation={explanations[pet.id]} />
                        ))}
                    </div>
                )}

                {viewMode === 'carousel' && (
                    <div className="relative h-[600px] w-full flex items-center justify-center animate-fade-in">
                        <button onClick={prevSlide} className="absolute left-4 z-20 p-4 rounded-full bg-black/50 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <div className="w-full max-w-4xl h-full">
                            <AdoptionCard pet={rankedPets[carouselIndex]} mode="grid" onView={handlePetView} onInquire={handleInquire} explanation={explanations[rankedPets[carouselIndex].id]} />
                        </div>

                        <button onClick={nextSlide} className="absolute right-4 z-20 p-4 rounded-full bg-black/50 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {rankedPets.map((_, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setCarouselIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === carouselIndex ? 'w-8 bg-primary' : 'bg-white/30 hover:bg-white'}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {viewMode === 'map' && (
                    <div className="h-[50vh] md:h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 animate-fade-in">
                        <Suspense fallback={<MapSidebarSkeleton />}>
                            <AdoptionMap adoptablePets={rankedPets} onAdoptMe={handleInquire} isLoading={isLoading} />
                        </Suspense>
                    </div>
                )}
            </>
        ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4">🐾</span>
                <p className="text-xl font-bold text-foreground">{t('dashboard:adoption.noMatchingPets')}</p>
                <p className="text-muted-foreground mt-2">{t('dashboard:adoption.adjustFiltersSuggestion')}</p>
                <button onClick={() => { setFilterBreed(''); setFilterAge(''); }} className="mt-6 text-primary hover:underline">{t('dashboard:adoption.clearFiltersButton')}</button>
            </div>
        )}
      </div>
    </div>
  );
};