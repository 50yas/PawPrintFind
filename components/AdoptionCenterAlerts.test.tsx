
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

const mockAddSnackbar = vi.fn();
vi.mock('../contexts/SnackbarContext', () => ({
  useSnackbar: () => ({
    addSnackbar: mockAddSnackbar,
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

describe('AdoptionCenter Alerts Replacement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('should call addSnackbar instead of alert when user is not logged in', () => {
    render(
      <AdoptionCenter 
        petsForAdoption={mockPets} 
        onInquire={vi.fn()} 
        goBack={vi.fn()} 
        currentUser={null} 
        isLoading={false} 
      />
    );
    
    const inquireButton = screen.getByText('inquireToAdoptButton');
    fireEvent.click(inquireButton);

    // Expect alert NOT to be called
    expect(window.alert).not.toHaveBeenCalled();
    
    // Expect addSnackbar TO be called
    expect(mockAddSnackbar).toHaveBeenCalledWith('loginToAdoptWarning', 'error');
  });
});
