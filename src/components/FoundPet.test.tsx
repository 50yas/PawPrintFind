import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FoundPet } from './FoundPet';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

// Mock snackbar
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({ addSnackbar: vi.fn() }),
}));

// Mock geolocation
vi.mock('../hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: { latitude: 10, longitude: 10 },
    error: null,
    loading: false,
    getLocation: vi.fn(),
  }),
}));

// Mock services
vi.mock('../services/geminiService', () => ({
  analyzeImageForDescription: vi.fn().mockResolvedValue('A brown dog'),
  comparePets: vi.fn().mockResolvedValue({ score: 90, reasoning: 'Match', keyMatches: ['color'], discrepancies: [] }),
  findNearbyVets: vi.fn().mockResolvedValue({ text: 'Nearby vets', places: [] }),
  textToSpeech: vi.fn().mockResolvedValue('audio-base64'),
}));

vi.mock('../services/audioService', () => ({
  playAudio: vi.fn().mockResolvedValue(undefined),
}));

// Mock components
vi.mock('./MissingPetsMap', () => ({
  MissingPetsMap: () => <div data-testid="missing-map">Map</div>,
}));

vi.mock('./ui/CinematicImage', () => ({
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe('FoundPet Component', () => {
  const mockLostPets: any[] = [
    { id: '1', name: 'Buddy', breed: 'Golden', photos: [{ url: 'buddy.jpg' }], lastSeenLocation: { latitude: 10.1, longitude: 10.1 } }
  ];
  const mockOnContactOwner = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Map mode by default', () => {
    render(<FoundPet lostPets={mockLostPets} partnerVets={[]} onContactOwner={mockOnContactOwner} onViewPet={vi.fn()} />);
    expect(screen.getByTestId('missing-map')).toBeInTheDocument();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
  });

  it('switches to Scan mode when button is clicked', () => {
    render(<FoundPet lostPets={mockLostPets} partnerVets={[]} onContactOwner={mockOnContactOwner} onViewPet={vi.fn()} />);
    
    const scanBtn = screen.getByText('aiScannerButton');
    fireEvent.click(scanBtn);

    expect(screen.getByText('foundPetTitle')).toBeInTheDocument();
    expect(screen.queryByTestId('missing-map')).not.toBeInTheDocument();
  });

  it('performs search when photo is uploaded and button is clicked', async () => {
    const { analyzeImageForDescription, comparePets } = await import('../services/geminiService');
    
    render(<FoundPet lostPets={mockLostPets} partnerVets={[]} onContactOwner={mockOnContactOwner} onViewPet={vi.fn()} />);
    
    // Switch to scan
    fireEvent.click(screen.getByText('aiScannerButton'));

    // Upload file
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/uploadPhotoPrompt/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Click search
    const searchBtn = screen.getByText('applyFiltersButton');
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(analyzeImageForDescription).toHaveBeenCalled();
      expect(comparePets).toHaveBeenCalled();
      expect(screen.getByText('potentialMatchesTitle')).toBeInTheDocument();
    });
  });
});