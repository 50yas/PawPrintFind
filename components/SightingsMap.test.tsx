
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SightingsMap } from './SightingsMap';
import { PetProfile } from '../types';

// Mock ThemeContext
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#008080',
      error: '#EF4444',
    }
  }),
}));

// Mock Leaflet
const mockMap = {
  setView: vi.fn().mockReturnThis(),
  removeLayer: vi.fn(),
  eachLayer: vi.fn(),
  fitBounds: vi.fn(),
};

const mockLayer = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
};

const MockFeatureGroup = vi.fn();
MockFeatureGroup.prototype.getBounds = vi.fn().mockReturnValue({ pad: vi.fn() });

global.L = {
  map: vi.fn().mockReturnValue(mockMap),
  tileLayer: vi.fn().mockReturnValue(mockLayer),
  marker: vi.fn().mockReturnValue(mockLayer),
  circle: vi.fn().mockReturnValue(mockLayer),
  polyline: vi.fn().mockReturnValue(mockLayer),
  FeatureGroup: MockFeatureGroup,
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn()
    }
  }
} as any;

describe('SightingsMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render and initialize map with pet data', () => {
const mockPet: PetProfile = {
    id: '1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: '2y',
    photos: [{ id: '1', url: 'img.jpg', marks: [], description: 'buddy' }],
    status: 'stray',
    isLost: true,
    ownerEmail: 'test@test.com',
    guardianEmails: [],
    vetLinkStatus: 'unlinked',
    weight: '20kg',
    behavior: 'Friendly',
    homeLocations: [{ latitude: 10, longitude: 10, address: 'Home' }],
    lastSeenLocation: { latitude: 11, longitude: 11, address: 'Lost' },
    searchRadius: 10,
    sightings: [
        { id: 's1', location: { latitude: 12, longitude: 12, address: 'Sighting' }, timestamp: 123456789, notes: 'Spotted near park' }
    ],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
};

    render(<SightingsMap pet={mockPet} />);

    // Verify map init
    expect(global.L.map).toHaveBeenCalled();
    
    // Verify markers
    // Home
    expect(global.L.circle).toHaveBeenCalledWith([10, 10], expect.any(Object));
    // Last seen
    expect(global.L.marker).toHaveBeenCalledWith([11, 11], expect.anything());
    // Sighting
    expect(global.L.marker).toHaveBeenCalledWith([12, 12]);
    // Polyline
    expect(global.L.polyline).toHaveBeenCalled();
  });
});
