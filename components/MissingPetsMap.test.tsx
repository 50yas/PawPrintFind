
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MissingPetsMap } from './MissingPetsMap';
import { PetProfile } from '../types';

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
  on: vi.fn(),
  invalidateSize: vi.fn(),
  fitBounds: vi.fn(),
};

const mockLayer = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
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
    
    // Check if container is rendered
    // The component returns a GlassCard which we assume renders a div
    // We can look for the HUD controls which are hardcoded text
    expect(screen.getByText('Street')).toBeInTheDocument();
    expect(screen.getByText('Satellite')).toBeInTheDocument();

    // Verify map initialization
    expect(global.L.map).toHaveBeenCalled();
    expect(global.L.tileLayer).toHaveBeenCalled();
  });

  it('should render lost pets markers', () => {
    const mockPets: PetProfile[] = [{
        id: '1',
        name: 'Buddy',
        type: 'dog',
        breed: 'Lab',
        age: '2',
        gender: 'male',
        size: 'Medium',
        color: 'Black',
        description: 'Lost dog',
        behavior: 'Friendly',
        photos: [{ url: 'img.jpg', id: '1' }],
        status: 'missing',
        lastSeenDate: '2023',
        contactInfo: { name: 'Owner', phone: '123' },
        lastSeenLocation: { latitude: 10, longitude: 10, address: 'Home' },
        createdAt: 1,
        updatedAt: 1
    }];

    render(
        <MissingPetsMap 
          lostPets={mockPets} 
          vetClinics={[]} 
        />
      );

    expect(global.L.marker).toHaveBeenCalledWith([10, 10], expect.any(Object));
  });
});
