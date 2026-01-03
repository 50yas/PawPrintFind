
import React, { useState, useEffect } from 'react';
import { VetClinic, Geolocation } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { useSnackbar } from '../contexts/SnackbarContext';
import { findClinicOnGoogleMaps } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface MyClinicProps {
  onSave: (clinic: VetClinic) => void;
  vetEmail: string;
  existingClinic: VetClinic | null;
}

export const MyClinic: React.FC<MyClinicProps> = ({ onSave, vetEmail, existingClinic }) => {
  const { t } = useTranslations();
  const { addSnackbar } = useSnackbar();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<Geolocation | undefined>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any | null>(null);
  
  useEffect(() => {
    if (existingClinic) {
      setName(existingClinic.name);
      setAddress(existingClinic.address);
      setPhone(existingClinic.phone);
      setLocation(existingClinic.location);
    }
  }, [existingClinic]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!searchQuery) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
        const results = await findClinicOnGoogleMaps(searchQuery, "");
        if (results && results.length > 0) {
            setSearchResult(results[0]);
        } else {
            addSnackbar(t('noGoogleMapsVets'), 'info');
        }
    } catch(err) {
        console.error("Maps search failed", err);
        addSnackbar(t('genericError'), 'error');
    }
    setIsSearching(false);
  };

  const handleSyncData = () => {
      if (searchResult) {
          setName(searchResult.title);
          setAddress(searchResult.address || t('addressNotFound'));
          if (searchResult.phone) setPhone(searchResult.phone);
          // If search result has lat/lng from aistudio retrieval tool
          if (searchResult.location) {
              setLocation(searchResult.location);
          } else {
              // Fallback: If map retrieval didn't return coords, we'd ideally geocode here.
              // For now, if we're in 'linking' mode, we'll try to get browser location
              if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(pos => {
                      setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                  });
              }
          }
          setSearchResult(null);
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ vetEmail, name, address, phone, location });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="relative bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 overflow-hidden shadow-2xl">
          <div className="relative z-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">{t('myClinicTitle')}</h2>
              <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">{t('myClinicDesc')}</p>
              
              <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                  <div className="relative flex bg-background rounded-full overflow-hidden shadow-xl">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('searchClinicPlaceholder')}
                        className="flex-grow px-6 py-4 bg-transparent border-none focus:ring-0 text-foreground"
                      />
                      <button type="submit" disabled={isSearching} className="px-8 bg-card hover:bg-muted text-primary font-bold border-l border-border">
                          {isSearching ? <LoadingSpinner /> : t('searchButtonGoogle')}
                      </button>
                  </div>
              </form>
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-3xl border border-white/20 h-fit">
              <form onSubmit={handleSave} className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">{t('clinicNameLabel')}</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base text-lg font-semibold" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">{t('addressLabel')}</label>
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-base resize-none" required />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">{t('phoneLabel')}</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base" required />
                  </div>
                  <div className="pt-4 border-t border-border">
                      <button type="submit" className="w-full btn btn-primary py-3 text-lg shadow-lg">
                          {t('saveClinicButton')}
                      </button>
                  </div>
              </form>
          </div>

          <div className="relative">
              {searchResult ? (
                  <div className="glass-panel p-0 rounded-3xl overflow-hidden border border-white/20 shadow-2xl h-full flex flex-col animate-slide-in-right">
                      <div className="h-48 relative bg-gray-200">
                          <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80" alt="Clinic" className="w-full h-full object-cover"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-6 text-white"><h3 className="text-2xl font-bold">{searchResult.title}</h3></div>
                      </div>
                      <div className="p-6 space-y-6 flex-grow">
                          <p className="text-foreground">{searchResult.address}</p>
                          <button onClick={handleSyncData} className="w-full btn btn-secondary hover:text-green-600 transition-all group">
                              {t('syncAllDataButton')}
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-3xl bg-muted/20 text-center">
                      <h3 className="text-xl font-bold text-foreground">{t('searchToSyncTitle')}</h3>
                      <p className="text-muted-foreground mt-2 max-w-xs">{t('searchToSyncDesc')}</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
