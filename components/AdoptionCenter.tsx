import React, { useState, useMemo, lazy, Suspense } from 'react';
import { PetProfile, User } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { CinematicImage, GlassCard, GlassButton } from './ui';
import { CardSkeleton, MapSidebarSkeleton } from './ui/SkeletonLoader';

const AdoptionMap = lazy(() => import('./AdoptionMap').then(m => ({ default: m.AdoptionMap })));

interface AdoptionCenterProps {
  petsForAdoption: PetProfile[];
  onInquire: (pet: PetProfile) => void;
  goBack: () => void;
  currentUser: User | null;
  isLoading?: boolean;
}

type ViewMode = 'grid' | 'list' | 'carousel' | 'map';

export const AdoptionCenter: React.FC<AdoptionCenterProps> = ({ petsForAdoption, onInquire, goBack, currentUser, isLoading }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterBreed, setFilterBreed] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const filteredPets = useMemo(() => {
    return petsForAdoption.filter(pet => {
        if (filterBreed && !pet.breed.toLowerCase().includes(filterBreed.toLowerCase())) return false;
        if (filterAge && !pet.age.includes(filterAge)) return false;
        return true;
    });
  }, [petsForAdoption, filterBreed, filterAge]);

  const uniqueBreeds = useMemo(() => [...new Set(petsForAdoption.map(p => p.breed))], [petsForAdoption]);
  const uniqueAges = useMemo(() => [...new Set(petsForAdoption.map(p => p.age))], [petsForAdoption]);

  const handleInquire = (pet: PetProfile) => {
    if (!currentUser) {
        addSnackbar(t('loginToAdoptWarning'), 'error');
        return;
    }
    onInquire(pet);
  }

  const nextSlide = () => setCarouselIndex(prev => (prev + 1) % filteredPets.length);
  const prevSlide = () => setCarouselIndex(prev => (prev - 1 + filteredPets.length) % filteredPets.length);

  const AdoptionCard: React.FC<{ pet: PetProfile; mode?: ViewMode }> = ({ pet, mode = 'grid' }) => (
        <GlassCard variant="interactive" className={`flex ${mode === 'list' ? 'flex-row h-48' : 'flex-col h-full'} border-white/10 bg-white/10 backdrop-blur-2xl overflow-hidden group shadow-2xl`}>
            <div className={`${mode === 'list' ? 'w-48' : 'w-full h-64'} relative overflow-hidden`}>
                <CinematicImage className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={pet.photos[0]?.url} alt={pet.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <span className="text-white text-xs font-bold uppercase tracking-widest drop-shadow-md">{pet.breed}</span>
                </div>
            </div>
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md">{pet.name}</h2>
                                <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mt-1 drop-shadow-sm">{pet.breed}</p>
                            </div>                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md">{pet.age}</span>
                </div>
                
                <p className="text-sm text-slate-200 mt-4 flex-grow leading-relaxed line-clamp-3 drop-shadow-sm">{pet.behavior}</p>
                
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                     <div className="flex gap-2">
                        {pet.weight && <span className="bg-white/10 text-slate-300 px-2 py-1 rounded text-[10px] uppercase font-bold border border-white/5">{pet.weight}</span>}
                     </div>
                     <GlassButton onClick={() => handleInquire(pet)} className="text-[10px] uppercase tracking-[0.2em] font-black shadow-lg" variant="primary">
                        {t('inquireToAdoptButton')}
                     </GlassButton>
                </div>
            </div>
        </GlassCard>
    );
    
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
            
                            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-xl">{t('adoptionCenterTitle')}</h1>
            
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
            
            
            
                    {/* Filters */}
            
                    <div className="flex flex-wrap gap-4 items-center">
            
                        <div className="flex flex-col gap-1">
            
                            <label htmlFor="breed-filter" className="sr-only">Filter by breed</label>
            
                            <select 
            
                                id="breed-filter"
            
                                value={filterBreed} 
            
                                onChange={(e) => setFilterBreed(e.target.value)}
            
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            
                            >
            
                                <option value="">All Breeds</option>
            
                                {uniqueBreeds.map(b => <option key={b} value={b}>{b}</option>)}
            
                            </select>
            
                        </div>
            
                        
            
                        <div className="flex flex-col gap-1">
            
                            <label htmlFor="age-filter" className="sr-only">Filter by age</label>
            
                            <select 
            
                                id="age-filter"
            
                                value={filterAge} 
            
                                onChange={(e) => setFilterAge(e.target.value)}
            
                                className="bg-card border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            
                            >
            
                                <option value="">All Ages</option>
            
                                {uniqueAges.map(a => <option key={a} value={a}>{a}</option>)}
            
                            </select>
            
                        </div>
            
                        
            
                        <div className="ml-auto text-sm text-muted-foreground font-mono">
            
                            {filteredPets.length} matches found
            
                        </div>
            
                    </div>
        
        {/* Content */}
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
            </div>
        ) : filteredPets.length > 0 ? (
            <>
                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                        {filteredPets.map(pet => (
                            <AdoptionCard key={pet.id} pet={pet} />
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="space-y-4 animate-fade-in">
                        {filteredPets.map(pet => (
                            <AdoptionCard key={pet.id} pet={pet} mode="list" />
                        ))}
                    </div>
                )}

                {viewMode === 'carousel' && (
                    <div className="relative h-[600px] w-full flex items-center justify-center animate-fade-in">
                        <button onClick={prevSlide} className="absolute left-4 z-20 p-4 rounded-full bg-black/50 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        
                        <div className="w-full max-w-4xl h-full">
                            <AdoptionCard pet={filteredPets[carouselIndex]} mode="grid" />
                        </div>

                        <button onClick={nextSlide} className="absolute right-4 z-20 p-4 rounded-full bg-black/50 hover:bg-primary text-white transition-all backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {filteredPets.map((_, idx) => (
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
                            <AdoptionMap adoptablePets={filteredPets} onAdoptMe={handleInquire} isLoading={isLoading} />
                        </Suspense>
                    </div>
                )}
            </>
        ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4">🐾</span>
                <p className="text-xl font-bold text-foreground">No matching pets found</p>
                <p className="text-muted-foreground mt-2">Try adjusting your filters to see more adoptable friends.</p>
                <button onClick={() => { setFilterBreed(''); setFilterAge(''); }} className="mt-6 text-primary hover:underline">Clear all filters</button>
            </div>
        )}
      </div>
    </div>
  );
};