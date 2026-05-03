import React, { useState } from 'react';
import { VetClinic } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSnackbar } from '../contexts/SnackbarContext';
import { aiBridgeService } from '../services/aiBridgeService';
import { useTranslations } from '../hooks/useTranslations';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';

interface FindVetProps {
  partnerVets: VetClinic[];
  goBack: () => void;
  mode: 'search' | 'linking';
  onSendRequest?: (vetEmail: string) => void;
}

const VetCard: React.FC<{ 
    clinic: VetClinic;
    isPartner?: boolean; 
    gmapsUri?: string;
    mode: 'search' | 'linking';
    onSendRequest?: (vetEmail: string) => void;
}> = ({ clinic, isPartner, gmapsUri, mode, onSendRequest }) => {
    const { t } = useTranslations();
    return (
        <GlassCard variant="interactive" className="group p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6 relative overflow-hidden border-white/10 bg-white/5">
            {/* HUD Scanning Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(45,212,191,0.5)] animate-[scan_3s_linear_infinite]"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2dd4bf0a_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf0a_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>
                
                {/* Data readout simulation */}
                <div className="absolute bottom-2 right-4 flex gap-3">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-tighter">Lat: 41.8902</span>
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-tighter">Lng: 12.4922</span>
                    <span className="text-[8px] font-mono text-emerald-500/60 uppercase tracking-tighter">Verified_Link: OK</span>
                </div>
            </div>

            <div className="relative z-20 flex-1 min-w-0">
                {isPartner && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{t('partnerVetsSectionTitle')}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#2dd4bf]"></span>
                    </div>
                )}
                <h3 className="font-bold text-white text-xl tracking-tight group-hover:text-primary transition-colors truncate">{clinic.name}</h3>
                <p className="text-sm text-slate-400 font-medium mt-1 line-clamp-2">{clinic.address}</p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3 relative z-20">
                {mode === 'search' && clinic.phone && (
                    <GlassButton 
                        variant="primary" 
                        className="w-full sm:w-auto !py-2 !px-5 text-[10px] uppercase tracking-widest"
                        onClick={() => window.open(`tel:${clinic.phone}`)}
                    >
                        {t('callVetButton')}
                    </GlassButton>
                )}
                 {mode === 'linking' && onSendRequest && (
                    <GlassButton 
                        variant="primary" 
                        className="w-full sm:w-auto !py-2 !px-5 text-[10px] uppercase tracking-widest"
                        onClick={() => onSendRequest(clinic.vetEmail)}
                    >
                        {t('sendRequestButton')}
                    </GlassButton>
                )}
                {gmapsUri && (
                    <GlassButton 
                        variant="secondary" 
                        className="w-full sm:w-auto !py-2 !px-5 text-[10px] uppercase tracking-widest"
                        onClick={() => window.open(gmapsUri, '_blank')}
                    >
                        {t('mapLabel')}
                    </GlassButton>
                )}
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </GlassCard>
    )
}


export const FindVet: React.FC<FindVetProps> = ({ partnerVets, goBack, mode, onSendRequest }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
  const [googleVets, setGoogleVets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(mode === 'linking'); // Show partners immediately in linking mode

  const handleSearch = async (query: string) => {
    if (!query) return;
    setIsLoading(true);
    setHasSearched(true);
    setGoogleVets([]);
    try {
        const results = await aiBridgeService.findVetsByQuery(query);
        setGoogleVets(results.places);
    } catch (err) {
        console.error("Failed to fetch vets from Google Maps", err);
        addSnackbar(t('genericError'), 'error');
    }
    setIsLoading(false);
  };

  const handleSearchNearMe = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setGoogleVets([]);
    if(location) {
        try {
            const results = await aiBridgeService.findNearbyVets(location as any);
            setGoogleVets(results.places);
        } catch (err) { console.error(err); addSnackbar(t('genericError'), 'error'); }
    } else {
        getLocation();
    }
    setIsLoading(false);
  };
  
  React.useEffect(() => {
    const fetchVets = async () => {
        if (location && hasSearched) {
            setIsLoading(true);
            try {
                const results = await aiBridgeService.findNearbyVets(location as any);
                setGoogleVets(results.places);
            } catch (err) { console.error(err); addSnackbar(t('genericError'), 'error');}
            setIsLoading(false);
        }
    };
    fetchVets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const allVetsFound = partnerVets.length > 0 || googleVets.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
        <button onClick={goBack} className="text-primary hover:brightness-125 font-semibold">&larr; {t('backButton')}</button>

        <div className="text-center">
            <h2 className="text-3xl font-bold text-white">{t('findVetTitle')}</h2>
            <p className="text-slate-400 mt-2">{t('findVetDesc')}</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl shadow-md border border-white/10 relative">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchVetPlaceholder')}
              className="input-base flex-grow"
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-grow justify-center" disabled={isLoading}>{isLoading ? <LoadingSpinner /> : t('searchButton')}</button>
              <button type="button" onClick={handleSearchNearMe} className="glass-btn p-3" disabled={geoLoading || isLoading} title={t('searchNearMeButton')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </form>
          {geoError && <p className="text-center text-red-600 text-sm mt-2">{t('locationError', { error: geoError })}</p>}
        </div>

        {(isLoading || geoLoading) && (
            <div className="flex justify-center pt-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )}

        {hasSearched && !isLoading && !geoLoading && !allVetsFound && <p className="text-center text-slate-400">{t('noVetsFound')}</p>}

        {(hasSearched || mode === 'linking') && (
            <div className="space-y-6">
                {partnerVets.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-3">{t('partnerVetsSectionTitle')}<span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span></h3>
                        {partnerVets.map(vet => (
                            <VetCard 
                                key={vet.vetEmail}
                                clinic={vet}
                                isPartner
                                mode={mode}
                                onSendRequest={onSendRequest}
                            />
                        ))}
                    </div>
                )}

                {googleVets.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-3">{t('googleMapsSectionTitle')}<span className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent"></span></h3>
                         {googleVets.filter(v => v.maps).map((vet, index) => (
                            <VetCard 
                                key={index}
                                clinic={{ name: vet.maps.title, address: vet.maps.address || 'Address not specified', phone: vet.maps.phone || '', vetEmail: '' }}
                                gmapsUri={vet.maps.uri}
                                mode={mode}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};