import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AIIdentikitCard } from './AIIdentikitCard';
import { PetProfile } from '../types';

describe('AIIdentikitCard', () => {
  const mockPet: PetProfile = {
    id: '123',
    name: 'CyberDog',
    species: 'Dog',
    breed: 'Robo-Terrier',
    color: 'Chrome',
    size: 'Medium',
    gender: 'Male',
    age: '2',
    description: 'A futuristic dog.',
    photos: [{ id: 'p1', url: 'https://example.com/dog.jpg', marks: [], description: 'front' }],
    ownerId: 'owner1',
    status: 'lost',
    createdAt: Date.now(),
    lastSeenLocation: { latitude: 0, longitude: 0 },
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
    expect(screen.getByText(/BIOMETRIC IDENTITY/i)).toBeInTheDocument();
  });
});
