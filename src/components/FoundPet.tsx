import React, { useState, useEffect, useMemo } from 'react';
import { PetProfile, MatchResult, VetClinic, Geolocation } from '../types';
import { aiBridgeService } from '../services/aiBridgeService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LoadingSpinner } from './LoadingSpinner';
import { playAudio } from '../services/audioService';
import { useTranslations } from '../hooks/useTranslations';
import { MissingPetsMap } from './MissingPetsMap';
import { GlassCard } from './ui/GlassCard';
import { MapSidebarSkeleton, Skeleton } from './ui/SkeletonLoader';
import { CinematicImage } from './ui/CinematicImage';
import { EmojiSwitcher } from './EmojiSwitcher';

interface FoundPetProps {
  lostPets: PetProfile[];
  partnerVets: VetClinic[];
  onContactOwner: (pet: PetProfile) => void;
  onViewPet: (pet: PetProfile) => void;
  isLoading?: boolean;
}

// Calculate distance between two coordinates in km using Haversine formula
export const calculateDistance = (loc1: Geolocation, loc2: Geolocation): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(loc2.latitude - loc1.latitude);
    const dLon = deg2rad(loc2.longitude - loc1.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.latitude)) * Math.cos(deg2rad(loc2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
}

const MatchResultCard: React.FC<{ result: MatchResult, onSpeak: (text:string) => void, onContactOwner: (pet: PetProfile) => void, onViewPet: (pet: PetProfile) => void }> = ({ result, onSpeak, onContactOwner, onViewPet }) => {
    const { t } = useTranslations();
    const scoreColor = result.score > 75 ? 'bg-green-500' : result.score > 50 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] border border-white/10 scan-hover">
            <div className="md:flex cursor-pointer active:scale-[0.98] transition-transform" onPointerDown={() => onViewPet(result.pet)}>
                <div className="md:flex-shrink-0 relative w-full md:w-48 min-h-[200px]">
                    <CinematicImage src={result.pet.photos[0]?.url} alt={result.pet.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                        <span className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg text-white backdrop-blur-md ${scoreColor}`}>
                            {result.score}{t('matchPercentage')}
                        </span>
                    </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="uppercase tracking-widest text-[10px] text-primary font-black mb-1 font-mono">{result.pet.breed}</div>
                            <h3 className="text-2xl leading-tight font-bold text-white">{result.pet.name}</h3>
                        </div>
                    </div>

                    <p className="text-sm text-slate-300 italic mb-4 bg-white/5 p-3 rounded-xl border-l-2 border-primary">
                        "{result.reasoning}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                        {result.keyMatches && result.keyMatches.length > 0 && (
                            <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                                <h4 className="text-xs font-bold text-green-400 flex items-center mb-2 uppercase tracking-wider">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    {t('keyMatchesTitle')}
                                </h4>
                                <ul className="text-xs space-y-1 text-green-300/80 list-disc pl-4">
                                    {result.keyMatches.map((m: string, i: number) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        )}

                        {result.discrepancies && result.discrepancies.length > 0 && (
                            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                                <h4 className="text-xs font-bold text-orange-400 flex items-center mb-2 uppercase tracking-wider">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    {t('differencesTitle')}
                                </h4>
                                <ul className="text-xs space-y-1 text-orange-300/80 list-disc pl-4">
                                    {result.discrepancies.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className="bg-black/30 backdrop-blur-sm px-6 py-3 flex justify-between items-center border-t border-white/10">
                 <button onClick={(e) => { e.stopPropagation(); onSpeak(t('audioReport', { petName: result.pet.name, score: result.score, reasoning: result.reasoning })); }}
                  className="text-xs md:text-sm text-primary hover:text-white font-bold flex items-center space-x-1 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a4 4 0 118 0v1.393a.75.75 0 01-1.5 0V10a2.5 2.5 0 10-5 0v.5a.75.75 0 01-1.5 0V10z" /><path fillRule="evenodd" d="M3.75 8a.75.75 0 01.75.75v1.5a2 2 0 104 0v-1.5A.75.75 0 0110 8a.75.75 0 01.75.75v1.5a3.5 3.5 0 11-7 0v-1.5A.75.75 0 013.75 8z" clipRule="evenodd" /></svg>
                  <span>{t('readReportAloudButton')}</span>
                </button>
                 <button onClick={(e) => { e.stopPropagation(); onContactOwner(result.pet); }} className="btn btn-primary !py-1.5 !px-4 text-sm rounded-xl neon-glow-teal">{t('contactOwnerButton')}</button>
            </div>
        </div>
    );
};


export const FoundPet: React.FC<FoundPetProps> = ({ lostPets, partnerVets, onContactOwner, onViewPet, isLoading }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const [mode, setMode] = useState<'map' | 'scan'>('map');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [status, setStatus] = useState(t('statusReady'));
  const [nearbyVetsInfo, setNearbyVetsInfo] = useState<{text: string, places: any[]}|null>(null);
  const [activeTab, setActiveTab] = useState('partners');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [filterBreed, setFilterBreed] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterSize, setFilterSize] = useState<string>('');
  const [filterRadius, setFilterRadius] = useState<number>(50); // Default 50km

  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();

  useEffect(() => {
    getLocation();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setResults([]);
      setNearbyVetsInfo(null);
    }
  };
  
  const handleSpeak = async (text: string) => {
    try {
        setStatus(t('statusGeneratingAudio'));
        const audioData = await aiBridgeService.textToSpeech(text);
        setStatus(t('statusPlayingAudio'));
        await playAudio(audioData);
        setStatus(t('statusAudioFinished'));
    } catch (error) {
        console.error("TTS Error:", error);
        setStatus(t('statusAudioError'));
        addSnackbar(t('audioPlaybackError'), 'error');
    }
  };

  const resetFilters = () => {
      setFilterBreed('');
      setFilterColor('');
      setFilterSize('');
      setFilterRadius(50);
  }

  // Memoized Filter Logic
  const filteredLostPets = useMemo(() => {
      return lostPets.filter(pet => {
          // 1. Breed Filter
          if (filterBreed && !pet.breed.toLowerCase().includes(filterBreed.toLowerCase())) return false;
          
          // 2. Color Filter (Check field or fallback to AI Code or description if implemented)
          if (filterColor && !pet.color?.toLowerCase().includes(filterColor.toLowerCase())) {
              // Fallback to searching in AI Identity Code
              if (!pet.aiIdentityCode?.toLowerCase().includes(filterColor.toLowerCase())) return false;
          }

          // 3. Size Filter
          if (filterSize && pet.size !== filterSize) return false;

          // 4. Radius Filter
          if (location && pet.lastSeenLocation) {
              const distance = calculateDistance(location, pet.lastSeenLocation);
              if (distance > filterRadius) return false;
          }

          return true;
      });
  }, [lostPets, filterBreed, filterColor, filterSize, filterRadius, location]);

  const handleSearch = async () => {
    if (!photo) { addSnackbar(t('uploadPhotoWarning'), 'info'); return; }
    if (!location) { addSnackbar(t('enableLocationWarning'), 'info'); return; }
    if (filteredLostPets.length === 0) { addSnackbar(t('noPetsLostWarning'), 'info'); return; }

    setIsSearching(true);
    setResults([]);
    setNearbyVetsInfo(null);

    try {
      setStatus(t('statusAnalyzingPhoto'));
      const foundPetDesc = await aiBridgeService.analyzeImageForDescription(photo);
      setStatus(t('statusFindingVets'));
      const vets = await aiBridgeService.findNearbyVets(location as any);
      setNearbyVetsInfo(vets);
      setStatus(t('statusComparing', { count: filteredLostPets.length }));
      
      const comparisonPromises = filteredLostPets.map(lostPet => 
        aiBridgeService.comparePets(foundPetDesc, lostPet).then(res => ({ 
            pet: lostPet, 
            score: res.score, 
            reasoning: res.reasoning,
            keyMatches: res.keyMatches,
            discrepancies: res.discrepancies
        }))
      );
      const allResults = await Promise.all(comparisonPromises);
      setResults(allResults.sort((a, b) => b.score - a.score));
      setStatus(t('statusComplete'));
    } catch (error) {
      console.error('Search failed:', error);
      setStatus(t('statusSearchError'));
      addSnackbar(t('genericError'), 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
            <div className="bg-white/5 backdrop-blur-xl p-1 rounded-full flex gap-1 border border-white/10">
                <button
                    onClick={() => setMode('map')}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'map' ? 'bg-primary text-white shadow-lg shadow-primary/20 neon-glow-teal' : 'text-slate-400 hover:text-white'}`}
                >
                    {t('explorerMapButton')}
                </button>
                <button
                    onClick={() => setMode('scan')}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'scan' ? 'bg-primary text-white shadow-lg shadow-primary/20 neon-glow-teal' : 'text-slate-400 hover:text-white'}`}
                >
                    {t('aiScannerButton')}
                </button>
            </div>
        </div>

      {mode === 'map' && (
          <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">{t('missingPetsMapTitle')}</h2>
                  <p className="text-slate-400">{t('missingPetsMapDesc')}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[500px] lg:h-[600px]">
                  <div className="lg:col-span-3 relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                      <MissingPetsMap lostPets={lostPets} onContactOwner={onContactOwner} onViewPet={onViewPet} />
                      
                      {/* Floating Action Button for Scan */}
                      <div className="absolute bottom-6 right-6 z-[1000]">
                          <EmojiSwitcher 
                            onClick={() => setMode('scan')}
                            className="!w-auto !h-auto !px-6 !py-4 !bg-primary !border-none !rounded-full shadow-xl flex items-center gap-2 hover:scale-105 transition-transform text-white font-bold"
                          >
                              {t('foundPetButton')}
                          </EmojiSwitcher>
                      </div>
                  </div>

                  <GlassCard className="lg:col-span-1 flex flex-col border-white/10 bg-white/5 overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-white/5">
                          <h3 className="text-sm font-black uppercase tracking-widest text-white">{t('activeAlertsTitle')}</h3>
                      </div>
                      <div className="flex-grow overflow-y-auto custom-scrollbar">
                          {isLoading ? (
                              <MapSidebarSkeleton />
                          ) : lostPets.length > 0 ? (
                              <div className="p-2 space-y-2">
                                  {lostPets.map(pet => (
                                      <div key={pet.id} onPointerDown={() => onViewPet(pet)} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group">
                                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                              <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          </div>
                                          <div className="flex flex-col justify-center min-w-0">
                                              <h4 className="text-xs font-black text-white uppercase truncate">{pet.name}</h4>
                                              <p className="text-[10px] text-primary font-mono uppercase truncate">{pet.breed}</p>
                                              <p className="text-[9px] text-red-400 font-bold uppercase mt-1 animate-pulse">{t('statusLost')}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="p-8 text-center">
                                  <p className="text-xs text-slate-400 uppercase font-mono tracking-widest">{t('noAlertsArea')}</p>
                              </div>
                          )}
                      </div>
                  </GlassCard>
              </div>
          </div>
      )}

      {mode === 'scan' && (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            <button onClick={() => setMode('map')} className="text-sm text-slate-400 hover:text-primary mb-4 flex items-center gap-1 transition-colors">
                &larr; {t('backToMap')}
            </button>
            <h2 className="text-3xl font-bold mb-4 text-center text-white">{t('foundPetTitle')}</h2>
            <p className="text-slate-400 mb-6 text-center">{t('foundPetDesc')}</p>
            <div className="flex flex-col items-center">
                {photoPreview ? (
                <div className="mb-4 relative group">
                    <img src={photoPreview} alt={t('foundPetAlt')} className="rounded-2xl shadow-md max-h-64 border-2 border-white/20" />
                    <label htmlFor="photo-upload-found" className="absolute -bottom-4 left-1/2 -translate-x-1/2 cursor-pointer btn btn-primary !py-2 !px-4 text-sm shadow-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">{t('changePhotoButton')}</label>
                </div>
                ) : (<label htmlFor="photo-upload-found" className="mb-4 w-full cursor-pointer flex justify-center px-6 py-10 border-2 border-white/10 border-dashed rounded-2xl hover:border-primary/50 transition-colors bg-white/5 hud-grid-bg"><div className="space-y-1 text-center"><svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg><div className="flex text-sm text-slate-400"><p className="pl-1 font-bold text-primary">{t('uploadPhotoPrompt')}</p></div></div></label>)}
            </div>
            <input type="file" id="photo-upload-found" accept="image/*" onChange={handlePhotoChange} className="sr-only"/>
            
            {/* Advanced Filters Section */}
            <div className="mt-6 border-t border-white/10 pt-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-white transition-colors mx-auto mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    {t('searchFiltersTitle')}
                </button>

                {showFilters && (
                    <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl space-y-4 animate-fade-in border border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('filterBreedLabel')}</label>
                                <input 
                                    type="text" 
                                    value={filterBreed} 
                                    onChange={(e) => setFilterBreed(e.target.value)} 
                                    className="input-base text-sm" 
                                    placeholder={t('breedPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('filterColorLabel')}</label>
                                <input 
                                    type="text" 
                                    value={filterColor} 
                                    onChange={(e) => setFilterColor(e.target.value)} 
                                    className="input-base text-sm" 
                                    placeholder={t('colorPlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('filterSizeLabel')}</label>
                                <select 
                                    value={filterSize} 
                                    onChange={(e) => setFilterSize(e.target.value)} 
                                    className="input-base text-sm"
                                >
                                    <option value="">{t('anyOption')}</option>
                                    <option value="Small">{t('sizeSmall')}</option>
                                    <option value="Medium">{t('sizeMedium')}</option>
                                    <option value="Large">{t('sizeLarge')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('filterRadiusLabel')}: <span className="text-primary font-mono">{filterRadius}</span> {t('kmUnit')}</label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="500" 
                                    step="5" 
                                    value={filterRadius} 
                                    onChange={(e) => setFilterRadius(Number(e.target.value))} 
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-white underline mr-4 transition-colors">{t('resetFiltersButton')}</button>
                        </div>
                    </div>
                )}
                {lostPets.length > 0 && (
                    <p className="text-xs text-center text-slate-400 mt-2 font-mono">
                        {t('filteredResultsCount', { count: filteredLostPets.length })}
                    </p>
                )}
            </div>

            {geoError && <p className="text-sm text-red-600 mt-4 text-center">{t('locationError', { error: geoError })}</p>}
            <button onClick={handleSearch} disabled={isSearching || !photo || geoLoading} className="mt-6 w-full btn btn-primary !bg-green-600 hover:!bg-green-500 text-lg flex items-center justify-center shadow-green-500/30 shadow-lg transition-all active:scale-95 rounded-xl neon-glow-green disabled:opacity-50 disabled:cursor-not-allowed">{isSearching ? <LoadingSpinner /> : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>{t('applyFiltersButton')}</>)}</button>
            {isSearching && <p className="mt-4 text-primary animate-pulse text-sm font-medium text-center">{status}</p>}
        </div>
        {results.length > 0 && (
          <div className="space-y-6 fade-in-down">
            <h3 className="text-2xl font-bold text-center text-white flex items-center justify-center gap-3">
              <span className="status-pulse-green"></span>
              {t('potentialMatchesTitle')}
            </h3>
            {results.map((result) => <MatchResultCard key={result.pet.id} result={result} onSpeak={handleSpeak} onContactOwner={onContactOwner} onViewPet={onViewPet} />)}
          </div>
        )}
        {(nearbyVetsInfo || partnerVets.length > 0) && (
          <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-bold mb-4 text-white">{t('nearbyHelpTitle')}</h3>
            <div className="border-b border-white/10">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('partners')} aria-selected={activeTab === 'partners'} className={`whitespace-nowrap py-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'partners' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('partnerVetsTab')}</button>
                <button onClick={() => setActiveTab('google')} aria-selected={activeTab === 'google'} className={`whitespace-nowrap py-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'google' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}>{t('googleMapsTab')}</button>
              </nav>
            </div>
            <div className="pt-6">
              {activeTab === 'partners' && (
                <div>{partnerVets.length > 0 ? (
                  <ul className='space-y-3'>{partnerVets.map((vet, i) => (
                    <li key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <strong className="text-white font-bold">{vet.name}</strong>
                      <p className="text-slate-400 text-sm mt-1">{vet.address} ({vet.phone})</p>
                    </li>
                  ))}</ul>
                ) : <p className="text-slate-400 text-center py-8">{t('noPartnerVets')}</p>}</div>
              )}
              {activeTab === 'google' && (
                <div>{nearbyVetsInfo ? (
                  <div className="max-w-none mt-2 text-white">
                    <p className="text-slate-300">{nearbyVetsInfo.text}</p>
                    {nearbyVetsInfo.places.length > 0 && (
                      <ul className="space-y-2 mt-4">{nearbyVetsInfo.places.map((place, index) => (
                        place.maps && <li key={index} className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <a href={place.maps.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white font-bold transition-colors">{place.maps.title}</a>
                        </li>
                      ))}</ul>
                    )}
                  </div>
                ) : <p className="text-slate-400 text-center py-8">{t('noGoogleMapsVets')}</p>}</div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};