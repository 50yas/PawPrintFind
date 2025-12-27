import React, { useState } from 'react';
import { VetClinic } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { findNearbyVets, findVetsByQuery } from '../services/geminiService';
import { useTranslations } from '../hooks/useTranslations';
import { LoadingSpinner } from './LoadingSpinner';

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
        <div className="bg-card p-4 rounded-lg shadow-md border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                {isPartner && <p className="text-xs font-bold text-primary uppercase mb-1">{t('partnerVetsSectionTitle')}</p>}
                <h3 className="font-bold text-card-foreground">{clinic.name}</h3>
                <p className="text-sm text-muted-foreground">{clinic.address}</p>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-2">
                {mode === 'search' && clinic.phone && (
                    <a href={`tel:${clinic.phone}`} className="w-full sm:w-auto text-center block btn !bg-green-600 hover:!bg-green-700 !text-white text-sm">
                        {t('callVetButton')}
                    </a>
                )}
                 {mode === 'linking' && onSendRequest && (
                    <button onClick={() => onSendRequest(clinic.vetEmail)} className="w-full sm:w-auto text-center block btn btn-primary text-sm">
                        {t('sendRequestButton')}
                    </button>
                )}
                {gmapsUri && (
                    <a href={gmapsUri} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center block btn btn-secondary text-sm">View on Map</a>
                )}
            </div>
        </div>
    )
}


export const FindVet: React.FC<FindVetProps> = ({ partnerVets, goBack, mode, onSendRequest }) => {
  const { t } = useTranslations();
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
        const results = await findVetsByQuery(query);
        setGoogleVets(results.places);
    } catch (err) {
        console.error("Failed to fetch vets from Google Maps", err);
        alert(t('genericError'));
    }
    setIsLoading(false);
  };

  const handleSearchNearMe = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setGoogleVets([]);
    if(location) {
        try {
            const results = await findNearbyVets(location);
            setGoogleVets(results.places);
        } catch (err) { console.error(err); alert(t('genericError')); }
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
                const results = await findNearbyVets(location);
                setGoogleVets(results.places);
            } catch (err) { console.error(err); alert(t('genericError'));}
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
            <h2 className="text-3xl font-bold text-foreground">{t('findVetTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('findVetDesc')}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-md">
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
              <button type="button" onClick={handleSearchNearMe} className="btn btn-secondary p-3" disabled={geoLoading || isLoading} title={t('searchNearMeButton')}>
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

        {hasSearched && !isLoading && !geoLoading && !allVetsFound && <p className="text-center text-muted-foreground">{t('noVetsFound')}</p>}

        {(hasSearched || mode === 'linking') && (
            <div className="space-y-6">
                {partnerVets.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">{t('partnerVetsSectionTitle')}</h3>
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
                        <h3 className="text-xl font-bold text-foreground border-b border-border pb-2">{t('googleMapsSectionTitle')}</h3>
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