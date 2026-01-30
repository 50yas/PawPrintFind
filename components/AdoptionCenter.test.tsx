import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { AdoptionCenter } from './AdoptionCenter';
import { PetProfile, User } from '../types';
import { searchService } from '../services/searchService';

// Mock Dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    trackAdoptionInquiry: vi.fn(),
    trackPetView: vi.fn(),
    logEvent: vi.fn(),
  },
}));

vi.mock('../services/geminiService', () => ({
    generateMatchExplanation: vi.fn().mockResolvedValue('Matches perfectly!'),
}));

vi.mock('../services/searchService', () => ({
    searchService: {
        rankPets: vi.fn((pets, filters) => {
            console.log('rankPets called with:', pets?.length, filters);
            let results = [...pets];
            if (filters) {
                if (filters.breed) results = results.filter((p: any) => p.breed === filters.breed);
                if (filters.size) results = results.filter((p: any) => p.size === filters.size);
                if (filters.location) results = results.filter((p: any) => p.location === filters.location);
            }
            return Promise.resolve(results);
        }),
        saveSearch: vi.fn().mockResolvedValue('search123'),
    },
}));

vi.mock('./FavoriteButton', () => ({
    FavoriteButton: () => <div data-testid="favorite-button">Fav</div>,
}));

vi.mock('./ShareButton', () => ({
    ShareButton: () => <div data-testid="share-button">Share</div>,
}));

vi.mock('../services/optimizationService', () => ({
    optimizationService: {
        getSearchConfig: vi.fn().mockResolvedValue(null),
        recordSearchInteraction: vi.fn(),
    },
}));

vi.mock('./ui', () => ({
  GlassCard: ({ children, className }: any) => <div className={className} data-testid="glass-card">{children}</div>,
  GlassButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('./ui/SkeletonLoader', () => ({
  CardSkeleton: () => <div data-testid="card-skeleton">Skeleton</div>,
  MapSidebarSkeleton: () => <div data-testid="map-skeleton">Map Skeleton</div>,
}));

vi.mock('./AdoptionMap', () => ({
  AdoptionMap: () => <div data-testid="adoption-map">AdoptionMap</div>,
}));

vi.mock('./SmartSearchBar', () => ({
    SmartSearchBar: ({ onSearch }: any) => (
        <div data-testid="smart-search-bar">
            <button onClick={() => onSearch({ species: 'cat' })}>Search Cat</button>
        </div>
    )
}));

const mockPets: PetProfile[] = [
  {
    id: '1',
    name: 'Buddy',
    status: 'forAdoption',
    breed: 'Golden Retriever',
    age: '2 years',
    type: 'dog',
    size: 'Large',
    location: 'New York',
    photos: [{ url: 'buddy.jpg' }],
    behavior: 'Playful',
  },
  {
    id: '2',
    name: 'Mittens',
    status: 'forAdoption',
    breed: 'Tabby',
    age: '1 year',
    type: 'cat',
    size: 'Small',
    location: 'Boston',
    photos: [{ url: 'mittens.jpg' }],
    behavior: 'Quiet',
  },
  {
    id: '3',
    name: 'Max',
    status: 'forAdoption',
    breed: 'German Shepherd',
    age: '4 years',
    type: 'dog',
    size: 'Large',
    location: 'New York',
    photos: [{ url: 'max.jpg' }],
    behavior: 'Protective',
  }
] as any;

describe('AdoptionCenter Component - Advanced Filtering', () => {
    // Existing Tests
    it('should render pets when isLoading is false', async () => {
            render(
              <AdoptionCenter 
                petsForAdoption={mockPets} 
                onInquire={vi.fn()} 
                goBack={vi.fn()} 
                currentUser={null} 
                isLoading={false} 
              />
            );
            
            // screen.debug();
        
            await waitFor(() => {
                expect(screen.getByText('Buddy')).toBeInTheDocument();
            });
    });

    // New Tests for Multi-Parameter Filtering
    it('should filter pets by size', async () => {
        render(
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );

        const sizeSelect = screen.getByLabelText('filterBySizeLabel');
        fireEvent.change(sizeSelect, { target: { value: 'Small' } });

        await waitFor(() => {
            expect(screen.queryByText('Buddy')).toBeNull(); // Large
            expect(screen.getByText('Mittens')).toBeInTheDocument(); // Small
        });
    });

    it('should filter pets by location', async () => {
         render(
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );

        const locationInput = screen.getByPlaceholderText('filterByLocationPlaceholder');
        fireEvent.change(locationInput, { target: { value: 'New York' } });

        await waitFor(() => {
            expect(screen.getByText('Buddy')).toBeInTheDocument();
            expect(screen.getByText('Max')).toBeInTheDocument();
            expect(screen.queryByText('Mittens')).toBeNull(); // Boston
        });
    });

    it('should sort pets by newest first', async () => {
        // Mock pets with timestamps for sorting test
        const petsWithDates = [
            { ...mockPets[0], listedAt: '2023-01-01' },
            { ...mockPets[1], listedAt: '2023-01-02' } // Newer
        ];

         render(
            <AdoptionCenter 
              petsForAdoption={petsWithDates} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );
        
        const sortSelect = screen.getByLabelText('sortByLabel');
        fireEvent.change(sortSelect, { target: { value: 'newest' } });
        
        // This is a bit tricky to test visually without checking DOM order, 
        // but we can check if the sort function in searchService was called or logic applied.
        // For this unit test, we'll verify the 'rankPets' service is called with the sort param.
        
        await waitFor(() => {
             expect(searchService.rankPets).toHaveBeenCalledWith(
                expect.anything(), 
                expect.objectContaining({ sortBy: 'newest' })
            );
        });
    });

    it('should apply multiple filters simultaneously (Breed + Size)', async () => {
        render(
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );

        // Filter by Dog (Breed/Type simulation) and Large
        const breedSelect = screen.getByLabelText('filterByBreedLabel');
        fireEvent.change(breedSelect, { target: { value: 'Golden Retriever' } });
        
        const sizeSelect = screen.getByLabelText('filterBySizeLabel');
        fireEvent.change(sizeSelect, { target: { value: 'Large' } });

        await waitFor(() => {
            expect(screen.getByText('Buddy')).toBeInTheDocument();
            expect(screen.queryByText('Mittens')).toBeNull(); // Cat, Small
            expect(screen.queryByText('Max')).toBeNull(); // Dog, Large but wrong breed
        });
    });

    it('should display AI match explanation when filters are active', async () => {
        render(
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );

        const sizeSelect = screen.getByLabelText('filterBySizeLabel');
        fireEvent.change(sizeSelect, { target: { value: 'Small' } });

        // Wait for Mittens to be the only one (proves filter worked)
        await waitFor(() => {
            expect(screen.getByText('Mittens')).toBeInTheDocument();
            expect(screen.queryByText('Buddy')).toBeNull();
        });

        // Now wait for the explanation
        await waitFor(() => {
            expect(screen.getByText(/Matches perfectly!/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('should display action buttons (Favorite & Share) on cards', async () => {
        render(
            <AdoptionCenter 
              petsForAdoption={mockPets} 
              onInquire={vi.fn()} 
              goBack={vi.fn()} 
              currentUser={null} 
              isLoading={false} 
            />
        );

        await waitFor(() => {
            expect(screen.getAllByTestId('favorite-button').length).toBeGreaterThan(0);
            expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0);
        });
    });
});