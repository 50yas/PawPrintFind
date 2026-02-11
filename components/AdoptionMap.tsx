
import React, { useEffect, useRef, useState } from 'react';
import { PetProfile, Geolocation } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useGeolocation } from '../hooks/useGeolocation';

declare var L: any;

interface AdoptionMapProps {
  adoptablePets: PetProfile[];
  onAdoptMe: (pet: PetProfile) => void;
  isLoading?: boolean;
}

type MapStyle = 'street' | 'satellite';

export const AdoptionMap: React.FC<AdoptionMapProps> = ({ adoptablePets, onAdoptMe, isLoading }) => {
  const { t } = useTranslations();
  const { colors } = useTheme();
  const { location: userLocation, getLocation, loading: locLoading } = useGeolocation();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const tilesRef = useRef<any>(null);

  const GOOGLE_STREETS = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  const GOOGLE_HYBRID = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

  const switchStyle = (style: MapStyle) => {
      setMapStyle(style);
      if (mapInstance.current) {
          if (tilesRef.current) mapInstance.current.removeLayer(tilesRef.current);
          if ((mapInstance.current as any)._labelsLayer) {
              mapInstance.current.removeLayer((mapInstance.current as any)._labelsLayer);
              (mapInstance.current as any)._labelsLayer = null;
          }

          tilesRef.current = L.tileLayer(style === 'street' ? GOOGLE_STREETS : GOOGLE_HYBRID, {
              maxZoom: 20,
              attribution: '&copy; Google Maps'
          }).addTo(mapInstance.current);
      }
  };

  useEffect(() => {
    if (typeof L === 'undefined' || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { 
          attributionControl: false,
          zoomControl: false 
      }).setView([41.9027, 12.4964], 6);

      tilesRef.current = L.tileLayer(GOOGLE_STREETS, { 
          maxZoom: 20, 
          attribution: '&copy; Google Maps' 
      }).addTo(mapInstance.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      markersGroupRef.current = L.featureGroup().addTo(mapInstance.current);
      
      setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 500);
    }

    const group = markersGroupRef.current;
    group.clearLayers();

    adoptablePets.forEach(pet => {
        const loc = pet.homeLocations?.[0] || pet.lastSeenLocation;
        if (loc) {
            const iconHtml = `
                <div class="pet-pin adoptable-pet-pulse">
                    <div class="pet-pin-inner">
                        <img src="${pet.photos[0]?.url || ''}" />
                    </div>
                </div>
            `;
            const icon = L.divIcon({ 
                className: 'custom-div-icon', 
                html: iconHtml, 
                iconSize: [46, 46], 
                iconAnchor: [23, 46] 
            });
            
            const marker = L.marker([loc.latitude, loc.longitude], { icon });
            
            // Handle popup interaction
            const popupContent = document.createElement('div');
            popupContent.className = 'text-center p-2 min-w-[160px]';
            popupContent.innerHTML = `
                <div class="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-primary/20 shadow-sm">
                    <img src="${pet.photos[0]?.url || ''}" class="w-full h-full object-cover" />
                </div>
                <p class="font-black text-slate-800 text-sm mb-0.5 uppercase tracking-wide line-clamp-1">${pet.name}</p>
                <p class="text-[10px] text-slate-400 mb-1 font-mono line-clamp-1">${pet.breed}</p>
                <span class="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase mb-3 border border-slate-200">${pet.age} • ${pet.size || 'N/A'}</span>
                
                <button id="adopt-btn-${pet.id}" class="w-full bg-primary text-white text-[10px] font-black uppercase py-2 rounded-lg hover:brightness-110 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>
                    ${t('adoptMeButton')}
                </button>
            `;

            marker.bindPopup(popupContent);
            
            marker.on('popupopen', () => {
                const btn = document.getElementById(`adopt-btn-${pet.id}`);
                if (btn) {
                    btn.onclick = () => onAdoptMe(pet);
                }
            });

            group.addLayer(marker);
        }
    });

  }, [adoptablePets, colors, t, onAdoptMe]);

  // Center on user location when it changes
  useEffect(() => {
      if (userLocation && mapInstance.current) {
          mapInstance.current.setView([userLocation.latitude, userLocation.longitude], 12);
          
          // Add a temporary marker for user
          const userMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
              radius: 8,
              fillColor: colors.primary,
              color: '#white',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
          }).addTo(mapInstance.current);
          
          setTimeout(() => userMarker.remove(), 5000);
      }
  }, [userLocation, colors.primary]);

  return (
    <GlassCard variant="default" className="group relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.surfaceContainer }}>
        {/* MAP HUD CONTROLS */}
        <div className="absolute top-4 right-4 z-[1002] flex flex-col gap-2">
            <GlassCard className="p-1 flex border-white/20" style={{ backgroundColor: colors.surfaceContainerLow + '66' }}>
                <button 
                    onClick={() => switchStyle('street')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'street' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    style={mapStyle === 'street' ? { backgroundColor: colors.primary } : {}}
                >{t('mapStreet')}</button>
                <button 
                    onClick={() => switchStyle('satellite')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'satellite' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    style={mapStyle === 'satellite' ? { backgroundColor: colors.primary } : {}}
                >{t('mapSatellite')}</button>
            </GlassCard>

            <GlassButton 
                onClick={getLocation} 
                variant="primary" 
                className="!py-2 !px-4 text-[10px]"
                disabled={locLoading}
            >
                {locLoading ? t('locating') : t('locateMeButton')}
            </GlassButton>
        </div>

        {isLoading && (
            <div className="absolute inset-0 z-[1001] bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}

        <div ref={mapRef} className="w-full h-full z-0" />

        <style>{`
            .pet-pin {
                width: 46px; height: 46px; background: white; border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg); padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .pet-pin-inner {
                width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
                transform: rotate(45deg); border: 2px solid white;
            }
            .pet-pin img { width: 100%; height: 100%; object-fit: cover; }
            
            .adoptable-pet-pulse::after {
                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: 50%; border: 4px solid ${colors.primary}; opacity: 0;
                animation: pulse-ring 2s infinite;
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }
            .leaflet-popup-content-wrapper {
                background: rgba(255, 255, 255, 0.8) !important;
                backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 1.5rem !important;
            }
            .leaflet-popup-tip {
                background: rgba(255, 255, 255, 0.8) !important;
                backdrop-filter: blur(12px) !important;
            }
        `}</style>
    </GlassCard>
  );
};
