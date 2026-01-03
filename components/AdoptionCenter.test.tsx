
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { AdoptionCenter } from './AdoptionCenter';
import { PetProfile } from '../types';

// Mock Dependencies
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
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

const mockPets: PetProfile[] = [
  {
    id: '1',
    name: 'Buddy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '2 years',
    gender: 'male',
    size: 'Large',
    color: 'Golden',
    description: 'Friendly dog',
    behavior: 'Playful',
    photos: [{ url: 'buddy.jpg', id: 'p1' }],
    status: 'adoptable',
    lastSeenDate: '2023-01-01',
    contactInfo: { name: 'Shelter', phone: '123' },
    createdAt: 123,
    updatedAt: 123
  }
];

describe('AdoptionCenter Skeleton Loading', () => {
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
    
    // Expect 6 skeletons as per the code
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
});
