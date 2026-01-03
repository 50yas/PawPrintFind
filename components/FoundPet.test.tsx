
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { FoundPet } from './FoundPet';
import { PetProfile } from '../types';

// Mock Dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 0, longitude: 0 },
    error: null,
    loading: false,
    getLocation: vi.fn()
  })
}));

vi.mock('./MissingPetsMap', () => ({
  MissingPetsMap: () => <div data-testid="missing-pets-map">Map</div>
}));

vi.mock('./ui/GlassCard', () => ({
  GlassCard: ({ children, className }: any) => <div className={className} data-testid="glass-card">{children}</div>
}));

vi.mock('./ui/SkeletonLoader', () => ({
  MapSidebarSkeleton: () => <div data-testid="map-sidebar-skeleton">Sidebar Skeleton</div>,
  Skeleton: () => <div data-testid="skeleton">Skeleton</div>
}));

vi.mock('../services/geminiService', () => ({
  analyzeImageForDescription: vi.fn(),
  comparePets: vi.fn(),
  findNearbyVets: vi.fn(),
  textToSpeech: vi.fn()
}));

vi.mock('../services/audioService', () => ({
  playAudio: vi.fn()
}));

vi.mock('./LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>
}));

vi.mock('./ui/CinematicImage', () => ({
  CinematicImage: () => <div>Image</div>
}));

describe('FoundPet Skeleton Loading', () => {
  it('should render MapSidebarSkeleton when isLoading prop is true', () => {
    render(
      <FoundPet 
        lostPets={[]} 
        partnerVets={[]} 
        onContactOwner={vi.fn()} 
        isLoading={true} 
      />
    );
    
    // Should show skeleton, not "No active alerts"
    expect(screen.getByTestId('map-sidebar-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('No active alerts in this area')).toBeNull();
  });
});
