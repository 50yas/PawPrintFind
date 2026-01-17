import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SharePetModal } from './SharePetModal';
import { PetProfile } from '../types';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({ toDataURL: () => 'data:image/png;base64,fake' })),
}));

// Mock Translations
vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({ t: (key: string) => key }),
}));

// Mock Modal - we just render children because Modal might use Portals which are tricky in basic tests
vi.mock('./Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SharePetModal', () => {
  const mockPet: PetProfile = {
    id: '123',
    name: 'CyberDog',
    breed: 'Robo-Terrier',
    age: '2',
    photos: [],
    ownerEmail: 'test@test.com',
    status: 'owned',
    isLost: false,
    guardianEmails: [],
    homeLocations: [],
    lastSeenLocation: null,
    searchRadius: 0,
    sightings: [],
    videoAnalysis: '',
    audioNotes: '',
    healthChecks: [],
    vetLinkStatus: 'unlinked',
    weight: '10kg',
    behavior: 'Good',
    aiIdentityCode: 'BIO-123',
    aiPhysicalDescription: 'Shiny',
  };

  const mockProps = {
    pet: mockPet,
    friends: ['friend@test.com'],
    onClose: vi.fn(),
    onShare: vi.fn(),
  };

  it('renders tabs', () => {
    render(<SharePetModal {...mockProps} />);
    expect(screen.getByText('Instagram / TikTok')).toBeInTheDocument();
    expect(screen.getByText('shareWithFriendsButton')).toBeInTheDocument();
  });

  it('switches to Social tab by default', () => {
    render(<SharePetModal {...mockProps} />);
    expect(screen.getByText('AI Biometric Card')).toBeInTheDocument();
    expect(screen.getByText('Download for Story')).toBeInTheDocument();
  });

  it('switches to Friends tab', () => {
    render(<SharePetModal {...mockProps} />);
    fireEvent.click(screen.getByText('shareWithFriendsButton'));
    expect(screen.getByText('friend@test.com')).toBeInTheDocument();
  });
});
