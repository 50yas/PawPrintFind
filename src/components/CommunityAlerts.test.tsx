
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CommunityAlerts } from './CommunityAlerts';
import { PetProfile, User } from '../types';

// Mock EmojiSwitcher to verify it's used
vi.mock('./EmojiSwitcher', () => ({
  EmojiSwitcher: ({ children, onClick }: any) => (
    <button data-testid="emoji-switcher" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('../hooks/useTranslations', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('CommunityAlerts Component', () => {
  const mockUser: User = {
    uid: '123',
    email: 'test@example.com',
    roles: ['owner'],
    activeRole: 'owner',
    friends: [],
    friendRequests: [],
    points: 0,
    badges: []
  };

  const mockAlerts: PetProfile[] = [
    {
      id: '1',
      ownerEmail: 'other@example.com',
      guardianEmails: [],
      status: 'owned',
      vetLinkStatus: 'unlinked',
      isLost: true,
      name: 'Buddy',
      breed: 'Golden Retriever',
      age: '2 years',
      weight: '25kg',
      behavior: 'Friendly',
      photos: [{ id: '1', url: 'buddy.jpg', timestamp: 0, marks: [], description: 'Lost dog' }],
      homeLocations: [],
      lastSeenLocation: { latitude: 0, longitude: 0 },
      searchRadius: null,
      sightings: [],
      videoAnalysis: '',
      audioNotes: '',
      healthChecks: [],
      type: 'dog'
    }
  ];

  it('should render EmojiSwitcher for report sighting button', () => {
    render(<CommunityAlerts alerts={mockAlerts} currentUser={mockUser} onReportSighting={() => {}} />);
    
    expect(screen.getByTestId('emoji-switcher')).toBeInTheDocument();
    expect(screen.getByText(/Segnala Avvistamento|reportSightingButton/i)).toBeInTheDocument();
  });
});
