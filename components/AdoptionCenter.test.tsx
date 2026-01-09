
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

vi.mock('./ui', () => ({
  GlassCard: ({ children, className }: any) => <div className={className} data-testid="glass-card">{children}</div>,
  GlassButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  CinematicImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('./ui/SkeletonLoader', () => ({
  CardSkeleton: () => <div data-testid="card-skeleton">Skeleton</div>,
}));

vi.mock('./AdoptionMap', () => ({
  AdoptionMap: () => <div data-testid="adoption-map">AdoptionMap</div>,
}));

const mockPets: PetProfile[] = [
  {
    id: '1',
    name: 'Buddy',
    status: 'forAdoption',
    breed: 'Golden Retriever',
    age: '2 years',
    photos: [{ url: 'buddy.jpg' }],
    behavior: 'Playful',
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

  it('should render pets when isLoading is false', () => {
    render(
      <AdoptionCenter 
        petsForAdoption={mockPets} 
        onInquire={vi.fn()} 
        goBack={vi.fn()} 
        currentUser={null} 
        isLoading={false} 
      />
    );
    
    expect(screen.queryByTestId('card-skeleton')).toBeNull();
    expect(screen.getByText('Buddy')).toBeInTheDocument();
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

    expect(screen.getByTestId('adoption-map')).toBeInTheDocument();
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

    const inquireBtn = screen.getByText('inquireToAdoptButton');
    fireEvent.click(inquireBtn);

    expect(mockOnInquire).toHaveBeenCalledWith(mockPets[0]);
  });
});
