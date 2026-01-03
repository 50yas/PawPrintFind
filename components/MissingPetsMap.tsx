
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PetProfile, VetClinic, Geolocation } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { useTheme } from '../contexts/ThemeContext';

declare var L: any;

interface MissingPetsMapProps {
  lostPets: PetProfile[];
  vetClinics?: VetClinic[];
  userLocation?: Geolocation | null;
  isPostingMode?: boolean;
  onMapClick?: (latlng: {lat: number, lng: number}) => void;
}

type MapStyle = 'street' | 'satellite';

export const MissingPetsMap: React.FC<MissingPetsMapProps> = ({ lostPets, vetClinics = [], userLocation, isPostingMode, onMapClick }) => {
  const { colors } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const tilesRef = useRef<any>(null);

  const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const SATELLITE_LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

  const switchStyle = (style: MapStyle) => {
      setMapStyle(style);
      if (mapInstance.current) {
          if (tilesRef.current) mapInstance.current.removeLayer(tilesRef.current);
          if ((mapInstance.current as any)._labelsLayer) {
              mapInstance.current.removeLayer((mapInstance.current as any)._labelsLayer);
              (mapInstance.current as any)._labelsLayer = null;
          }

          tilesRef.current = L.tileLayer(style === 'street' ? STREET_URL : SATELLITE_URL, {
              maxZoom: 20,
              attribution: style === 'street' ? '&copy; CartoDB' : 'Esri, ArcGIS'
          }).addTo(mapInstance.current);

          if (style === 'satellite') {
              (mapInstance.current as any)._labelsLayer = L.tileLayer(SATELLITE_LABELS_URL, {
                  maxZoom: 20,
                  opacity: 0.8
              }).addTo(mapInstance.current);
          }
      }
  };

  useEffect(() => {
    if (typeof L === 'undefined' || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { 
          attributionControl: false,
          zoomControl: false 
      }).setView([41.9027, 12.4964], 6);

      tilesRef.current = L.tileLayer(STREET_URL, { maxZoom: 20 }).addTo(mapInstance.current);
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
            
            const marker = L.marker([pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude], { icon })
                .bindPopup(`
                    <div class="text-center p-1">
                        <p class="font-bold text-slate-800">${pet.name}</p>
                        <p class="text-[10px] text-red-500 font-bold uppercase">Signal Lost</p>
                    </div>
                `);
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
                        ${clinic.isVerified ? '<span class="bg-emerald-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">Verified Partner</span>' : ''}
                        <div class="mt-2 pt-2 border-t border-slate-100">
                            <a href="tel:${clinic.phone}" class="text-xs font-bold text-primary">Call Clinic</a>
                        </div>
                    </div>
                `);
            group.addLayer(marker);
        }
    });

    // 3. AUTO-FOCUS
    if (!isPostingMode && group.getLayers().length > 0) {
        mapInstance.current.fitBounds(group.getBounds().pad(0.3));
    }

  }, [lostPets, vetClinics, isPostingMode, onMapClick, colors]);

  return (
    <GlassCard variant="interactive" className="group relative w-full h-full overflow-hidden border-white/10" style={{ backgroundColor: colors.surfaceContainer }}>
        {/* MAP HUD CONTROLS */}
        <div className="absolute top-4 right-4 z-[1002] flex flex-col gap-2">
            <GlassCard className="p-1 flex border-white/20" style={{ backgroundColor: colors.surfaceContainerLow + '66' }}>
                <button 
                    onClick={() => switchStyle('street')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'street' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    style={mapStyle === 'street' ? { backgroundColor: colors.primary } : {}}
                >Street</button>
                <button 
                    onClick={() => switchStyle('satellite')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'satellite' ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    style={mapStyle === 'satellite' ? { backgroundColor: colors.primary } : {}}
                >Satellite</button>
            </GlassCard>
            
            {vetClinics.length > 0 && (
                <GlassCard className="p-2 px-3 border-white/20 text-center animate-fade-in" style={{ backgroundColor: colors.surfaceContainerLow + '66' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#10b981' }}>
                        <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_#10b981]" style={{ backgroundColor: '#10b981' }}></span>
                        {vetClinics.filter(v=>v.isVerified).length} Verified Vets
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
            @keyframes pulse-ring {
                0% { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }
        `}</style>
    </GlassCard>
  );
};
