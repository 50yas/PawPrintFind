
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { AdoptionCenter } from './AdoptionCenter';
import { PetProfile, User } from '../types';

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

vi.mock('../services/searchService', () => ({
    searchService: {
        rankPets: vi.fn((pets) => Promise.resolve(pets)),
        saveSearch: vi.fn().mockResolvedValue('search123'),
    },
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
    photos: [{ url: 'mittens.jpg' }],
    behavior: 'Quiet',
  }
] as any;

describe('AdoptionCenter Component', () => {
  it('should render skeletons when isLoading is true', () => {
    render(
      <AdoptionCenter 
        petsForAdoption={[]} 
        onInquire={vi.fn()} 
        goBack={vi.fn()} 
        currentUser={null} 
        isLoading={true} 
      />
    );
    
    const skeletons = screen.getAllByTestId('card-skeleton');
    expect(skeletons).toHaveLength(6);
  });

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
    
    expect(await screen.findByText('Buddy')).toBeInTheDocument();
    expect(screen.queryByTestId('card-skeleton')).toBeNull();
  });

  it('should switch to map view and render AdoptionMap', async () => {
    const { container } = render(
      <AdoptionCenter 
        petsForAdoption={mockPets} 
        onInquire={vi.fn()} 
        goBack={vi.fn()} 
        currentUser={null} 
        isLoading={false} 
      />
    );

    // Find all buttons inside the view mode toggle
    const buttons = screen.getAllByRole('button');
    // The map button is the one with the map icon (last one in the group)
    // We can filter by SVG content or just index
    const mapButton = buttons.find(b => b.innerHTML.includes('M5.05'));
    
    expect(mapButton).toBeDefined();

    await act(async () => {
        fireEvent.click(mapButton!);
    });

    expect(await screen.findByTestId('adoption-map')).toBeInTheDocument();
  });

  it('calls onInquire when Adopt Me button is clicked in grid view', () => {
    const mockOnInquire = vi.fn();
    const authenticatedUser: User = { uid: '1', email: 'test@test.com', roles: ['owner'], activeRole: 'owner', friends: [], friendRequests: [], points: 0, badges: [] };
    
    render(
      <AdoptionCenter 
        petsForAdoption={mockPets} 
        onInquire={mockOnInquire} 
        goBack={vi.fn()} 
        currentUser={authenticatedUser} 
        isLoading={false} 
      />
    );

    const inquireBtns = screen.getAllByText('inquireToAdoptButton');
    fireEvent.click(inquireBtns[0]);

    expect(mockOnInquire).toHaveBeenCalledWith(mockPets[0]);
  });

  it('filters pets when Smart Search returns results', async () => {
    render(
      <AdoptionCenter 
        petsForAdoption={mockPets} 
        onInquire={vi.fn()} 
        goBack={vi.fn()} 
        currentUser={null} 
        isLoading={false} 
      />
    );

    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Mittens')).toBeInTheDocument();

    const searchBtn = screen.getByText('Search Cat');
    fireEvent.click(searchBtn);

    await waitFor(() => {
        expect(screen.queryByText('Buddy')).toBeNull();
    });
    expect(await screen.findByText('Mittens')).toBeInTheDocument();
  });
});
