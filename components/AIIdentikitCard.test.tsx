import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AIIdentikitCard } from './AIIdentikitCard';
import { PetProfile } from '../types';
import React from 'react';

// Mock translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => {
        if (key === 'genderMale') return 'Male';
        if (key === 'genderUnknown') return 'Unknown';
        return key;
    },
  }),
}));

describe('AIIdentikitCard', () => {
  const mockPet: PetProfile = {
    id: '123',
    name: 'CyberDog',
    breed: 'Robo-Terrier',
    color: 'Chrome',
    size: 'Medium',
    gender: 'Male',
    age: '2',
    description: 'A futuristic dog.',
    photos: [{ id: 'p1', url: 'https://example.com/dog.jpg', marks: [], description: 'front' }],
    ownerEmail: 'owner1',
    guardianEmails: [],
    status: 'owned',
    isLost: true,
    lastSeenLocation: { latitude: 0, longitude: 0 },
    searchRadius: 0,
    vetLinkStatus: 'unlinked',
    weight: '10kg',
    behavior: 'Friendly',
    homeLocations: [],
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
    aiIdentityCode: 'BIO-123-X',
    aiPhysicalDescription: 'Metallic sheen, glowing eyes.'
  };

  it('renders the pet name and identity code', () => {
    render(<AIIdentikitCard pet={mockPet} />);
    expect(screen.getByText('CyberDog')).toBeInTheDocument();
    expect(screen.getByText('BIO-123-X')).toBeInTheDocument();
  });

  it('renders the breed and age', () => {
    render(<AIIdentikitCard pet={mockPet} />);
    expect(screen.getByText('Robo-Terrier')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays the futuristic header', () => {
    render(<AIIdentikitCard pet={mockPet} />);
    expect(screen.getByText('biometricVerified')).toBeInTheDocument();
  });

  it('localizes the gender correctly', () => {
    const malePet = { ...mockPet, gender: 'Male' };
    const { rerender } = render(<AIIdentikitCard pet={malePet} />);
    // Note: If using real translations, it will be 'Male' or 'Maschio' etc.
    // If it's falling back to key or using English, it will be 'Male'.
    expect(screen.getByText(/Male/i)).toBeInTheDocument();

    const unknownPet = { ...mockPet, gender: undefined };
    rerender(<AIIdentikitCard pet={unknownPet} />);
    // Should show localized Unknown
    expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
  });
});
