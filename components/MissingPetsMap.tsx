
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PetProfile, VetClinic, Geolocation } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';

declare var L: any;

interface MissingPetsMapProps {
  lostPets: PetProfile[];
  adoptablePets?: PetProfile[];
  vetClinics?: VetClinic[];
  userLocation?: Geolocation | null;
  isPostingMode?: boolean;
  onMapClick?: (latlng: {lat: number, lng: number}) => void;
  onContactOwner?: (pet: PetProfile) => void;
  onViewPet?: (pet: PetProfile) => void;
  hideLostToggle?: boolean;
  hideAdoptableToggle?: boolean;
  initialShowLost?: boolean;
  initialShowAdoptable?: boolean;
}

type MapStyle = 'street' | 'satellite';

export const MissingPetsMap: React.FC<MissingPetsMapProps> = ({ 
  lostPets, 
  adoptablePets = [], 
  vetClinics = [], 
  userLocation, 
  isPostingMode, 
  onMapClick, 
  onContactOwner,
  onViewPet,
  hideLostToggle = false,
  hideAdoptableToggle = false,
  initialShowLost = true,
  initialShowAdoptable = true
}) => {
  const { t } = useTranslations();
  const { colors } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const [showLost, setShowLost] = useState(initialShowLost);
  const [showAdoptable, setShowAdoptable] = useState(initialShowAdoptable);
  const tilesRef = useRef<any>(null);

  const GOOGLE_STREETS = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  const GOOGLE_HYBRID = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

  const switchStyle = (style: MapStyle) => {
      setMapStyle(style);
      if (mapInstance.current) {
          if (tilesRef.current) mapInstance.current.removeLayer(tilesRef.current);
          // Remove any leftover label layers from previous implementations
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

      // Default to Google Streets
      tilesRef.current = L.tileLayer(GOOGLE_STREETS, { 
          maxZoom: 20, 
          attribution: '&copy; Google Maps' 
      }).addTo(mapInstance.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      markersGroupRef.current = L.featureGroup().addTo(mapInstance.current);

      mapInstance.current.on('click', (e: any) => {
        if (onMapClick) onMapClick(e.latlng);
      });
      
      // Critical fix for rendering in containers with dynamic/delayed height
      setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 500);
    }

    const group = markersGroupRef.current;
    group.clearLayers();

    // 1. RENDER LOST PETS
    if (showLost) {
        lostPets.forEach(pet => {
            if (pet.lastSeenLocation) {
                const iconHtml = `
                    <div class="pet-pin lost-pet-pulse">
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
                
                // Enhanced Popup Content
                const popupContent = document.createElement('div');
                popupContent.className = 'text-center p-2 min-w-[160px]';
                popupContent.innerHTML = `
                    <div class="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-red-500/20 shadow-sm">
                        <img src="${pet.photos[0]?.url || ''}" class="w-full h-full object-cover" />
                    </div>
                    <p class="font-black text-slate-800 text-sm mb-0.5 uppercase tracking-wide">${pet.name}</p>
                    <p class="text-[10px] text-muted-foreground mb-2 font-mono">${pet.breed}</p>
                    
                    <div class="flex items-center justify-center gap-1 mb-3">
                        <span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <p class="text-[10px] text-red-500 font-bold uppercase tracking-wider">${t('signalLost')}</p>
                    </div>

                    ${onViewPet ? `
                    <button id="view-btn-${pet.id}" class="w-full bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all shadow-md mb-2 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                        ${t('viewButton')}
                    </button>
                    ` : ''}

                    ${onContactOwner ? `
                    <button id="contact-btn-${pet.id}" class="w-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" /><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" /></svg>
                        ${t('contactOwnerButton')}
                    </button>
                    ` : ''}
                `;

                const marker = L.marker([pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude], { icon })
                    .bindPopup(popupContent);
                
                marker.on('popupopen', () => {
                    if (onContactOwner) {
                        const btn = document.getElementById(`contact-btn-${pet.id}`);
                        if (btn) btn.onclick = () => onContactOwner(pet);
                    }
                    if (onViewPet) {
                        const btn = document.getElementById(`view-btn-${pet.id}`);
                        if (btn) btn.onclick = () => onViewPet(pet);
                    }
                });
                    
                group.addLayer(marker);

                const circle = L.circle([pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude], {
                    color: colors.error, 
                    fillColor: colors.error, 
                    fillOpacity: 0.08, 
                    radius: pet.searchRadius || 1000, 
                    weight: 1
                });
                group.addLayer(circle);
            }
        });
    }

    // 1.5. RENDER ADOPTABLE PETS
    if (showAdoptable) {
        adoptablePets.forEach(pet => {
            if (pet.homeLocations && pet.homeLocations.length > 0) {
                const loc = pet.homeLocations[0];
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
                
                // Enhanced Popup Content for Adoptable Pets
                const popupContent = document.createElement('div');
                popupContent.className = 'text-center p-2 min-w-[160px]';
                popupContent.innerHTML = `
                    <div class="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-primary/20 shadow-sm">
                        <img src="${pet.photos[0]?.url || ''}" class="w-full h-full object-cover" />
                    </div>
                    <p class="font-black text-slate-800 text-sm mb-0.5 uppercase tracking-wide">${pet.name}</p>
                    <p class="text-[10px] text-muted-foreground mb-1 font-mono">${pet.breed}</p>
                    <span class="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase mb-3 border border-slate-200">${pet.age} • ${pet.size || 'N/A'}</span>

                    ${onViewPet ? `
                    <button id="view-adopt-btn-${pet.id}" class="w-full bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all shadow-md mb-2 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" /></svg>
                        ${t('viewButton')}
                    </button>
                    ` : ''}

                    ${onContactOwner ? `
                    <button id="adopt-btn-${pet.id}" class="w-full bg-primary text-white text-[10px] font-black uppercase py-2 rounded-lg hover:brightness-110 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>
                        ${t('adoptMeButton')}
                    </button>
                    ` : ''}
                `;

                const marker = L.marker([loc.latitude, loc.longitude], { icon })
                    .bindPopup(popupContent);
                
                marker.on('popupopen', () => {
                    if (onContactOwner) {
                        const btn = document.getElementById(`adopt-btn-${pet.id}`);
                        if (btn) btn.onclick = () => onContactOwner(pet);
                    }
                    if (onViewPet) {
                        const btn = document.getElementById(`view-adopt-btn-${pet.id}`);
                        if (btn) btn.onclick = () => onViewPet(pet);
                    }
                });

                group.addLayer(marker);
            }
        });
    }

    // 2. RENDER VET CLINICS
    vetClinics.forEach(clinic => {
        if (clinic.location) {
            const iconHtml = `
                <div class="vet-pin ${clinic.isVerified ? 'verified' : ''}">
                    <div class="vet-pin-inner">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7a1 1 0 10-2 0v2H7z"/></svg>
                        ${clinic.isVerified ? '<div class="v-badge">🛡️</div>' : ''}
                    </div>
                </div>
            `;
            const icon = L.divIcon({ 
                className: 'custom-div-icon', 
                html: iconHtml, 
                iconSize: [40, 40], 
                iconAnchor: [20, 40] 
            });
            
            const marker = L.marker([clinic.location.latitude, clinic.location.longitude], { icon })
                .bindPopup(`
                    <div class="p-2 text-center min-w-[140px]">
                        <h4 class="font-bold text-slate-800">${clinic.name}</h4>
                        <p class="text-[10px] text-muted-foreground mb-2">${clinic.address}</p>
                        ${clinic.isVerified ? `<span class="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">${t('verifiedVetBadge')}</span>` : ''}
                        <div class="mt-2 pt-2 border-t border-slate-100">
                            <a href="tel:${clinic.phone}" class="text-xs font-bold text-primary">${t('callClinicButton')}</a>
                        </div>
                    </div>
                `);
            group.addLayer(marker);
        }
    });

    // 3. VIEW CONTROLLER
    // User request: Avoid zooming in on single pets. Show country view (Zoom ~6).
    if (mapInstance.current) {
        if (userLocation) {
            // If we have user location, center there but keep country view
            mapInstance.current.setView([userLocation.latitude, userLocation.longitude], 6);
        } else if (!isPostingMode && group.getLayers().length === 0) {
            // Default fallback if no user loc and no markers (Rome/Italy default)
            // This preserves the initial setView([41.9027, 12.4964], 6)
        }
        // We explicitly do NOT call fitBounds() here to prevent aggressive zooming
    }

  }, [lostPets, adoptablePets, vetClinics, isPostingMode, onMapClick, colors, userLocation]);

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
            
            <GlassCard className="p-1 flex flex-col gap-1 border-white/20" style={{ backgroundColor: colors.surfaceContainerLow + '66' }}>
                 {!hideLostToggle && (
                 <button 
                    onClick={() => setShowLost(!showLost)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-2 ${showLost ? 'text-white' : 'text-slate-400 opacity-50'}`}
                    style={showLost ? { backgroundColor: colors.error } : {}}
                >
                    <span>{t('showLostPets')}</span>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                </button>
                )}
                {!hideAdoptableToggle && (
                <button 
                    onClick={() => setShowAdoptable(!showAdoptable)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-2 ${showAdoptable ? 'text-white' : 'text-slate-400 opacity-50'}`}
                    style={showAdoptable ? { backgroundColor: colors.primary } : {}}
                >
                    <span>{t('showAdoptablePets')}</span>
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                </button>
                )}
            </GlassCard>
            
            {vetClinics.length > 0 && (
                <GlassCard className="p-2 px-3 border-white/20 text-center animate-fade-in" style={{ backgroundColor: colors.surfaceContainerLow + '66' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#10b981' }}>
                        <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_#10b981]" style={{ backgroundColor: '#10b981' }}></span>
                        {vetClinics.filter(v=>v.isVerified).length} {t('verifiedVetsCount')}
                    </p>
                </GlassCard>
            )}
        </div>

        <div ref={mapRef} className="w-full h-full z-0" />

        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .pet-pin {
                width: 46px; height: 46px; background: white; border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg); padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .pet-pin-inner {
                width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
                transform: rotate(45deg); border: 2px solid white;
            }
            .pet-pin img { width: 100%; height: 100%; object-fit: cover; }
            
            .vet-pin {
                width: 40px; height: 40px; background: ${colors.primary}; border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg); padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .vet-pin-inner {
                width: 100%; height: 100%; border-radius: 50%; background: white;
                transform: rotate(45deg); display: flex; align-items: center; justify-content: center;
                color: ${colors.primary}; position: relative;
            }
            .vet-pin.verified { background: ${colors.primaryContainer}; box-shadow: 0 0 15px ${colors.primary}66; }
            .v-badge {
                position: absolute; top: -5px; right: -5px; background: white; 
                border-radius: 50%; width: 18px; height: 18px; font-size: 10px;
                display: flex; align-items: center; justify-content: center; border: 1px solid ${colors.primary};
            }

            .lost-pet-pulse::after {
                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: 50%; border: 4px solid ${colors.error}; opacity: 0;
                animation: pulse-ring 2s infinite;
            }
            .adoptable-pet-pulse::after {
                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: 50%; border: 4px solid ${colors.primary}; opacity: 0;
                animation: pulse-ring 2s infinite;
            }
            @keyframes pulse-ring {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }
        `}</style>
    </GlassCard>
  );
};
