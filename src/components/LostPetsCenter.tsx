import React, { useState, useMemo, lazy, Suspense, useEffect, useCallback, memo } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { GridSkeleton, DashboardSkeleton } from './ui/LoadingSkeletons';
import { SmartSearchBar } from './SmartSearchBar';
import { analyticsService } from '../services/analyticsService';
import { searchService, SearchFilters } from '../services/searchService';
import { aiBridgeService } from '../services/aiBridgeService';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';

const MissingPetsMap = lazy(() => import('./MissingPetsMap').then(m => ({ default: m.MissingPetsMap })));

type ViewMode = 'grid' | 'list' | 'map';

export interface LostPetsCenterProps {
    lostPets: PetProfile[];
    onContactOwner: (pet: PetProfile) => void;
    onViewPet: (pet: PetProfile) => void;
    onOpenScanner: () => void;
    goBack: () => void;
    currentUser: User | null;
    isLoading: boolean;
}

const LostPetCard: React.FC<{ 
    pet: PetProfile; 
    mode?: ViewMode; 
    onView: (pet: PetProfile) => void;
    onContact: (pet: PetProfile) => void;
    explanation?: string;
}> = memo(({ pet, mode = 'grid', onView, onContact, explanation }) => {
    const { t } = useTranslations();
    
    const handleCardClick = (e: React.MouseEvent | React.PointerEvent) => {
        // Only trigger onView if the click wasn't on a button
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
                <CinematicImage 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    src={pet.photos[0]?.url} 
                    alt={pet.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <span className="text-white text-xs font-bold uppercase tracking-widest drop-shadow-md">{t('statusLost')} • {pet.breed}</span>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <FavoriteButton petId={pet.id} className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white" />
                    <ShareButton pet={pet} className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-white" />
                </div>
                <div className="absolute top-4 left-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                        {t('statusLost')}
                    </span>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md truncate">{pet.name}</h2>
                        <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mt-1 drop-shadow-sm truncate">{pet.breed}</p>
                    </div>
                    <span className="bg-white/10 text-slate-300 border border-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md flex-shrink-0 ml-2">{pet.age}</span>
                </div>
                
                {explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">{t('aiMatchReason')}</p>
                        <p className="text-xs text-slate-100 italic">"{explanation}"</p>
                    </div>
                )}

                <p className="text-sm text-slate-300 mt-4 flex-grow leading-relaxed line-clamp-2 drop-shadow-sm">{pet.behavior}</p>
                
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                     <div className="text-[10px] text-slate-400 font-mono">
                        {pet.lastSeenLocation?.address || t('orbitalUnknown')}
                     </div>
                     <GlassButton onClick={() => onContact(pet)} className="text-[10px] uppercase tracking-[0.2em] font-black" variant="primary">
                        {t('contactOwnerButton')}
                     </GlassButton>
                </div>
            </div>
        </GlassCard>
    );
});

export const LostPetsCenter: React.FC<LostPetsCenterProps> = ({ lostPets, onContactOwner, onViewPet, onOpenScanner, goBack, currentUser, isLoading }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterBreed, setFilterBreed] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [aiFilters, setAiFilters] = useState<SearchFilters | null>(null);
  const [rankedPets, setRankedPets] = useState<PetProfile[]>(lostPets);
  const [isRanking, setIsRanking] = useState(false);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateRanking = async () => {
        const hasFilters = filterBreed || filterAge || filterLocation || (aiFilters && Object.keys(aiFilters).length > 0);
        if (hasFilters) setIsRanking(true);
        
        const filters: SearchFilters = {
            breed: filterBreed,
            age: filterAge,
            location: filterLocation,
            isLost: true,
            ...aiFilters
        };
        
        const results = await searchService.rankPets(lostPets, filters);
        setRankedPets(results);
        setIsRanking(false);

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
  }, [lostPets, filterBreed, filterAge, filterLocation, aiFilters]);

  const uniqueBreeds = useMemo(() => [...new Set(lostPets.map(p => p.breed))], [lostPets]);

  const handleContact = useCallback((pet: PetProfile) => {
    if (!currentUser) {
        addSnackbar(t('loginToContactOwner'), 'error');
        return;
    }
    onContactOwner(pet);
  }, [currentUser, addSnackbar, t, onContactOwner]);

  const handlePetView = useCallback((pet: PetProfile) => {
    console.log("[LostPetsCenter] View Pet triggered:", pet.id);
    analyticsService.trackPetView(pet.id, pet.name, pet.status);
    onViewPet(pet);
  }, [onViewPet]);

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-24 px-6 relative">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-8 border-b border-white/10">
            <div>
                <button onClick={goBack} className="text-primary hover:text-primary/80 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                                    {t('homeButton')}
                                
                                                </button>
                                
                                                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{t('showLostPets')}</h1>
                                
                                                <p className="text-lg text-slate-200 mt-2 max-w-2xl drop-shadow-md font-medium">{t('missingPetsMapDesc')}</p>
            </div>

            <div role="group" aria-label="View selection" className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </button>
            </div>
            
            <GlassButton 
                onClick={onOpenScanner}
                variant="secondary" 
                className="!py-2 !px-4 text-[10px] font-black uppercase tracking-widest border-primary/20"
            >
                {t('aiScannerButton')} ⚡
            </GlassButton>
        </div>

        {/* Smart AI Search */}
        <div className="pb-4">
            <SmartSearchBar onSearch={setAiFilters} />
            {(aiFilters || filterBreed || filterAge || filterLocation) && (
                <div className="flex justify-center mt-4 gap-4">
                    <button 
                        onClick={() => {
                            setAiFilters(null);
                            setFilterBreed('');
                            setFilterAge('');
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

        {/* Standard Filters */}
        <div className="flex flex-wrap gap-4 items-center">
            <select 
                value={filterBreed} 
                onChange={(e) => setFilterBreed(e.target.value)}
                className="bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none backdrop-blur-md"
            >
                <option value="">{t('dashboard:adoption.allBreeds')}</option>
                {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <input 
                type="text"
                placeholder={t('filterByLocationPlaceholder')}
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="bg-slate-900/50 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none backdrop-blur-md"
            />

            <div className="ml-auto text-sm text-slate-400 font-mono">
                {t('filteredResultsCount', { count: rankedPets.length })}
            </div>
        </div>

        {/* Content Area */}
        {isLoading || isRanking ? (
            <GridSkeleton variant="card" count={6} />
        ) : rankedPets.length > 0 ? (
            <>
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                        {rankedPets.map(pet => (
                            <LostPetCard key={pet.id} pet={pet} onView={handlePetView} onContact={handleContact} explanation={explanations[pet.id]} />
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="space-y-4 animate-fade-in">
                        {rankedPets.map(pet => (
                            <LostPetCard key={pet.id} pet={pet} mode="list" onView={handlePetView} onContact={handleContact} explanation={explanations[pet.id]} />
                        ))}
                    </div>
                )}

                {viewMode === 'map' && (
                    <div className="h-[600px] w-full rounded-3xl overflow-hidden border border-white/10 animate-fade-in">
                        <Suspense fallback={<DashboardSkeleton />}>
                            <MissingPetsMap lostPets={rankedPets} adoptablePets={[]} onContactOwner={handleContact} hideAdoptableToggle={true} initialShowAdoptable={false} />
                        </Suspense>
                    </div>
                )}
            </>
        ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <span className="text-6xl mb-4 block">📡</span>
                <p className="text-xl font-bold text-white">{t('noPetsLostWarning')}</p>
                <button onClick={() => { setFilterBreed(''); setFilterLocation(''); setAiFilters(null); }} className="mt-6 text-primary hover:underline font-bold uppercase tracking-widest text-xs">
                    {t('resetFiltersButton')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
