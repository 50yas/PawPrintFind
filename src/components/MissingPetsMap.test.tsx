import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MissingPetsMap } from './MissingPetsMap';
import { PetProfile } from '../types';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

// Mock ThemeContext
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#008080',
      error: '#EF4444',
      surfaceContainer: '#FFFFFF',
      surfaceContainerLow: '#F0F0F0'
    }
  }),
}));

// Mock Leaflet
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  removeLayer: vi.fn(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  invalidateSize: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(13),
  getBounds: vi.fn().mockReturnValue({
    getWest: () => 9,
    getSouth: () => 9,
    getEast: () => 11,
    getNorth: () => 11,
    getNorthWest: () => ({ lng: 9, lat: 11 }),
    getSouthEast: () => ({ lng: 11, lat: 9 })
  }),
};

const mockLayer = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
};

const mockGroup = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn(),
  addLayer: vi.fn(),
  getLayers: vi.fn().mockReturnValue([]),
  getBounds: vi.fn().mockReturnValue({ pad: vi.fn() }),
};

global.L = {
  map: vi.fn().mockReturnValue(mockMap),
  tileLayer: vi.fn().mockReturnValue(mockLayer),
  featureGroup: vi.fn().mockReturnValue(mockGroup),
  divIcon: vi.fn(),
  marker: vi.fn().mockReturnValue(mockLayer),
  circle: vi.fn().mockReturnValue(mockLayer),
  control: {
    zoom: vi.fn().mockReturnValue({ addTo: vi.fn() })
  }
} as any;

describe('MissingPetsMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and initialize map', () => {
    render(
      <MissingPetsMap 
        lostPets={[]} 
        vetClinics={[]} 
      />
    );
    
    expect(screen.getByText('mapStreet')).toBeInTheDocument();
    expect(screen.getByText('mapSatellite')).toBeInTheDocument();

    expect(global.L.map).toHaveBeenCalled();
    expect(global.L.tileLayer).toHaveBeenCalled();
  });

  it('should render lost pets markers', () => {
const mockPets: PetProfile[] = [
    {
        id: '1',
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: '2y',
        photos: [{ id: '1', url: 'img.jpg', marks: [], description: 'buddy' }],
        status: 'stray' as const,
        isLost: true,
        ownerEmail: 'test@test.com',
        guardianEmails: [],
        vetLinkStatus: 'unlinked' as const,
        weight: '20kg',
        behavior: 'Friendly',
        homeLocations: [],
        lastSeenLocation: { latitude: 10, longitude: 10, address: 'Home' },
        searchRadius: null,
        sightings: [],
        videoAnalysis: '',
        audioNotes: '',
        healthChecks: [],
    }
];

    render(
        <MissingPetsMap 
          lostPets={mockPets} 
          vetClinics={[]} 
        />
      );

    expect(global.L.marker).toHaveBeenCalledWith([10, 10], expect.any(Object));
  });
});
