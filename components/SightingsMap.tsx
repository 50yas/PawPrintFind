
import React, { useEffect, useRef } from 'react';
import { PetProfile } from '../types';

declare var L: any;

interface SightingsMapProps {
  pet: PetProfile;
}

const fixDefaultIcons = () => {
    if ((L.Icon.Default.prototype as any)._getIconUrl) return;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
};

export const SightingsMap: React.FC<SightingsMapProps> = ({ pet }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);

  useEffect(() => {
    if (typeof L === 'undefined') return;
    fixDefaultIcons();

    if (mapRef.current && !mapInstance.current) {
      // attributionControl: false
      mapInstance.current = L.map(mapRef.current, { attributionControl: false }).setView([41.90, 12.49], 6);
      
      // CartoDB Voyager Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);
    }

    if (mapInstance.current) {
      mapInstance.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polyline) {
          mapInstance.current?.removeLayer(layer);
        }
      });
      
      const markers = [];

      // Home locations
      pet.homeLocations.forEach(loc => {
        L.circle([loc.latitude, loc.longitude], { radius: 2500, color: '#2dd4bf', fillOpacity: 0.1, weight: 1 }).addTo(mapInstance.current);
        markers.push(L.marker([loc.latitude, loc.longitude]));
      });

      // Last seen location
      if (pet.lastSeenLocation) {
        const lastSeenMarker = L.marker([pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude], {
            // Custom icon can be used here
        }).addTo(mapInstance.current)
          .bindPopup(`<b>Last Seen Here</b><br>${new Date(pet.sightings[0]?.timestamp || Date.now()).toLocaleString()}`);
        markers.push(lastSeenMarker);
      }
      
      // Sighting locations
      const sortedSightings = [...pet.sightings].sort((a, b) => a.timestamp - b.timestamp);
      sortedSightings.forEach((sighting, index) => {
        const sightingMarker = L.marker([sighting.location.latitude, sighting.location.longitude]).addTo(mapInstance.current)
          .bindPopup(`<b>Sighting #${index + 1}</b><br>${new Date(sighting.timestamp).toLocaleString()}<br><em>${sighting.notes || ''}</em>`);
        markers.push(sightingMarker);
      });

      // Draw a line connecting sightings
      if (pet.lastSeenLocation && sortedSightings.length > 0) {
        const latlngs = [
            [pet.lastSeenLocation.latitude, pet.lastSeenLocation.longitude],
            ...sortedSightings.map(s => [s.location.latitude, s.location.longitude])
        ];
        L.polyline(latlngs, {color: 'red', dashArray: '5, 5'}).addTo(mapInstance.current);
      }

      if (markers.length > 0) {
        const group = new L.FeatureGroup(markers);
        mapInstance.current.fitBounds(group.getBounds().pad(0.25));
      }
    }
  }, [pet]);

  return <div ref={mapRef} style={{ height: '300px', width: '100%', borderRadius: 'var(--radius)', zIndex: 0 }} />;
};
