
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ReportSightingModal } from './ReportSightingModal';
import { PetProfile } from '../types';

// Mock EmojiSwitcher
vi.mock('./EmojiSwitcher', () => ({
  EmojiSwitcher: ({ children, onClick, disabled }: any) => (
    <button data-testid="emoji-switcher" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock useTranslations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string, params?: any) => {
        if (key === 'reportSightingTitle') return `Report Sighting for ${params?.petName}`;
        return key;
    },
  }),
}));

// Mock useSnackbar
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

// Mock Modal (it's often better to mock heavy UI components in unit tests if they have many dependencies)
vi.mock('./Modal', () => ({
    Modal: ({ children, title }: any) => (
        <div data-testid="modal">
            <h2>{title}</h2>
            {children}
        </div>
    )
}));

// Mock Leaflet
(global as any).L = {
    map: vi.fn().mockReturnValue({
        setView: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        remove: vi.fn()
    }),
    tileLayer: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis()
    }),
    marker: vi.fn().mockReturnValue({
        addTo: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis()
    })
};

describe('ReportSightingModal Component', () => {
  const mockPet: PetProfile = {
    id: '1',
    ownerEmail: 'other@example.com',
    guardianEmails: [],
    status: 'owned',
    vetLinkStatus: 'unlinked',
    isLost: true,
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: '2 years',
    weight: '25kg',
    behavior: 'Friendly',
    photos: [{ id: '1', url: 'buddy.jpg', timestamp: 0, marks: [], description: 'Lost dog' }],
    homeLocations: [],
    lastSeenLocation: { latitude: 0, longitude: 0 },
    searchRadius: null,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
    type: 'dog'
  };

  it('should render EmojiSwitcher for confirm sighting button', () => {
    render(<ReportSightingModal pet={mockPet} onClose={() => {}} onConfirm={() => {}} />);
    
    expect(screen.getByTestId('emoji-switcher')).toBeInTheDocument();
    expect(screen.getByText('confirmSightingButton')).toBeInTheDocument();
  });
});
