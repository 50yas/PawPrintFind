
import React, { useState, useEffect, useMemo } from 'react';
import { PetProfile, MatchResult, VetClinic, Geolocation } from '../types';
import { analyzeImageForDescription, comparePets, findNearbyVets, textToSpeech } from '../services/geminiService';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSnackbar } from '../contexts/SnackbarContext';
import { LoadingSpinner } from './LoadingSpinner';
import { playAudio } from '../services/audioService';
import { useTranslations } from '../hooks/useTranslations';
import { MissingPetsMap } from './MissingPetsMap';
import { GlassCard } from './ui/GlassCard';
import { MapSidebarSkeleton, Skeleton } from './ui/SkeletonLoader';
import { CinematicImage } from './ui/CinematicImage';

interface FoundPetProps {
  lostPets: PetProfile[];
  partnerVets: VetClinic[];
  onContactOwner: (pet: PetProfile) => void;
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

const MatchResultCard: React.FC<{ result: MatchResult, onSpeak: (text:string) => void, onContactOwner: (pet: PetProfile) => void }> = ({ result, onSpeak, onContactOwner }) => {
    const { t } = useTranslations();
    const scoreColor = result.score > 75 ? 'bg-green-500' : result.score > 50 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
        <div className="bg-card rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg border border-border">
            <div className="md:flex">
                <div className="md:flex-shrink-0 relative w-full md:w-48 min-h-[200px]">
                    <CinematicImage src={result.pet.photos[0]?.url} alt={result.pet.name} className="w-full h-full object-cover" />
                    <div className="absolute top-0 left-0 bg-black/50 p-2">
                        <span className={`text-sm font-bold px-2 py-1 rounded text-white ${scoreColor}`}>
                            {result.score}% Match
                        </span>
                    </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="uppercase tracking-wide text-xs text-primary font-bold mb-1">{result.pet.breed}</div>
                            <h3 className="text-2xl leading-tight font-bold text-card-foreground">{result.pet.name}</h3>
                        </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground italic mb-4 bg-muted/50 p-3 rounded-lg border-l-4 border-primary">
                        "{result.reasoning}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                        {result.keyMatches && result.keyMatches.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                <h4 className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center mb-2 uppercase tracking-wider">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    Key Matches
                                </h4>
                                <ul className="text-xs space-y-1 text-green-800 dark:text-green-300/80 list-disc pl-4">
                                    {result.keyMatches.map((m, i) => <li key={i}>{m}</li>)}
                                </ul>
                            </div>
                        )}
                        
                        {result.discrepancies && result.discrepancies.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center mb-2 uppercase tracking-wider">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    Differences
                                </h4>
                                <ul className="text-xs space-y-1 text-orange-800 dark:text-orange-300/80 list-disc pl-4">
                                    {result.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className="bg-muted px-6 py-3 flex justify-between items-center border-t border-border">
                 <button onClick={() => onSpeak(t('audioReport', { petName: result.pet.name, score: result.score, reasoning: result.reasoning }))}
                  className="text-xs md:text-sm text-primary hover:brightness-125 font-semibold flex items-center space-x-1 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a4 4 0 118 0v1.393a.75.75 0 01-1.5 0V10a2.5 2.5 0 10-5 0v.5a.75.75 0 01-1.5 0V10z" /><path fillRule="evenodd" d="M3.75 8a.75.75 0 01.75.75v1.5a2 2 0 104 0v-1.5A.75.75 0 0110 8a.75.75 0 01.75.75v1.5a3.5 3.5 0 11-7 0v-1.5A.75.75 0 013.75 8z" clipRule="evenodd" /></svg>
                  <span>{t('readReportAloudButton')}</span>
                </button>
                 <button onClick={() => onContactOwner(result.pet)} className="btn btn-primary !py-1.5 !px-4 text-sm shadow-md">{t('contactOwnerButton')}</button>
            </div>
        </div>
    );
};


export const FoundPet: React.FC<FoundPetProps> = ({ lostPets, partnerVets, onContactOwner, isLoading }) => {
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
        const audioData = await textToSpeech(text);
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
      const foundPetDesc = await analyzeImageForDescription(photo);
      setStatus(t('statusFindingVets'));
      const vets = await findNearbyVets(location);
      setNearbyVetsInfo(vets);
      setStatus(t('statusComparing', { count: filteredLostPets.length }));
      
      const comparisonPromises = filteredLostPets.map(lostPet => 
        comparePets(foundPetDesc, lostPet).then(res => ({ 
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
            <div className="bg-muted/50 p-1 rounded-full flex gap-1 border border-border">
                <button 
                    onClick={() => setMode('map')} 
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'map' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Explorer Map
                </button>
                <button 
                    onClick={() => setMode('scan')} 
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'scan' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    AI Scanner
                </button>
            </div>
        </div>

      {mode === 'map' && (
          <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">{t('missingPetsMapTitle')}</h2>
                  <p className="text-muted-foreground">{t('missingPetsMapDesc')}</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
                  <div className="lg:col-span-3 relative rounded-3xl overflow-hidden shadow-2xl border border-white/20">
                      <MissingPetsMap lostPets={lostPets} />
                      
                      {/* Floating Action Button for Scan */}
                      <div className="absolute bottom-6 right-6 z-[1000]">
                          <button 
                            onClick={() => setMode('scan')}
                            className="btn btn-primary !rounded-full !px-6 !py-4 shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {t('foundPetButton')}
                          </button>
                      </div>
                  </div>

                  <GlassCard className="lg:col-span-1 flex flex-col border-white/10 bg-white/5 overflow-hidden">
                      <div className="p-4 border-b border-white/10 bg-white/5">
                          <h3 className="text-sm font-black uppercase tracking-widest text-white">Active Alerts</h3>
                      </div>
                      <div className="flex-grow overflow-y-auto custom-scrollbar">
                          {isLoading ? (
                              <MapSidebarSkeleton />
                          ) : lostPets.length > 0 ? (
                              <div className="p-2 space-y-2">
                                  {lostPets.map(pet => (
                                      <div key={pet.id} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group">
                                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                              <CinematicImage src={pet.photos[0]?.url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          </div>
                                          <div className="flex flex-col justify-center min-w-0">
                                              <h4 className="text-xs font-black text-white uppercase truncate">{pet.name}</h4>
                                              <p className="text-[10px] text-primary font-mono uppercase truncate">{pet.breed}</p>
                                              <p className="text-[9px] text-red-400 font-bold uppercase mt-1 animate-pulse">Missing</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="p-8 text-center">
                                  <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest">No active alerts in this area</p>
                              </div>
                          )}
                      </div>
                  </GlassCard>
              </div>
          </div>
      )}

      {mode === 'scan' && (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
            <button onClick={() => setMode('map')} className="text-sm text-muted-foreground hover:text-primary mb-4 flex items-center gap-1">
                &larr; Back to Map
            </button>
            <h2 className="text-3xl font-bold mb-4 text-center text-card-foreground">{t('foundPetTitle')}</h2>
            <p className="text-muted-foreground mb-6 text-center">{t('foundPetDesc')}</p>
            <div className="flex flex-col items-center">
                {photoPreview ? (
                <div className="mb-4 relative group">
                    <img src={photoPreview} alt={t('foundPetAlt')} className="rounded-lg shadow-md max-h-64 border-4 border-white" />
                    <label htmlFor="photo-upload-found" className="absolute -bottom-4 left-1/2 -translate-x-1/2 cursor-pointer btn btn-primary !py-2 !px-4 text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">{t('changePhotoButton')}</label>
                </div>
                ) : (<label htmlFor="photo-upload-found" className="mb-4 w-full cursor-pointer flex justify-center px-6 py-10 border-2 border-border border-dashed rounded-xl hover:border-primary transition-colors bg-muted/30"><div className="space-y-1 text-center"><svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg><div className="flex text-sm text-muted-foreground"><p className="pl-1 font-semibold text-primary">{t('uploadPhotoPrompt')}</p></div></div></label>)}
            </div>
            <input type="file" id="photo-upload-found" accept="image/*" onChange={handlePhotoChange} className="sr-only"/>
            
            {/* Advanced Filters Section */}
            <div className="mt-6 border-t border-border pt-4">
                <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors mx-auto mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    {t('searchFiltersTitle')}
                </button>
                
                {showFilters && (
                    <div className="bg-muted/50 p-4 rounded-xl space-y-4 animate-fade-in border border-border">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">{t('filterBreedLabel')}</label>
                                <input 
                                    type="text" 
                                    value={filterBreed} 
                                    onChange={(e) => setFilterBreed(e.target.value)} 
                                    className="input-base text-sm" 
                                    placeholder="e.g. Labrador"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">{t('filterColorLabel')}</label>
                                <input 
                                    type="text" 
                                    value={filterColor} 
                                    onChange={(e) => setFilterColor(e.target.value)} 
                                    className="input-base text-sm" 
                                    placeholder="e.g. Black"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">{t('filterSizeLabel')}</label>
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
                                <label className="block text-xs font-bold text-muted-foreground mb-1">{t('filterRadiusLabel')}: {filterRadius} {t('kmUnit')}</label>
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
                            <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline mr-4">{t('resetFiltersButton')}</button>
                        </div>
                    </div>
                )}
                {lostPets.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        {t('filteredResultsCount', { count: filteredLostPets.length })}
                    </p>
                )}
            </div>

            {geoError && <p className="text-sm text-red-600 mt-4 text-center">{t('locationError', { error: geoError })}</p>}
            <button onClick={handleSearch} disabled={isSearching || !photo || geoLoading} className="mt-6 w-full btn btn-primary !bg-green-600 hover:!bg-green-700 text-lg flex items-center justify-center shadow-green-500/20 shadow-lg transition-transform active:scale-95">{isSearching ? <LoadingSpinner /> : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>{t('applyFiltersButton')}</>)}</button>
            {isSearching && <p className="mt-4 text-primary animate-pulse text-sm font-medium text-center">{status}</p>}
        </div>
        {results.length > 0 && (<div className="space-y-6 fade-in-down"><h3 className="text-2xl font-bold text-center text-foreground">{t('potentialMatchesTitle')}</h3>{results.map((result) => <MatchResultCard key={result.pet.id} result={result} onSpeak={handleSpeak} onContactOwner={onContactOwner} />)}</div>)}
        {(nearbyVetsInfo || partnerVets.length > 0) && (<div className="bg-card p-6 sm:p-8 rounded-xl shadow-md"><h3 className="text-2xl font-bold mb-4 text-card-foreground">{t('nearbyHelpTitle')}</h3><div className="border-b border-border"><nav className="-mb-px flex space-x-6" aria-label="Tabs"><button onClick={() => setActiveTab('partners')} aria-selected={activeTab === 'partners'} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'partners' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>{t('partnerVetsTab')}</button><button onClick={() => setActiveTab('google')} aria-selected={activeTab === 'google'} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'google' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>{t('googleMapsTab')}</button></nav></div><div className="pt-6">{activeTab === 'partners' && (<div>{partnerVets.length > 0 ? (<ul className='list-disc pl-5 mt-2 space-y-2'>{partnerVets.map((vet, i) => (<li key={i} className="text-muted-foreground"><strong className="text-card-foreground">{vet.name}</strong> <br/> {vet.address} ({vet.phone})</li>))}</ul>) : <p className="text-muted-foreground">{t('noPartnerVets')}</p>}</div>)}{activeTab === 'google' && (<div>{nearbyVetsInfo ? (<div className="prose prose-teal dark:prose-invert max-w-none mt-2 text-card-foreground"><p>{nearbyVetsInfo.text}</p>{nearbyVetsInfo.places.length > 0 && (<ul className="text-muted-foreground">{nearbyVetsInfo.places.map((place, index) => (place.maps && <li key={index}><a href={place.maps.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{place.maps.title}</a></li>))}</ul>)}</div>) : <p className="text-muted-foreground">{t('noGoogleMapsVets')}</p>}</div>)}</div></div>)}
      </div>
      )}
    </div>
  );
};
