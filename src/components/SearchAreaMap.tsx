
import React, { useRef, useEffect, useState } from 'react';
import { Geolocation } from '../types';

declare var L: any;

interface SearchAreaMapProps {
  onAreaChange: (center: Geolocation, radius: number) => void;
}

export const SearchAreaMap: React.FC<SearchAreaMapProps> = ({ onAreaChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const circleInstance = useRef<any | null>(null);
  const [radius, setRadius] = useState(1000); // Default radius in meters

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
        // attributionControl: false removes the text
        mapInstance.current = L.map(mapRef.current, { attributionControl: false }).setView([41.90, 12.49], 5);
        
        // CartoDB Voyager Tile Layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(mapInstance.current);

        mapInstance.current.on('click', (e: any) => {
            const center = { latitude: e.latlng.lat, longitude: e.latlng.lng };
            if (!circleInstance.current) {
                circleInstance.current = L.circle(e.latlng, { 
                    radius,
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.2
                }).addTo(mapInstance.current);
            } else {
                circleInstance.current.setLatLng(e.latlng);
            }
            onAreaChange(center, radius);
            mapInstance.current.setView(e.latlng, 13);
        });
    }
  }, [onAreaChange, radius]);

  useEffect(() => {
    if (circleInstance.current) {
        circleInstance.current.setRadius(radius);
        const center = circleInstance.current.getLatLng();
        onAreaChange({latitude: center.lat, longitude: center.lng}, radius);
    }
  }, [radius, onAreaChange]);

  return (
    <div>
        <div ref={mapRef} style={{ height: '300px', borderRadius: 'var(--radius)', zIndex: 0, cursor: 'crosshair' }} />
        <div className="mt-4">
            <label htmlFor="radius-slider" className="block text-sm font-medium text-muted-foreground">
                Search Radius: {(radius / 1000).toFixed(1)} km
            </label>
            <input
                id="radius-slider"
                type="range"
                min="500"
                max="10000"
                step="500"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={!circleInstance.current}
            />
        </div>
    </div>
  );
};
