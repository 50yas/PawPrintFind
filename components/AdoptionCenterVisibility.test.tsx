
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
    name: 'Luna',
    type: 'cat',
    breed: 'Siamese',
    age: '1 year',
    photos: [{ url: 'test.jpg', timestamp: Date.now(), isAIValidated: true }],
    ownerId: 'shelter1',
    ownerEmail: 'shelter@example.com',
    isLost: false,
    status: 'active',
    behavior: 'Friendly and playful',
    microchipId: 'MC456',
    sex: 'female',
    weight: '4kg',
    medications: [],
    vaccinations: [],
    lastHealthCheck: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
        const petName = screen.getByText('Luna');
        expect(petName).toHaveClass('text-white');
        
        const behavior = screen.getByText('Friendly and playful');
        // Currently text-slate-400, needs improvement
        expect(behavior).toHaveClass('text-slate-200');
    });
});
