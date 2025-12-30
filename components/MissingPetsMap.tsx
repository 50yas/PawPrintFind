
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { PetProfile, VetClinic, Geolocation } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');
  const tilesRef = useRef<any>(null);

  const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const switchStyle = (style: MapStyle) => {
      setMapStyle(style);
      if (mapInstance.current && tilesRef.current) {
          mapInstance.current.removeLayer(tilesRef.current);
          tilesRef.current = L.tileLayer(style === 'street' ? STREET_URL : SATELLITE_URL, {
              maxZoom: 20,
              attribution: style === 'street' ? '&copy; CartoDB' : 'Esri, ArcGIS'
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
                color: '#ef4444', 
                fillColor: '#ef4444', 
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

  }, [lostPets, vetClinics, isPostingMode, onMapClick]);

  return (
    <GlassCard variant="interactive" className="group relative w-full h-full overflow-hidden border-white/10 bg-slate-900">
        {/* HUD SCANNING OVERLAY (Visible on Hover) */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[1001]">
            {/* Viewfinder Corners */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/40"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/40"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/40"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/40"></div>

            {/* Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 shadow-[0_0_20px_rgba(45,212,191,0.5)] animate-[scan_4s_linear_infinite]"></div>
            
            {/* Grid Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2dd4bf05_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf05_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
            
            {/* HUD Labels */}
            <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
                    <span className="text-[10px] font-mono text-primary/80 tracking-[0.3em] uppercase">Tracking_Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
                    <span className="text-[10px] font-mono text-primary/40 tracking-[0.3em] uppercase">Coverage: 98.4%</span>
                </div>
            </div>
        </div>

        {/* MAP HUD CONTROLS */}
        <div className="absolute top-4 right-4 z-[1002] flex flex-col gap-2">
            <GlassCard className="p-1 flex border-white/20 bg-slate-900/40 backdrop-blur-md">
                <button 
                    onClick={() => switchStyle('street')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'street' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >Street</button>
                <button 
                    onClick={() => switchStyle('satellite')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mapStyle === 'satellite' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >Satellite</button>
            </GlassCard>
            
            {vetClinics.length > 0 && (
                <GlassCard className="p-2 px-3 border-white/20 text-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_5px_#10b981]"></span>
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
                width: 40px; height: 40px; background: #10b981; border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg); padding: 3px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .vet-pin-inner {
                width: 100%; height: 100%; border-radius: 50%; background: white;
                transform: rotate(45deg); display: flex; align-items: center; justify-content: center;
                color: #10b981; position: relative;
            }
            .vet-pin.verified { background: #059669; box-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
            .v-badge {
                position: absolute; top: -5px; right: -5px; background: white; 
                border-radius: 50%; width: 18px; height: 18px; font-size: 10px;
                display: flex; align-items: center; justify-content: center; border: 1px solid #10b981;
            }

            .lost-pet-pulse::after {
                content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                border-radius: 50%; border: 4px solid #ef4444; opacity: 0;
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
