
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdoptionCenter } from './AdoptionCenter';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { User, PetProfile } from '../types';
import { describe, it, expect, vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

const mockPets: PetProfile[] = [
  {
    id: 'pet1',
    name: 'Fido',
    breed: 'Golden Retriever',
    age: '2 years',
    photos: [{ id: '1', url: 'test.jpg', marks: [], description: 'test', timestamp: Date.now(), isAIValidated: true }],
    ownerEmail: 'test@example.com',
    guardianEmails: [],
    isLost: false,
    status: 'forAdoption',
    vetLinkStatus: 'unlinked',
    weight: '20kg',
    behavior: 'Friendly and playful',
    homeLocations: [],
    lastSeenLocation: null,
    searchRadius: null,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
  },
];

describe('AdoptionCenter Visibility', () => {
    const renderAdoptionCenter = () => render(
        <SnackbarProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <AdoptionCenter 
                        petsForAdoption={mockPets} 
                        onInquire={vi.fn()} 
                        goBack={vi.fn()} 
                        currentUser={null} 
                    />
                </ThemeProvider>
            </LanguageProvider>
        </SnackbarProvider>
    );

    it('Main title and description have high visibility', () => {
        renderAdoptionCenter();
        const title = screen.getByText('adoptionCenterTitle');
        // adoptionCenterTitle has text-foreground which might be dark. 
        // We want text-white for cinematic feel.
        expect(title).toHaveClass('text-white');
        
        const desc = screen.getByText('adoptionCenterDescPublic');
        expect(desc).toHaveClass('text-slate-200');
    });

    it('AdoptionCard text has high contrast', () => {
        renderAdoptionCenter();
        const petName = screen.getByText('Fido');
        expect(petName).toHaveClass('text-white');
        
        const behavior = screen.getByText('Friendly and playful');
        // Currently text-slate-400, needs improvement
        expect(behavior).toHaveClass('text-slate-200');
    });
});
